from flask import request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import pandas as pd
import json
import numpy as np
from app.models.file import UploadedFile
from app.models.report import GeneratedReport
from app import db
from app.config import Config
from app.utils.ai_analysis import (
    generate_natural_language_insights,
    detect_anomalies,
    generate_trend_forecast,
    create_interactive_chart,
    create_correlation_matrix
)
from app.utils.file_handling import validate_file_extension
from app.utils.email import send_report_notification

def serialize_dataframe(df):
    """Convert DataFrame to JSON-serializable format"""
    if isinstance(df, pd.DataFrame):
        return json.loads(df.to_json(orient='records', date_format='iso'))
    return df

def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part', 'code': 400}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file', 'code': 400}), 400
    
    if not validate_file_extension(file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file type', 'code': 400}), 400

    template_id = request.form.get('template_id', type=int)
    if not template_id:
        return jsonify({'status': 'error', 'message': 'Template ID is required', 'code': 400}), 400

    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{secure_filename(file.filename)}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)
    file_size = os.path.getsize(filepath)
    
    uploaded_file = UploadedFile(
        filename=file.filename,
        file_path=filepath,
        file_size=file_size,
        user_id=current_user.id
    )
    db.session.add(uploaded_file)
    db.session.commit()
    
    try:
        report_data = generate_report_sync(filepath, template_id)
        
        report = GeneratedReport(
            template_id=template_id,
            file_id=uploaded_file.id,
            report_data=report_data
        )
        db.session.add(report)
        
        uploaded_file.status = 'completed'
        db.session.commit()
        
        if Config.EMAIL_NOTIFICATIONS:
            send_report_notification(uploaded_file.id, report.id)
        
        return jsonify({
            'status': 'success',
            'message': 'File uploaded and report generated',
            'file_id': uploaded_file.id,
            'report_id': report.id,
            'filename': file.filename
        }), 201
        
    except Exception as e:
        db.session.rollback()
        uploaded_file.status = 'error'
        db.session.commit()
        
        if os.path.exists(filepath):
            os.remove(filepath)
            
        return jsonify({
            'status': 'error',
            'message': f'Report generation failed: {str(e)}',
            'file_id': uploaded_file.id,
            'code': 500
        }), 500

def generate_report_sync(file_path, template_id):
    """Synchronous report generation"""
    try:
        if file_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
        
        # Convert datetime columns to ISO format strings
        for col in df.select_dtypes(include=['datetime']).columns:
            df[col] = df[col].apply(lambda x: x.isoformat() if pd.notnull(x) else None)
        
        # Convert all numpy types to native Python types
        numeric_df = df.select_dtypes(include=['number'])
        for col in numeric_df.columns:
            df[col] = df[col].apply(
                lambda x: float(x) if isinstance(x, (np.floating, np.float64)) 
                else int(x) if isinstance(x, (np.integer, np.int64)) 
                else x
            )
        
        # Generate report data
        report_data = {
            'summary_stats': {
                'row_count': int(len(df)),
                'columns': list(df.columns),
                'numeric_stats': json.loads(numeric_df.describe().to_json()),
                'insights': generate_natural_language_insights(df)
            },
            'visualizations': {},
            'ai_analysis': {}
        }
        
        # Recursive function to convert numpy types
        def convert_numpy_types(obj):
            if isinstance(obj, (np.integer, np.int64)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float64)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, pd.Timestamp):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [convert_numpy_types(item) for item in obj]
            return obj
        
        # Generate AI analysis
        anomalies = detect_anomalies(df)
        if anomalies:
            report_data['ai_analysis']['anomalies'] = convert_numpy_types(anomalies)
        
        date_cols = [col for col in df.columns if 'date' in col.lower()]
        if date_cols and len(df) > 10:
            for num_col in numeric_df.columns:
                forecast = generate_trend_forecast(df, num_col, date_cols[0])
                if forecast:
                    report_data['ai_analysis'][f'{num_col}_forecast'] = convert_numpy_types(forecast)
        
        # Create visualizations
        try:
            if 'revenue' in df.columns and 'date' in df.columns:
                report_data['visualizations']['revenue_trend'] = create_interactive_chart(df, 'date', 'revenue', 'Revenue Trend')
            
            if len(numeric_df.columns) > 1:
                report_data['visualizations']['correlation_matrix'] = create_correlation_matrix(df)
        except Exception as e:
            print(f"Visualization generation failed: {str(e)}")
        
        # Convert all numpy types in the final report data
        report_data = convert_numpy_types(report_data)
        
        return report_data
        
    except Exception as e:
        raise Exception(f"Error generating report: {str(e)}")


def list_reports(current_user):
    reports = db.session.query(
        GeneratedReport.id.label('report_id'),
        UploadedFile.id.label('file_id'),
        UploadedFile.filename,
        UploadedFile.upload_date,
        UploadedFile.status,
        GeneratedReport.created_at.label('report_date')
    ).join(
        UploadedFile, GeneratedReport.file_id == UploadedFile.id
    ).filter(
        UploadedFile.user_id == current_user.id
    ).order_by(
        GeneratedReport.created_at.desc()
    ).all()
    
    return jsonify({
        'status': 'success',
        'data': {
            'reports': [
                {
                    'report_id': r.report_id,
                    'file_id': r.file_id,
                    'filename': r.filename,
                    'upload_date': r.upload_date.isoformat() if r.upload_date else None,
                    'status': r.status,
                    'report_date': r.report_date.isoformat() if r.report_date else None
                }
                for r in reports
            ]
        }
    }), 200

def get_report(current_user, report_id):
    try:
        # Query the report and file together
        report = db.session.query(
            GeneratedReport,
            UploadedFile
        ).join(
            UploadedFile, GeneratedReport.file_id == UploadedFile.id
        ).filter(
            GeneratedReport.id == report_id,
            UploadedFile.user_id == current_user.id
        ).first()

        if not report:
            return jsonify({
                'status': 'error',
                'message': 'Report not found or not authorized',
                'code': 404
            }), 404

        # Destructure the result tuple
        generated_report, uploaded_file = report

        if uploaded_file.status == 'processing':
            return jsonify({
                'status': 'processing',
                'message': 'Report is still being generated',
                'code': 202
            }), 202

        # Handle the report data
        report_data = generated_report.report_data
        if isinstance(report_data, str):
            try:
                report_data = json.loads(report_data)
            except json.JSONDecodeError:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid report data format',
                    'code': 500
                }), 500

        return jsonify({
            'status': 'success',
            'data': {
                'report': {
                    'id': generated_report.id,
                    'report_data': report_data,
                    'filename': uploaded_file.filename,
                    'upload_date': uploaded_file.upload_date.isoformat() if uploaded_file.upload_date else None
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'code': 500
        }), 500