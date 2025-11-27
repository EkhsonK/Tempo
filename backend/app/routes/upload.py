from flask import Blueprint, request, jsonify, current_app, send_from_directory
import os
from werkzeug.utils import secure_filename
import time
from PIL import Image  # Logic for image compression

bp = Blueprint('upload', __name__, url_prefix='/api/upload')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'mp3', 'wav'}
MAX_TOTAL_STORAGE = 1024 * 1024 * 1024  # 1 GB in bytes
MAX_FILE_SIZE = 15 * 1024 * 1024        # 15 MB max per single file

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_storage_usage(folder):
    """Calculates total size of the upload directory."""
    total_size = 0
    if not os.path.exists(folder):
        return 0
    for dirpath, _, filenames in os.walk(folder):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return total_size

def compress_image(file_path):
    """Resizes and compresses images to save space."""
    try:
        with Image.open(file_path) as img:
            # Convert RGBA to RGB if necessary (for saving as JPEG)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Resize if width > 1920px (Full HD is enough for tasks)
            if img.width > 1920:
                ratio = 1920 / img.width
                new_height = int(img.height * ratio)
                img = img.resize((1920, new_height), Image.Resampling.LANCZOS)
            
            # Save with optimization
            img.save(file_path, "JPEG", quality=70, optimize=True)
            return True
    except Exception as e:
        print(f"Compression error: {e}")
        return False

@bp.route('', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # 1. Check File Size (Content Length)
    # Note: request.content_length is not always reliable, but good for a quick check
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    
    if file_length > MAX_FILE_SIZE:
        return jsonify({"error": "File too large. Max 15MB allowed."}), 413

    # 2. Check Total Storage Quota
    current_usage = get_current_storage_usage(current_app.config['UPLOAD_FOLDER'])
    if current_usage + file_length > MAX_TOTAL_STORAGE:
        return jsonify({"error": "Storage full (1GB Limit Reached). Delete old files."}), 507

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{int(time.time())}_{filename}"
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(save_path)
        
        # 3. Optimize if it's an image
        ext = filename.rsplit('.', 1)[1].lower()
        if ext in {'jpg', 'jpeg', 'png'}:
            compress_image(save_path)

        # 4. Generate URL (Dynamic for Render vs Local)
        base_url = os.environ.get('RENDER_EXTERNAL_URL')
        if not base_url:
            base_url = request.host_url.rstrip('/')
            
        file_url = f"{base_url}/api/upload/file/{unique_filename}"
        
        return jsonify({"url": file_url, "name": filename, "type": "file"})

    return jsonify({"error": "File type not allowed"}), 400

@bp.route('/file/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)