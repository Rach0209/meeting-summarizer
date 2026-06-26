import os
import ollama
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def summarize_with_ollama(text: str, model: str = None, system_prompt: str = None, user_prompt: str = None) -> str:
    model = model or os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    response = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt.format(text=text)},
        ],
    )
    return response.message.content


def summarize_with_groq(text: str, api_key: str = None, model: str = None, system_prompt: str = None, user_prompt: str = None) -> str:
    api_key = api_key or os.getenv("GROQ_API_KEY")
    model = model or "llama-3.3-70b-versatile"
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt.format(text=text)},
        ],
    )
    return response.choices[0].message.content
