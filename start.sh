#!/bin/bash
# 회의록 자동 정리 앱 실행 스크립트 (Mac/Linux)
echo "앱을 시작합니다..."

# Ollama 백그라운드 실행 (이미 실행 중이면 무시됨)
ollama serve &>/dev/null &

# Flask 서버 실행 (브라우저 자동으로 열림)
python app.py
