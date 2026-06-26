# 회의록 자동 정리

AI를 사용해 회의록을 핵심 요약 / 결정 사항 / 액션 아이템으로 자동 정리하는 앱.

## 모드

| 모드 | 설명 |
|------|------|
| 로컬 (Ollama) | 내 PC에서 AI 실행. 인터넷 불필요 |
| 인터넷 (Groq) | 클라우드 AI 사용. Groq API 키 필요 |
| 비교 | 두 AI 결과를 나란히 비교 |

## 시작하기

### 사전 준비
- Python 3.10+
- [Ollama](https://ollama.com) 설치 후 `ollama pull llama3.2`
- Groq API 키 ([console.groq.com](https://console.groq.com) 에서 무료 발급)

### 설치 및 실행

```bash
# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에 GROQ_API_KEY 입력

# 실행 (Windows)
start.bat

# 실행 (Mac/Linux)
chmod +x start.sh && ./start.sh
```

브라우저가 자동으로 열립니다.
