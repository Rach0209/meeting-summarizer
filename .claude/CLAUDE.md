# simple-summarizer — Claude 작업 가이드

## 프로젝트 개요
AI 텍스트 요약 앱 (회의록, 이메일, 법률문서 등). Ollama(로컬)와 Groq(클라우드) 두 가지 AI 백엔드 지원.
세 가지 모드: 로컬 / 인터넷 / 비교(나란히 표시).

- **GitHub**: https://github.com/Rach0209/simple-summarizer

## 기술 스택
- 백엔드: Python + Flask
- AI 로컬: Ollama + llama3.1:8b (추천 모델)
- AI 클라우드: Groq API + llama-3.3-70b-versatile
- 프론트엔드: HTML + static/style.css + static/script.js + static/prompts.js
- 패키징: PyInstaller (빌드 완료)
- 실행 환경: Python venv

## 브랜치 규칙
- `dev` 브랜치에서만 작업
- `master`는 배포용 — 직접 커밋 금지

## 보안 규칙
- `.env`는 절대 커밋하지 않음 (.gitignore에 포함)
- API 키는 코드에 하드코딩 금지
- Groq API 키는 `.env`의 `GROQ_API_KEY`에 저장

## 파일 구조
```
simple-summarizer/
├── .claude/CLAUDE.md
├── static/
│   ├── style.css
│   ├── script.js
│   └── prompts.js         # 프롬프트 템플릿 관리
├── templates/index.html
├── ai_backend.py          # Ollama/Groq 호출 (이 파일만 교체하면 백엔드 전환 가능)
├── app.py                 # Flask 라우팅
├── start.bat              # Windows 실행 스크립트 (venv 사용)
├── start.sh               # Mac/Linux 실행 스크립트 (venv 사용)
├── venv/                  # Python 가상환경 (.gitignore)
├── dist/simple-summarizer.exe  # Windows 빌드 결과물
├── custom_prompts.json    # 커스텀 프롬프트 저장 (자동 생성)
└── settings.json          # 앱 설정 (자동 생성)
```

## 개발 환경 세팅 (새 컴퓨터)

### Windows
```bat
git clone https://github.com/Rach0209/simple-summarizer.git
cd simple-summarizer
git checkout dev
python -m venv venv
venv\Scripts\pip install -r requirements.txt
copy .env.example .env   # GROQ_API_KEY 입력
start.bat
```

### Mac/Linux
```bash
git clone https://github.com/Rach0209/simple-summarizer.git
cd simple-summarizer
git checkout dev
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env   # GROQ_API_KEY 입력
chmod +x start.sh && ./start.sh
```

> Ollama 없어도 됨. Groq(인터넷) 모드만 쓸 거면 Ollama 설치 불필요.

## PyInstaller 빌드

### Windows → .exe
```bat
venv\Scripts\pip install pyinstaller
venv\Scripts\pyinstaller --onefile --name simple-summarizer --add-data "templates;templates" --add-data "static;static" app.py
:: 결과물: dist\simple-summarizer.exe
```

### Mac → .app (Mac에서 실행)
```bash
venv/bin/pip install pyinstaller
venv/bin/pyinstaller --onefile --name simple-summarizer --add-data "templates:templates" --add-data "static:static" app.py
# 결과물: dist/simple-summarizer
```

> `--add-data` 구분자: Windows는 `;`, Mac은 `:`

## 행동 지침
1. Think Before Coding — 불명확하면 먼저 물어볼 것
2. Simplicity First — 요청한 것만 구현
3. Surgical Changes — 관련 없는 코드 건드리지 않기
4. Goal-Driven — 각 단계마다 검증 방법 명시
