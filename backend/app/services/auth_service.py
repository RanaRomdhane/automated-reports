from app.models.user import User
from app import db
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import jwt
from app.config import Config

def register_user(data):
    if User.query.filter_by(email=data['email']).first():
        return {'status': 'error', 'message': 'User already exists', 'code': 400}, 400
        
    user = User(
        email=data['email'],
        name=data.get('name', '')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    token = user.generate_token()
    
    return {
        'status': 'success',
        'message': 'User registered successfully',
        'token': token,
        'user_id': user.id
    }, 201

def login_user(data):
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return {'status': 'error', 'message': 'Invalid credentials', 'code': 401}, 401
    
    token = user.generate_token()
    
    return {
        'status': 'success',
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name
        }
    }