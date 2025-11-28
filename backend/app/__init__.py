from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import db
# Import models so SQLAlchemy knows about them
from .models import User, Todo, Category, SubTask, Attachment
from .routes import auth, todos, categories, upload, ai 
import os
from sqlalchemy import text # Required for the fix

def create_app():
    app = Flask(__name__)
    
    # CORS: Allow requests from anywhere
    CORS(app, resources={r"/api/*": {"origins": "*"}}, 
         support_credentials=False, 
         allow_headers=["Content-Type", "X-User-Id", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Database Configuration
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    db_url = os.environ.get('DATABASE_URL')
    
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        db_path = os.path.join(BASE_DIR, '../todo.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Uploads Config
    upload_folder = os.path.join(BASE_DIR, '../uploads')
    app.config['UPLOAD_FOLDER'] = upload_folder
    app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 
    os.makedirs(upload_folder, exist_ok=True)
    
    db.init_app(app)
    
    # === [CRITICAL FIX] AUTO-MIGRATION LOGIC ===
    with app.app_context():
        # This block checks if the 'chat_history' column exists. 
        # If not, it runs the SQL command to add it properly.
        try:
            # Try to fetch models to ensure connection is okay
            db.create_all()
            
            # Check specifically for the missing column on Postgres
            if 'postgres' in str(db.engine.url):
                with db.engine.connect() as conn:
                    # Attempt to read the column. If it fails, we go to 'except'
                    conn.execute(text("SELECT chat_history FROM todo LIMIT 1"))
        except Exception as e:
            # If the column is missing (ProgrammingError), we add it manually
            print(f"⚠️ Migration needed: {e}")
            print("🔄 Adding 'chat_history' column to 'todo' table...")
            try:
                with db.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE todo ADD COLUMN chat_history TEXT DEFAULT '[]'"))
                    conn.commit()
                print("✅ Migration successful!")
            except Exception as migration_error:
                print(f"❌ Migration failed: {migration_error}")

    # Register Blueprints
    app.register_blueprint(auth.bp)
    app.register_blueprint(todos.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(upload.bp)
    app.register_blueprint(ai.bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "db": "connected" if db_url else "sqlite_local"})

    @app.route('/api/init', methods=['GET'])
    def init_db():
        with app.app_context():
            db.create_all()
        return jsonify({"status": "Database initialized"})
        
    return app