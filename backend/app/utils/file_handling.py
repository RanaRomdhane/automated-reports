import os
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'.xlsx', '.xls', '.csv'}

def validate_file_extension(filename):
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

def save_uploaded_file(file, upload_folder):
    if not file or file.filename == '':
        return None
    
    if not validate_file_extension(file.filename):
        return None
    
    os.makedirs(upload_folder, exist_ok=True)
    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    return filepath