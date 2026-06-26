import threading
import webbrowser
from flask import Flask, render_template, request, jsonify
from ai_backend import summarize_with_ollama, summarize_with_groq
import ollama

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/models", methods=["GET"])
def list_models():
    """설치된 Ollama 모델 목록 반환"""
    try:
        models = ollama.list()
        names = [m.model for m in models.models]
        return jsonify({"models": names})
    except Exception:
        return jsonify({"models": []})


@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    text = data.get("text", "").strip()
    mode = data.get("mode", "local")       # local | internet | compare
    groq_key = data.get("groq_key", "")
    ollama_model = data.get("ollama_model", "llama3.2")

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
            result["groq"] = summarize_with_groq(text, api_key=groq_key or None)
        except Exception as e:
            result["groq_error"] = f"Groq 오류: {str(e)}"

    return jsonify(result)


def open_browser():
    webbrowser.open("http://localhost:5000")


if __name__ == "__main__":
    # 서버 시작 후 1초 뒤 브라우저 자동으로 열기
    threading.Timer(1.0, open_browser).start()
    app.run(debug=False, port=5000)
