import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 라우트 임포트
from app.routes import llm_routes, vision_routes
from app.services.vision_service import vision_service

# FastAPI 앱 초기화
app = FastAPI(
    title="인테리어 프롬프트 생성 API",
    description="텍스트와 이미지를 이용한 인테리어 프롬프트 생성 시스템",
    version="0.1.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우트 등록
app.include_router(llm_routes.router, prefix="/api/llm", tags=["LLM"])
app.include_router(vision_routes.router, prefix="/api/vision", tags=["Vision"])

# 루트 라우트
@app.get("/")
async def root():
    return {"message": "인테리어 프롬프트 생성 API에 오신 것을 환영합니다!"}

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 모델 초기화"""
    print("서버 시작: 모델 초기화 중...")
    try:
        # CLIP 모델 초기화
        vision_service._load_clip_model()
        print("CLIP 모델 초기화 완료")
        
        # Faster R-CNN 모델 초기화
        vision_service._load_rcnn_model()
        print("Faster R-CNN 모델 초기화 완료")
    except Exception as e:
        print(f"모델 초기화 중 오류 발생: {str(e)}")
        raise e

# 서버 실행 코드 (직접 실행 시)
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True) 