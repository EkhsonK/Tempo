from flask import Blueprint, request, jsonify, Response, stream_with_context
import os
from huggingface_hub import InferenceClient

bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Get Token from Environment (Secure)
HF_TOKEN = os.environ.get('HF_TOKEN') 
MODEL_NAME = "meta-llama/Meta-Llama-3-8B-Instruct"

# Initialize client
client = InferenceClient(token=HF_TOKEN)

@bp.route('/chat', methods=['POST'])
def chat_stream():
    try:
        data = request.json
        messages = data.get('messages', [])
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1000)

        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # Call Hugging Face API
        stream = client.chat_completion(
            model=MODEL_NAME,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )

        # Stream response
        def generate():
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content

        return Response(stream_with_context(generate()), content_type='text/plain')

    except Exception as e:
        print(f"Llama Error: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route('/search', methods=['POST'])
def search_placeholder():
    return jsonify({
        "text": "Поиск в интернете временно недоступен для этой модели.", 
        "sources": []
    })