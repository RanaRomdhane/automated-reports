from flask import Blueprint, request, jsonify
from app.services.auth_service import register_user, login_user
from app.utils.decorators import validate_json

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@validate_json({'email': str, 'password': str})
def register():
    data = request.json
    return register_user(data)

@auth_bp.route('/login', methods=['POST'])
@validate_json({'email': str, 'password': str})
def login():
    data = request.json
    return login_user(data)