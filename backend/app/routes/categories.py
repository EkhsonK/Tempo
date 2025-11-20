from flask import Blueprint, request, jsonify
from ..models import Category, Todo
from ..extensions import db

bp = Blueprint('categories', __name__, url_prefix='/api/categories')

def get_user_id():
    uid = request.headers.get('X-User-Id')
    return int(uid) if uid else None

@bp.route('', methods=['GET'])
def get_categories():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    cats = Category.query.filter_by(user_id=uid).all()
    return jsonify([c.name for c in cats])

@bp.route('', methods=['POST'])
def add_category():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    name = request.json.get('name')
    
    if not Category.query.filter_by(user_id=uid, name=name).first():
        db.session.add(Category(name=name, user_id=uid))
        db.session.commit()
    return jsonify({"message": "Category added"})

@bp.route('', methods=['DELETE'])
def delete_category():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    name = request.args.get('name')
    
    cat = Category.query.filter_by(user_id=uid, name=name).first()
    if cat:
        # Optional: Delete todos in this category or move them to 'General'
        Todo.query.filter_by(user_id=uid, category=name).delete()
        db.session.delete(cat)
        db.session.commit()
    return jsonify({"message": "Category deleted"})