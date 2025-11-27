from flask import Flask, jsonify, request
from flask_cors import CORS
from .extensions import db
# Импортируем модели сразу, чтобы SQLAlchemy знала о них при создании таблиц
from .models import User, Todo, Category, SubTask, Attachment
from .routes import auth, todos, categories, upload 
import os

def create_app():
    app = Flask(__name__)
    
    # [FIX] КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ CORS
    # support_credentials=False ОБЯЗАТЕЛЬНО, если origins="*"
    # Иначе Android WebView заблокирует запрос.
    CORS(app, resources={r"/api/*": {"origins": "*"}}, 
         support_credentials=False, 
         allow_headers=["Content-Type", "X-User-Id", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Config
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # Database Logic
    db_url = os.environ.get('DATABASE_URL')
    
    if db_url:
        # Fix for Render PostgreSQL internal URL format
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        # Local Development (SQLite)
        db_path = os.path.join(BASE_DIR, '../todo.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    upload_folder = os.path.join(BASE_DIR, '../uploads')
    app.config['UPLOAD_FOLDER'] = upload_folder
    app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 

    os.makedirs(upload_folder, exist_ok=True)
    
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(auth.bp)
    app.register_blueprint(todos.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(upload.bp)

    @app.route('/api/init', methods=['GET'])
    def init_db():
        with app.app_context():
            from . import models 
            db.create_all()
        return jsonify({"status": "Database initialized"})
    
    # Auto-create tables
    with app.app_context():
        db.create_all()
        
    return app