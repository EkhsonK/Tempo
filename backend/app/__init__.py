from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import db
# Force load models immediately
from .models import User, Todo, Category, SubTask, Attachment
# Remove these imports from the top if they cause circular issues, 
# but keeping them is usually fine if structured correctly.
from .routes import auth, todos, categories, upload 
import os

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Config
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # [UPDATE] Database Configuration Logic
    # Check for DATABASE_URL environment variable (provided by Render)
    db_url = os.environ.get('DATABASE_URL')
    
    if db_url:
        # Production (Render PostgreSQL)
        # Fix for older SQLAlchemy versions expecting 'postgresql://' instead of 'postgres://'
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
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 

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
            # [CRITICAL FIX] Import models here to ensure they are known to SQLAlchemy
            from . import models 
            db.create_all()
        return jsonify({"status": "Database initialized"})
    
    # Also create tables on startup
    with app.app_context():
        # [CRITICAL FIX] Import models here too
        from . import models 
        db.create_all()
        
    return app