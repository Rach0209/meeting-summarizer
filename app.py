import os
import threading
import webbrowser
from flask import Flask, render_template, request, jsonify
from ai_backend import summarize_with_ollama, summarize_with_groq
import ollama

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/models/ollama", methods=["GET"])
def list_ollama_models():
    try:
        models = ollama.list()
        names = [m.model for m in models.models]
        return jsonify({"models": names})
    except Exception:
        return jsonify({"models": []})


@app.route("/models/groq", methods=["GET"])
def list_groq_models():
    api_key = request.args.get("api_key") or os.getenv("GROQ_API_KEY", "")
    if not api_key:
        return jsonify({"models": []})
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        models = client.models.list()
        # 채팅 가능한 모델만 필터링 (whisper 등 제외)
        names = sorted([
            m.id for m in models.data
            if not any(x in m.id for x in ("whisper", "guard", "vision", "tts"))
        ])
        return jsonify({"models": names})
    except Exception:
        return jsonify({"models": []})


@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    text = data.get("text", "").strip()
    mode = data.get("mode", "local")
    groq_key = data.get("groq_key", "")
    ollama_model = data.get("ollama_model", "llama3.2")
    groq_model = data.get("groq_model", "llama-3.3-70b-versatile")

    if not text:
        return jsonify({"error": "회의록 내용을 입력해주세요."}), 400

    result = {}

    if mode in ("local", "compare"):
        try:
            result["ollama"] = summarize_with_ollama(text, model=ollama_model)
        except Exception as e:
            result["ollama_error"] = f"Ollama 오류: {str(e)}"

    if mode in ("internet", "compare"):
        try:
            result["groq"] = summarize_with_groq(text, api_key=groq_key or None, model=groq_model)
        except Exception as e:
            result["groq_error"] = f"Groq 오류: {str(e)}"

    return jsonify(result)


def open_browser():
    webbrowser.open("http://localhost:5000")


if __name__ == "__main__":
    # 서버 시작 후 1초 뒤 브라우저 자동으로 열기
    threading.Timer(1.0, open_browser).start()
    app.run(debug=False, port=5000)
