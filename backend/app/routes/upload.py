from flask import Blueprint, request, jsonify, current_app, send_from_directory
import os
from werkzeug.utils import secure_filename
import time

bp = Blueprint('upload', __name__, url_prefix='/api/upload')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'mp3', 'wav'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        # Secure the filename and append timestamp to prevent overwrites
        filename = secure_filename(file.filename)
        unique_filename = f"{int(time.time())}_{filename}"
        
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)
        
        # Return a permanent URL accessible by the frontend
        # Note: In production, you would serve this via Nginx or S3
        file_url = f"http://127.0.0.1:5000/api/upload/file/{unique_filename}"
        
        return jsonify({"url": file_url, "name": filename, "type": "file"})

    return jsonify({"error": "File type not allowed"}), 400

@bp.route('/file/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)