from flask import Blueprint, request, jsonify, Response, stream_with_context
import os
from huggingface_hub import InferenceClient

bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# 1. Get Token from Environment (Secure)
# In Render, add environment variable: HF_TOKEN = hf_...
HF_TOKEN = os.environ.get('HF_TOKEN') 
MODEL_NAME = "meta-llama/Meta-Llama-3-8B-Instruct"

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

        # 2. Call Hugging Face API
        stream = client.chat_completion(
            model=MODEL_NAME,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )

        # 3. Stream response back to frontend
        def generate():
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content

        return Response(stream_with_context(generate()), content_type='text/plain')

    except Exception as e:
        print(f"Llama Error: {e}")
        # Return error as a stream chunk so the UI sees it
        return jsonify({"error": str(e)}), 500

@bp.route('/search', methods=['POST'])
def search_placeholder():
    # Llama 3 (Base) doesn't have built-in Google Search like Gemini.
    # We return a placeholder or you can implement Serper.dev here later.
    return jsonify({
        "text": "Поиск в интернете временно недоступен для этой модели.", 
        "sources": []
    })