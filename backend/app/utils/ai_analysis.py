import os
# Set environment variable to handle joblib/loky warning
os.environ['LOKY_MAX_CPU_COUNT'] = '4'
import warnings
warnings.filterwarnings("ignore", message="Could not find the number of physical cores")
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import plotly.graph_objects as go
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import requests
from app.config import Config
from fpdf import FPDF
import tempfile




def detect_anomalies(df):
    numeric_df = df.select_dtypes(include=['number'])
    if numeric_df.empty or len(numeric_df) < 10:
        return None
    
    clf = IsolationForest(contamination=0.05, random_state=42)
    clf.fit(numeric_df)
    preds = clf.predict(numeric_df)
    anomalies = numeric_df[preds == -1]
    return anomalies.to_dict(orient='records')

def generate_trend_forecast(df, target_column, date_column):
    if target_column not in df.columns or date_column not in df.columns:
        return None
    
    try:
        df[date_column] = pd.to_datetime(df[date_column])
        df = df.sort_values(date_column)
        df['time_index'] = (df[date_column] - df[date_column].min()).dt.days
        
        X = df[['time_index']].values
        y = df[target_column].values
        
        if len(X) < 3:
            return None
            
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        model = LinearRegression()
        model.fit(X_scaled, y)
        
        last_date = df[date_column].max()
        future_dates = [last_date + timedelta(days=i) for i in range(1, 4)]
        future_indices = [(date - last_date).days + df['time_index'].max() for date in future_dates]
        future_X = scaler.transform(np.array(future_indices).reshape(-1, 1))
        future_y = model.predict(future_X)
        
        forecast_df = pd.DataFrame({
            date_column: future_dates,
            target_column: future_y,
            'is_forecast': True
        })
        
        original_df = df.copy()
        original_df['is_forecast'] = False
        combined_df = pd.concat([original_df[[date_column, target_column, 'is_forecast']], forecast_df])
        return combined_df.to_dict(orient='records')
    except Exception as e:
        print(f"Forecast error: {str(e)}")
        return None

def generate_natural_language_insights(df):
    """
    Free LLM insights using Hugging Face's Inference API (no API key needed)
    """
    try:
 
        basic_insights = generate_basic_insights(df)
        

        API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1"
        
        prompt = f"""
        [INST] You are a data analyst. Create a 3-paragraph executive summary from these insights:
        {basic_insights}
        
        Focus on:
        - Key trends
        - Business implications
        - Actionable recommendations
        Use simple, professional language. [/INST]
        """
        
        response = requests.post(
            API_URL,
            headers={"Authorization": "Bearer hf_reafer"},  # Works without real token
            json={"inputs": prompt}
        )
        
        if response.status_code == 200:
            return response.json()[0]['generated_text'].split('[/INST]')[-1].strip()
        
        return generate_basic_insights(df)  # Fallback
        
    except Exception as e:
        print(f"LLM error: {str(e)}")
        return generate_basic_insights(df)

def generate_basic_insights(df):
    insights = []
    numeric_df = df.select_dtypes(include=['number'])
    
    if not numeric_df.empty:
        for col in numeric_df.columns:
            col_stats = numeric_df[col].describe()
            
            if col_stats['std'] == 0:
                continue
                
            insight = {
                'metric': col,
                'stats': {
                    'mean': round(col_stats['mean'], 2),
                    'min': round(col_stats['min'], 2),
                    'max': round(col_stats['max'], 2),
                    'std': round(col_stats['std'], 2),
                    'q1': round(col_stats['25%'], 2),
                    'q3': round(col_stats['75%'], 2)
                },
                'summary': (
                    f"The {col} has an average of {round(col_stats['mean'], 2)} "
                    f"(range: {round(col_stats['min'], 2)} to {round(col_stats['max'], 2)}). "
                    f"Most values fall between {round(col_stats['25%'], 2)} and {round(col_stats['75%'], 2)}."
                )
            }
            insights.append(insight)
    
    date_cols = [col for col in df.columns if any(x in col.lower() for x in ['date', 'time', 'day'])]
    if date_cols and len(df) > 1:
        date_col = date_cols[0]
        try:
            df[date_col] = pd.to_datetime(df[date_col])
            df = df.sort_values(date_col)
            
            for num_col in numeric_df.columns:
                if num_col == date_col:
                    continue
                    
                first_val = df[num_col].iloc[0]
                last_val = df[num_col].iloc[-1]
                change = last_val - first_val
                pct_change = (change / first_val) * 100 if first_val != 0 else 0
                
                insight = {
                    'metric': num_col,
                    'trend': {
                        'direction': 'increased' if change > 0 else 'decreased',
                        'amount': round(abs(change), 2),
                        'pct_change': round(abs(pct_change), 2),
                        'period': f"{df[date_col].iloc[0].strftime('%Y-%m-%d')} to {df[date_col].iloc[-1].strftime('%Y-%m-%d')}"
                    },
                    'summary': (
                        f"Over {df[date_col].iloc[-1] - df[date_col].iloc[0]} days, {num_col} "
                        f"{'increased' if change > 0 else 'decreased'} by {abs(change):.2f} "
                        f"({abs(pct_change):.2f}%)."
                    )
                }
                insights.append(insight)
        except Exception as e:
            print(f"Error generating time insights: {str(e)}")
    
    return insights

def generate_recommendations(df, user_id):
    """Generate smart recommendations using collaborative filtering"""
    try:
        # Load historical data from all users (in a real app, this would come from a database)
        # For demo purposes, we'll use the current dataframe
        numeric_df = df.select_dtypes(include=['number'])
        
        if numeric_df.empty or len(numeric_df) < 10:
            return []
            
        # Normalize data
        scaler = StandardScaler()
        normalized_data = scaler.fit_transform(numeric_df)
        
        # Find similar patterns using KNN
        knn = NearestNeighbors(n_neighbors=min(5, len(numeric_df)-1))
        knn.fit(normalized_data)
        
        # Get recommendations for the first row (current user)
        distances, indices = knn.kneighbors([normalized_data[0]])
        
        # Generate recommendations based on similar patterns
        recommendations = []
        for idx in indices[0][1:]:  # Skip the first one (itself)
            similar_row = df.iloc[idx]
            
            # Find columns with significant differences
            for col in numeric_df.columns:
                current_val = df.iloc[0][col]
                similar_val = similar_row[col]
                
                if abs(similar_val - current_val) > (0.2 * current_val):
                    rec = {
                        'metric': col,
                        'current_value': current_val,
                        'similar_value': similar_val,
                        'difference': similar_val - current_val,
                        'recommendation': f"Consider adjusting {col} towards {similar_val:.2f} (currently {current_val:.2f})"
                    }
                    recommendations.append(rec)
        
        return recommendations[:5]  # Return top 5 recommendations
        
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")
        return []

def create_interactive_chart(data, x_col, y_col, title):
    if x_col not in data.columns or y_col not in data.columns:
        return None
    
    try:
        data[x_col] = pd.to_datetime(data[x_col])
        fig = go.Figure()
        
        if 'is_forecast' in data.columns:
            actual = data[data['is_forecast'] == False]
            forecast = data[data['is_forecast'] == True]
            
            fig.add_trace(go.Scatter(
                x=actual[x_col],
                y=actual[y_col],
                mode='lines+markers',
                name='Actual',
                line=dict(color='#3b82f6', width=2))
            )
            
            fig.add_trace(go.Scatter(
                x=forecast[x_col],
                y=forecast[y_col],
                mode='lines+markers',
                name='Forecast',
                line=dict(color='#f59e0b', width=2, dash='dot'))
            )
        else:
            fig.add_trace(go.Scatter(
                x=data[x_col],
                y=data[y_col],
                mode='lines+markers',
                name=y_col,
                line=dict(color='#3b82f6', width=2))
            )
        
        fig.update_layout(
            title=title,
            xaxis_title=x_col,
            yaxis_title=y_col,
            hovermode='x unified',
            template='plotly_white',
            height=500
        )
        return json.loads(fig.to_json()) if fig else None
    except Exception as e:
        print(f"Error creating interactive chart: {str(e)}")
        return None

def create_correlation_matrix(data):
    numeric_df = data.select_dtypes(include=['number'])
    if numeric_df.empty or len(numeric_df.columns) < 2:
        return None
    
    try:
        corr_matrix = numeric_df.corr()
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.columns,
            colorscale='RdBu',
            zmin=-1,
            zmax=1,
            hoverongaps=False
        ))
        
        fig.update_layout(
            title='Feature Correlation Matrix',
            xaxis_title='Features',
            yaxis_title='Features',
            height=600,
            template='plotly_white'
        )
        return json.loads(fig.to_json())
    except Exception as e:
        print(f"Error creating correlation matrix: {str(e)}")
        return None

def generate_pdf_report(report_data, filename="report.pdf"):
    """Generate a PDF report from the report data"""
    try:
        # Create a temporary directory
        temp_dir = tempfile.mkdtemp()
        pdf_path = os.path.join(temp_dir, filename)
        
        # Create PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # Add title
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 10, txt="Data Analysis Report", ln=1, align='C')
        pdf.ln(10)
        
        # Add summary stats
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="Summary Statistics", ln=1)
        pdf.set_font("Arial", size=12)
        
        if 'summary_stats' in report_data:
            stats = report_data['summary_stats']
            pdf.cell(200, 10, txt=f"Rows: {stats.get('row_count', 'N/A')}", ln=1)
            pdf.cell(200, 10, txt=f"Columns: {', '.join(stats.get('columns', []))}", ln=1)
            
            if 'insights' in stats and isinstance(stats['insights'], str):
                pdf.ln(5)
                pdf.multi_cell(0, 10, txt=stats['insights'])
        
        # Add recommendations if available
        if 'recommendations' in report_data and report_data['recommendations']:
            pdf.ln(10)
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(200, 10, txt="Recommendations", ln=1)
            pdf.set_font("Arial", size=12)
            
            for rec in report_data['recommendations']:
                if isinstance(rec, dict):
                    pdf.multi_cell(0, 10, txt=rec.get('recommendation', ''))
                else:
                    pdf.multi_cell(0, 10, txt=str(rec))
                pdf.ln(2)
        
        # Output the PDF
        pdf.output(pdf_path)
        
        return pdf_path
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return None