from app import create_app
from flask import jsonify
from flask_cors import CORS

app = create_app()

# Add test route
@app.route('/')
def test_route():
    return jsonify({
        'status': 'success',
        'message': 'Backend is working!',
        'endpoints': {
            'auth': '/api/auth',
            'reports': '/api/reports',
            'templates': '/api/templates'
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)