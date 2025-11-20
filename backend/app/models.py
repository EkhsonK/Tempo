from .extensions import db
import json
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    
    # [NEW] Settings columns
    theme = db.Column(db.String(20), default='dark')
    time_format = db.Column(db.String(10), default='12h')
    background_url = db.Column(db.Text, nullable=True)

    todos = db.relationship('Todo', backref='owner', lazy=True)
    categories = db.relationship('Category', backref='owner', lazy=True)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    deadline = db.Column(db.String(50), nullable=True)
    lastModified = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    priority = db.Column(db.String(20), default='none')
    notes = db.Column(db.Text, nullable=True)
    reminder = db.Column(db.String(50), nullable=True)
    repeat = db.Column(db.String(50), nullable=True)
    
    subtasks = db.relationship('SubTask', backref='todo', cascade="all, delete-orphan", lazy=True)
    attachments = db.relationship('Attachment', backref='todo', cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'completed': self.completed,
            'deadline': self.deadline,
            'lastModified': self.lastModified,
            'category': self.category,
            'priority': self.priority,
            'notes': self.notes,
            'reminder': self.reminder,
            'repeat': self.repeat,
            'subtasks': [s.to_dict() for s in self.subtasks],
            'attachments': [a.to_dict() for a in self.attachments]
        }

class SubTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    todo_id = db.Column(db.Integer, db.ForeignKey('todo.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {'id': self.id, 'text': self.text, 'completed': self.completed}

class Attachment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    todo_id = db.Column(db.Integer, db.ForeignKey('todo.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    url = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'type': self.type, 'url': self.url}