from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from app.config import Config

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100))
    
    files = db.relationship('UploadedFile', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def generate_token(self):
        return jwt.encode({
            'user_id': self.id,
            'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_EXPIRATION)
        }, Config.SECRET_KEY, algorithm="HS256")
    
    @staticmethod
    def verify_token(token):
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            return User.query.get(data['user_id'])
        except:
            return None