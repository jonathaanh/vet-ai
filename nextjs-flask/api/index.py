from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from model import queryModel
from supabase import create_client, Client
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
    
@app.route("/api/ask_model", methods=['POST'])
def ask_model():
    try:
        data = request.get_json()
        query_text = data.get('text')
        
        if not query_text:
            return jsonify({'error': 'No text provided'}), 400
        
        response = queryModel(query_text)
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/get_files", methods=['GET'])
def get_files():
    try:
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            return jsonify({'error': 'Supabase URL or Key is missing'}), 500
        
        supabase: Client = create_client(url, key)
        response = supabase.storage.from_("vet-ai").list(
            "",
            {"limit": 100, "offset": 0, "sortBy": {"column": "name", "order": "desc"}},
        )
        return jsonify({'files': response}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/delete_file", methods=['POST'])
def delete_files():
    try:
        data = request.get_json()
        if not data or 'file_name' not in data:
            return jsonify({'error': 'No file part'}), 400
        file_name = data['file_name']
    
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        supabase: Client = create_client(url, key)
        response = supabase.storage.from_('vet-ai').remove([file_name])

        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/upload_file", methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
    
        filename = secure_filename(file.filename)

        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            return jsonify({'error': 'Supabase URL or Key is missing'}), 500
        
        supabase: Client = create_client(url, key)
        response = supabase.storage.from_("vet-ai").upload(
            file=file.read(),
            path=filename,
            file_options={"cache-control": "3600", "upsert": "false"},
        )

        return jsonify({'message': 'File uploaded successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5328, debug=True)