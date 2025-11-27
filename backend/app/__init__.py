from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import db
# Импортируем модели, чтобы они точно создались в БД
from .models import User, Todo, Category, SubTask, Attachment
from .routes import auth, todos, categories, upload 
import os

def create_app():
    app = Flask(__name__)
    
    # [FIX] ГЛАВНОЕ ИСПРАВЛЕНИЕ СИНХРОНИЗАЦИИ
    # support_credentials=False позволяет использовать origins="*" (доступ отовсюду)
    # Это критически важно для работы мобильного приложения без ошибок сети.
    CORS(app, resources={r"/api/*": {"origins": "*"}}, 
         support_credentials=False, 
         allow_headers=["Content-Type", "X-User-Id", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Config
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # База данных
    db_url = os.environ.get('DATABASE_URL')
    
    if db_url:
        # Render требует postgresql:// вместо postgres://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        db_path = os.path.join(BASE_DIR, '../todo.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Папка для загрузки файлов
    upload_folder = os.path.join(BASE_DIR, '../uploads')
    app.config['UPLOAD_FOLDER'] = upload_folder
    app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 

    os.makedirs(upload_folder, exist_ok=True)
    
    db.init_app(app)
    
    # Регистрация маршрутов
    app.register_blueprint(auth.bp)
    app.register_blueprint(todos.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(upload.bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "db": "connected" if db_url else "sqlite_local"})

    @app.route('/api/init', methods=['GET'])
    def init_db():
        with app.app_context():
            from . import models 
            db.create_all()
        return jsonify({"status": "Database initialized"})
    
    # Автоматическое создание таблиц при запуске
    with app.app_context():
        db.create_all()
        
    return app