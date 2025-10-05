from functools import wraps
from flask import request, jsonify
import jwt
from config import Config  # adjust if your secret key is elsewhere

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['id']
        except Exception as e:
            return jsonify({'message': f'Token is invalid! {str(e)}'}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated
