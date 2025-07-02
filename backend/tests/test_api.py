import unittest
import os
import tempfile
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app import create_app, db
from app.models.user import User
import pandas as pd

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            
            # Create test user
            test_user = User(email='test@example.com', name='Test User')
            test_user.set_password('password123')
            db.session.add(test_user)
            db.session.commit()

            # Create test CSV
            df = pd.DataFrame({
                'date': pd.date_range(start='1/1/2023', periods=5),
                'revenue': [100, 150, 200, 180, 220],
                'expenses': [80, 90, 110, 95, 105]
            })
            self.test_csv_path = os.path.join(self.app.config['UPLOAD_FOLDER'], 'test.csv')
            df.to_csv(self.test_csv_path, index=False)

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_user_registration(self):
        response = self.client.post('/api/auth/register', 
            json={'email': 'new@example.com', 'password': 'secure123', 'name': 'New User'})
        self.assertEqual(response.status_code, 201)
        self.assertIn('token', response.json)

    def test_file_upload(self):
        # First login
        login = self.client.post('/api/auth/login',
            json={'email': 'test@example.com', 'password': 'password123'})
        token = login.json['token']
        
        with open(self.test_csv_path, 'rb') as f:
            response = self.client.post(
                '/api/reports/upload',
                data={'file': (f, 'test.csv'), 'template_id': 1},
                headers={'Authorization': f'Bearer {token}'},
                content_type='multipart/form-data'
            )
        self.assertEqual(response.status_code, 201)
        self.assertIn('file_id', response.json)

if __name__ == '__main__':
    unittest.main()