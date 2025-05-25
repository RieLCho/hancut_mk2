#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==== HanCut 애플리케이션 시작하기 ====${NC}"

# 환경 확인
if [ ! -f .env ]; then
    echo -e "${YELLOW}환경 변수 파일이 없습니다. 샘플 파일을 복사합니다...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}.env 파일이 생성되었습니다. 필요한 환경 변수를 설정해주세요.${NC}"
    else
        echo -e "${RED}.env.example 파일이 없습니다. 환경 설정을 확인해주세요.${NC}"
        exit 1
    fi
fi

# 백엔드 시작
start_backend() {
    echo -e "${BLUE}백엔드 서버 시작 중...${NC}"
    
    cd backend || { echo -e "${RED}백엔드 디렉토리를 찾을 수 없습니다.${NC}"; exit 1; }
    
    # Python 버전 확인
    python_version=$(python -V 2>&1)
    echo -e "${BLUE}Python 버전: ${python_version}${NC}"
    
    # 가상 환경 확인 및 생성
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}가상 환경이 없습니다. 가상 환경을 생성합니다...${NC}"
        
        # UV 설치 여부 확인
        if ! command -v uv &> /dev/null; then
            echo -e "${YELLOW}UV가 설치되어 있지 않습니다. 설치합니다...${NC}"
            curl -LsSf https://astral.sh/uv/install.sh | bash
            # UV PATH 추가
            export PATH="$HOME/.cargo/bin:$PATH"
        fi
        
        uv venv .venv
        echo -e "${GREEN}가상 환경이 생성되었습니다.${NC}"
    fi
    
    # 가상 환경 활성화 및 의존성 설치
    source .venv/bin/activate
    echo -e "${BLUE}의존성 설치 중...${NC}"
    uv sync
    
    # 백엔드 서버 실행
    echo -e "${GREEN}백엔드 서버를 시작합니다...${NC}"
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    
    # 백엔드 서버가 시작될 때까지 대기
    echo -e "${BLUE}백엔드 서버 준비 대기 중...${NC}"
    timeout=30
    for i in $(seq 1 $timeout); do
        if curl -s http://localhost:8000/docs > /dev/null; then
            echo -e "${GREEN}백엔드 서버가 준비되었습니다. (http://localhost:8000)${NC}"
            break
        fi
        sleep 1
        echo -n "."
        
        if [ $i -eq $timeout ]; then
            echo -e "${RED}백엔드 서버가 시간 내에 시작되지 않았습니다.${NC}"
        fi
    done
}

# 프론트엔드 시작
start_frontend() {
    echo -e "${BLUE}프론트엔드 시작 중...${NC}"
    
    cd frontend || { echo -e "${RED}프론트엔드 디렉토리를 찾을 수 없습니다.${NC}"; exit 1; }
    
    # Node.js 버전 확인
    node_version=$(node -v 2>&1)
    echo -e "${BLUE}Node.js 버전: ${node_version}${NC}"
    
    # 의존성 설치
    echo -e "${BLUE}의존성 설치 중...${NC}"
    npm install
    
    # 프론트엔드 실행
    echo -e "${GREEN}프론트엔드를 시작합니다...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo -e "${GREEN}프론트엔드가 시작되었습니다. (http://localhost:3000)${NC}"
}

cleanup() {
    echo -e "\n${YELLOW}애플리케이션을 종료합니다...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Ctrl+C가 눌렸을 때 처리
trap cleanup INT

# 백엔드와 프론트엔드 시작
start_backend
start_frontend

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}HanCut 애플리케이션이 실행 중입니다${NC}"
echo -e "${BLUE}백엔드: http://localhost:8000${NC}"
echo -e "${BLUE}프론트엔드: http://localhost:3000${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요${NC}"

# 프로세스가 종료될 때까지 대기
wait