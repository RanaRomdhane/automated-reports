from flask import Blueprint, jsonify
from app.utils.decorators import token_required
from app.models.report import ReportTemplate
from app import db

templates_bp = Blueprint('templates', __name__, url_prefix='/api/templates')

@templates_bp.route('', methods=['GET'])
@token_required
def list_templates(current_user):
    templates = ReportTemplate.query.all()
    return jsonify({
        'status': 'success',
        'data': {
            'templates': [
                {'id': t.id, 'name': t.name, 'description': t.description}
                for t in templates
            ]
        }
    }), 200