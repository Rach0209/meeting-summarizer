# meeting-summarizer — Claude 작업 가이드

## 프로젝트 개요
AI 회의록 자동 정리 앱. Ollama(로컬)와 Groq(클라우드) 두 가지 AI 백엔드 지원.
세 가지 모드: 로컬 / 인터넷 / 비교(나란히 표시).

## 기술 스택
- 백엔드: Python + Flask
- AI 로컬: Ollama (llama3.2)
- AI 클라우드: Groq API (llama-3.1-70b-versatile)
- 프론트엔드: HTML + CSS + JS (templates/index.html)
- 패키징: PyInstaller

## 브랜치 규칙
- `dev` 브랜치에서만 작업
- `master`는 배포용 — 직접 커밋 금지

## 보안 규칙
- `.env`는 절대 커밋하지 않음 (.gitignore에 포함)
- API 키는 코드에 하드코딩 금지
- 사용자 키는 UI 입력 → localStorage 저장 방식

## 파일 구조
- `ai_backend.py`: Ollama/Groq 호출 분리. 이 파일만 교체하면 백엔드 전환 가능
- `app.py`: Flask 라우팅만 담당
- `templates/index.html`: 모든 UI

## 행동 지침
1. Think Before Coding — 불명확하면 먼저 물어볼 것
2. Simplicity First — 요청한 것만 구현
3. Surgical Changes — 관련 없는 코드 건드리지 않기
4. Goal-Driven — 각 단계마다 검증 방법 명시
