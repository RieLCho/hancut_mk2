#!/bin/bash

# 환경 변수 확인
if [ ! -f "backend/.env" ]; then
    echo "백엔드 .env 파일이 존재하지 않습니다. backend/.env.example에서 복사해주세요."
    exit 1
fi

# Docker가 설치되어 있는지 확인
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Docker 설치 확인됨. Docker로 실행합니다."
    docker-compose up
    exit 0
fi

# Docker가 없는 경우 로컬에서 실행
echo "Docker가 설치되어 있지 않습니다. 로컬에서 실행합니다."

# 백엔드 실행
echo "백엔드 실행 중..."
cd backend
# Python 가상환경 확인
if [ ! -d "venv" ]; then
    echo "가상환경 생성 중..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload &
cd ..

# 프론트엔드 실행
echo "프론트엔드 실행 중..."
cd frontend
npm install
npm start 