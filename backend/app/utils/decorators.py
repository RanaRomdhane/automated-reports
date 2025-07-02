from functools import wraps
from flask import request, jsonify
import jwt
from app.models.user import User
from app.config import Config

def validate_json(schema):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'status': 'error', 'message': 'Request must be JSON', 'code': 400}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'status': 'error', 'message': 'No data provided', 'code': 400}), 400
                
            for field, field_type in schema.items():
                if field not in data:
                    return jsonify({'status': 'error', 'message': f'Missing field: {field}', 'code': 400}), 400
                if not isinstance(data[field], field_type):
                    return jsonify({'status': 'error', 'message': f'Invalid type for {field}', 'code': 400}), 400
                    
            return f(*args, **kwargs)
        return wrapper
    return decorator

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing!', 'code': 401}), 401
            
        user = User.verify_token(token)
        if not user:
            return jsonify({'status': 'error', 'message': 'Invalid token!', 'code': 401}), 401
            
        return f(user, *args, **kwargs)
    return decorated