from flask import Blueprint, request, jsonify
from ..models import Todo, SubTask, Attachment
from ..extensions import db
from datetime import datetime

bp = Blueprint('todos', __name__, url_prefix='/api/todos')

def get_user_id():
    uid = request.headers.get('X-User-Id')
    return int(uid) if uid else None

@bp.route('', methods=['GET'])
def get_todos():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    todos = Todo.query.filter_by(user_id=uid).all()
    return jsonify([t.to_dict() for t in todos])

@bp.route('', methods=['POST'])
def add_todo():
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    data = request.json

    new_todo = Todo(
        user_id=uid,
        text=data['text'],
        completed=data.get('completed', False),
        deadline=data.get('deadline'),
        lastModified=data.get('lastModified', datetime.now().isoformat()),
        category=data.get('category', 'General'),
        priority=data.get('priority', 'none'),
        notes=data.get('notes', ''),
        reminder=data.get('reminder'),
        repeat=data.get('repeat')
    )
    db.session.add(new_todo)
    db.session.commit() # Commit to get ID

    # Handle Relations
    if 'subtasks' in data:
        for s in data['subtasks']:
            sub = SubTask(todo_id=new_todo.id, text=s['text'], completed=s['completed'])
            db.session.add(sub)
    
    if 'attachments' in data:
        for a in data['attachments']:
            att = Attachment(todo_id=new_todo.id, name=a['name'], type=a['type'], url=a['url'])
            db.session.add(att)
            
    db.session.commit()
    return jsonify(new_todo.to_dict())

@bp.route('/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    
    todo = Todo.query.filter_by(id=todo_id, user_id=uid).first()
    if not todo: return jsonify({"error": "Not found"}), 404
    
    data = request.json
    # Update scalar fields
    for field in ['text', 'completed', 'deadline', 'category', 'priority', 'notes', 'reminder', 'repeat', 'lastModified']:
        if field in data:
            setattr(todo, field, data[field])
    
    # Update Relations: Strategy -> Wipe and Recreate (Simplest for synchronization)
    # In a high-load app, you'd diff the lists, but for this scale, recreation ensures perfect sync.
    if 'subtasks' in data:
        SubTask.query.filter_by(todo_id=todo.id).delete()
        for s in data['subtasks']:
            db.session.add(SubTask(todo_id=todo.id, text=s['text'], completed=s['completed']))

    if 'attachments' in data:
        Attachment.query.filter_by(todo_id=todo.id).delete()
        for a in data['attachments']:
            db.session.add(Attachment(todo_id=todo.id, name=a['name'], type=a['type'], url=a['url']))

    db.session.commit()
    return jsonify(todo.to_dict())

@bp.route('/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    uid = get_user_id()
    if not uid: return jsonify({"error": "Unauthorized"}), 401
    
    todo = Todo.query.filter_by(id=todo_id, user_id=uid).first()
    if not todo: return jsonify({"error": "Not found"}), 404
    
    db.session.delete(todo)
    db.session.commit()
    return jsonify({"message": "Deleted"})