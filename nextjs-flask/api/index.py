from flask import Flask, request, jsonify
from model import queryModel
app = Flask(__name__)

@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"

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

if __name__ == '__main__':
    app.run(port=5328)