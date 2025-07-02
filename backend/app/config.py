import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@{os.getenv('MYSQL_HOST')}/{os.getenv('MYSQL_DB')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }
    
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
    
    SECRET_KEY = os.getenv('SECRET_KEY', '') or os.urandom(24).hex()
    JWT_EXPIRATION = int(os.getenv('JWT_EXPIRATION', 3600))
    
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    EMAIL_FROM = os.getenv('EMAIL_FROM', '')
    EMAIL_NOTIFICATIONS = os.getenv('EMAIL_NOTIFICATIONS', 'false').lower() == 'true'
    
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    MODEL_STORAGE = os.getenv('MODEL_STORAGE', 'models')
    
    @classmethod
    def validate(cls):
        if not cls.SMTP_USERNAME and cls.EMAIL_NOTIFICATIONS:
            raise ValueError("Email notifications enabled but no SMTP username provided")
        if not cls.SECRET_KEY or len(cls.SECRET_KEY) < 16:
            raise ValueError("Invalid or weak SECRET_KEY")