from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import User, Category
from ..extensions import db

bp = Blueprint('auth', __name__, url_prefix='/api')

# Helper
def get_user_id():
    uid = request.headers.get('X-User-Id')
    return int(uid) if uid else None

@bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"error": "Username already taken"}), 400
    
    hashed_pw = generate_password_hash(data['password'])
    new_user = User(username=data['username'], password_hash=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    
    # Default Categories
    for cat in ["Общее", "Работа", "Личное"]:
        db.session.add(Category(name=cat, user_id=new_user.id))
    db.session.commit()

    return jsonify({"user_id": new_user.id, "username": new_user.username})

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        return jsonify({"user_id": user.id, "username": user.username})
    return jsonify({"error": "Invalid credentials"}), 401

# [NEW] Get User Settings
@bp.route('/user', methods=['GET'])
def get_user_settings():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(uid)
    if not user: return jsonify({"error": "User not found"}), 404

    return jsonify({
        "theme": user.theme,
        "time_format": user.time_format,
        "background_url": user.background_url
    })

# [NEW] Update User Settings
@bp.route('/user', methods=['PUT'])
def update_user_settings():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(uid)
    if not user: return jsonify({"error": "User not found"}), 404

    data = request.json
    
    if 'theme' in data: 
        user.theme = data['theme']
    if 'time_format' in data: 
        user.time_format = data['time_format']
    if 'background_url' in data: 
        user.background_url = data['background_url']
    
    db.session.commit()
    return jsonify({"message": "Settings updated", "background_url": user.background_url})