from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
import numpy as np
import pandas as pd
from datetime import datetime
import json
from decimal import Decimal

db = SQLAlchemy()
migrate = Migrate()

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, pd.Series):
            return obj.to_dict()
        elif isinstance(obj, pd.DataFrame):
            return obj.to_dict(orient='records')
        elif isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def create_app():
    app = Flask(__name__,static_folder='static')
    app.config.from_object('app.config.Config')
    app.json_encoder = CustomJSONEncoder
    
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    from app.routes.auth import auth_bp
    from app.routes.reports import reports_bp
    from app.routes.templates import templates_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(templates_bp)
    
    from app.utils.error_handlers import handle_exception
    app.register_error_handler(Exception, handle_exception)
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['MODEL_STORAGE'], exist_ok=True)
    
    return app