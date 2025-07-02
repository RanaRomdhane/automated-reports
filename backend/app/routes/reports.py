from flask import Blueprint, request, jsonify, send_file
from app.utils.decorators import token_required
from app.services.report_service import (
    upload_file,
    list_reports,
    get_report,
    export_pdf
)

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/upload', methods=['POST'])
@token_required
def upload(current_user):
    return upload_file(current_user)

@reports_bp.route('', methods=['GET'])
@token_required
def list_all(current_user):
    return list_reports(current_user)

@reports_bp.route('/<int:report_id>', methods=['GET'])
@token_required
def get(current_user, report_id):
    return get_report(current_user, report_id)

@reports_bp.route('/<int:report_id>/export', methods=['GET'])
@token_required
def export_report(current_user, report_id):
    return export_pdf(current_user, report_id)