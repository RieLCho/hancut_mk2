# 인테리어 프롬프트 생성 시스템 (HanCut)

이 프로젝트는 텍스트와 이미지를 기반으로 인테리어 프롬프트를 생성하는 시스템입니다. AI 기술을 활용하여 사용자가 원하는 인테리어 디자인에 대한 상세한 설명과 프롬프트를 쉽게 생성할 수 있습니다.

## 주요 기능

1. **텍스트 기반 인테리어 프롬프트 생성 (GPT-4)**

   - 사용자의 텍스트 입력을 바탕으로 상세한 인테리어 디자인 프롬프트 생성
   - 스타일, 색상 팔레트, 가구 배치, 조명, 장식 아이템 등 포함

2. **이미지 기반 스타일 추출 (CLIP)**

   - 이미지에서 인테리어 스타일 특성 추출
   - 모던, 미니멀, 북유럽, 산업적, 소박함 등 다양한 스타일 인식

3. **객체 탐지 (Faster R-CNN)**

   - 인테리어 이미지에서 가구 및 주요 객체 탐지
   - 의자, 소파, 식물, 침대, 거울 등 인테리어 요소 식별

4. **웹 인터페이스 (FastAPI + React + TypeScript)**
   - 직관적이고 사용하기 쉬운 웹 인터페이스
   - 반응형 디자인으로 모바일 및 데스크톱 지원
   - TypeScript를 통한 타입 안정성 강화

## 프로젝트 구조

```
hancut_mk2/
├── backend/         # FastAPI 백엔드
│   ├── app/         # 애플리케이션 코드
│   │   ├── models/  # 데이터 모델
│   │   ├── routes/  # API 엔드포인트
│   │   ├── services/# 비즈니스 로직
│   │   └── main.py  # 애플리케이션 진입점
│   ├── .env         # 환경 변수
│   └── pyproject.toml # Python 의존성 및 프로젝트 설정
├── frontend/        # React + TypeScript 프론트엔드
│   ├── public/      # 정적 파일
│   ├── src/         # 소스 코드
│   │   ├── components/ # 재사용 가능한 컴포넌트
│   │   ├── pages/   # 페이지 컴포넌트
│   │   └── services/# API 서비스
│   ├── .env         # 환경 변수
│   ├── package.json # NPM 의존성
│   ├── tsconfig.json # TypeScript 설정
│   └── vite.config.ts # Vite 설정
└── start.sh         # 실행 스크립트
```

## 설치 및 실행 방법

### 필수 조건

- Python 3.10.17
- Node.js 22 이상 (프론트엔드)
- OpenAI API 키

### 환경 변수 설정

1. `backend/.env.example`을 `backend/.env`로 복사하고 OpenAI API 키를 설정합니다.
   ```bash
   cp backend/.env.example backend/.env
   # OPENAI_API_KEY 값을 수정하세요
   ```

### 모델 파일 추가

backend/app/models/siglip/model.safetensors 파일을 수동으로 추가해야함.

### 실행 방법 1: 시작 스크립트 사용 (권장)

1. 제공된 스크립트를 사용하여 백엔드와 프론트엔드를 한 번에 실행합니다:
   ```bash
   ./start.sh
   ```
2. 브라우저에서 http://localhost:3000 으로 접속합니다.

### 실행 방법 2: 수동 설치 및 실행

1. 백엔드 설치 및 실행:

   ```bash
   cd backend

   # UV 설치 (처음 한 번만 필요)
   curl -LsSf https://astral.sh/uv/install.sh | sh
   export PATH="$HOME/.cargo/bin:$PATH"

   # 가상환경 생성 및 활성화
   uv venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate

   # 의존성 설치 및 서버 실행
   uv sync
   uvicorn app.main:app --reload
   ```

2. 프론트엔드 설치 및 실행:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. 브라우저에서 http://localhost:3000 으로 접속합니다.

## 최근 업데이트

## API 문서

FastAPI는 자동으로 API 문서를 생성합니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 사용 예시

### 텍스트 기반 프롬프트 생성

1. "텍스트 프롬프트" 페이지로 이동합니다.
2. 원하는 인테리어 설명을 입력합니다. (예: "20평 아파트의 거실을 북유럽 스타일로 꾸미고 싶어요. 밝은 색상과 심플한 가구를 선호합니다.")
3. "프롬프트 생성하기" 버튼을 클릭합니다.
4. 생성된 인테리어 디자인 프롬프트를 확인합니다.

### 이미지 스타일 분석

1. "이미지 스타일" 페이지로 이동합니다.
2. 분석할 인테리어 이미지의 URL을 입력합니다.
3. "분석" 버튼을 클릭합니다.
4. 추출된 스타일 키워드를 확인합니다.

### 객체 탐지

1. "객체 탐지" 페이지로 이동합니다.
2. 분석할 인테리어 이미지의 URL을 입력합니다.
3. "탐지" 버튼을 클릭합니다.
4. 이미지에서 탐지된 인테리어 객체 목록을 확인합니다.

## 주의사항

- OpenAI API 키는 비용이 발생할 수 있으므로 API 사용량을 모니터링하세요.
- 이미지 URL은 공개적으로 접근 가능해야 합니다.
- 첫 실행 시 필요한 모델을 다운로드하는 데 시간이 걸릴 수 있습니다.

## 기술 스택

- **백엔드**: FastAPI, Python 3.10.17, OpenAI API, Hugging Face Transformers, PyTorch
- **패키지 관리**: UV (ultrafast pip replacement)
- **프론트엔드**: React, Material-UI
