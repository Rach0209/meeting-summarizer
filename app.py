import os
import json
import threading
import webbrowser
from flask import Flask, render_template, request, jsonify
from ai_backend import summarize_with_ollama, summarize_with_groq
import ollama

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_FILE = os.path.join(BASE_DIR, "settings.json")


def load_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {}
    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_prompts_file():
    path = load_settings().get("prompts_path", "")
    return path if path else os.path.join(BASE_DIR, "custom_prompts.json")

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    path = get_prompts_file()
    if not os.path.exists(path):
        return jsonify([])
    with open(path, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))


@app.route("/api/prompts", methods=["POST"])
def save_prompts():
    path = get_prompts_file()
    data = request.get_json()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"ok": True})


@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify(load_settings())


@app.route("/api/settings", methods=["POST"])
def save_settings():
    data = request.get_json()
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"ok": True})


@app.route("/api/browse", methods=["GET"])
def browse_file():
    """네이티브 파일 저장 다이얼로그 열기"""
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.wm_attributes("-topmost", True)
    path = filedialog.asksaveasfilename(
        title="커스텀 프롬프트 저장 위치 선택",
        defaultextension=".json",
        filetypes=[("JSON 파일", "*.json")],
        initialfile="custom_prompts.json",
    )
    root.destroy()
    return jsonify({"path": path})


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
    ollama_model = data.get("ollama_model", "llama3.1:8b")
    groq_model = data.get("groq_model", "llama-3.3-70b-versatile")
    system_prompt = data.get("system_prompt", "")
    user_prompt = data.get("user_prompt", "{text}")

    if not text:
        return jsonify({"error": "내용을 입력해주세요."}), 400

    result = {}

    if mode in ("local", "compare"):
        try:
            result["ollama"] = summarize_with_ollama(text, model=ollama_model, system_prompt=system_prompt, user_prompt=user_prompt)
        except Exception as e:
            result["ollama_error"] = f"Ollama 오류: {str(e)}"

    if mode in ("internet", "compare"):
        try:
            result["groq"] = summarize_with_groq(text, api_key=groq_key or None, model=groq_model, system_prompt=system_prompt, user_prompt=user_prompt)
        except Exception as e:
            result["groq_error"] = f"Groq 오류: {str(e)}"

    return jsonify(result)


def open_browser():
    webbrowser.open("http://localhost:5000")


if __name__ == "__main__":
    # 서버 시작 후 1초 뒤 브라우저 자동으로 열기
    threading.Timer(1.0, open_browser).start()
    app.run(debug=False, port=5000)
