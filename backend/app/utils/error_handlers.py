from flask import jsonify
from werkzeug.exceptions import HTTPException
import traceback

def handle_exception(e):
    if isinstance(e, HTTPException):
        return jsonify({
            "status": "error",
            "message": e.description,
            "code": e.code
        }), e.code
    
    traceback.print_exc()
    return jsonify({
        "status": "error",
        "message": "Internal Server Error",
        "error": str(e),
        "code": 500
    }), 500