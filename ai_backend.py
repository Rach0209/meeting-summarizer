import os
import ollama
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """당신은 회의록 분석 전문가입니다.
주어진 회의록을 명확하고 간결하게 정리해주세요."""

USER_PROMPT_TEMPLATE = """다음 회의록을 아래 형식으로 정리해주세요:

## 핵심 요약
(3줄 이내로 핵심 내용 요약)

## 결정 사항
(회의에서 결정된 사항들을 목록으로)

## 액션 아이템
(담당자: 해야 할 일 형식으로)

---
회의록:
{text}"""


def summarize_with_ollama(text: str, model: str = None) -> str:
    model = model or os.getenv("OLLAMA_MODEL", "llama3.2")
    response = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(text=text)},
        ],
    )
    return response.message.content


def summarize_with_groq(text: str, api_key: str = None, model: str = None) -> str:
    api_key = api_key or os.getenv("GROQ_API_KEY")
    model = model or "llama-3.3-70b-versatile"
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(text=text)},
        ],
    )
    return response.choices[0].message.content
