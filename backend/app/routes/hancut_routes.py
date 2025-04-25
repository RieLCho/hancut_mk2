from fastapi import APIRouter, HTTPException
from app.models.schemas import ImageStyleRequest, StyleAnalysisResponse, ObjectDetectionRequest, ObjectDetectionResponse, DetectedObject
from app.services.vision_service import vision_service
from app.models.schemas import TextPromptRequest, PromptResponse
from app.services.llm_service import llm_service


router = APIRouter()

@router.post("/", response_model=PromptResponse)
async def generate_prompt_with_style(img_request: ImageStyleRequest, text_request: TextPromptRequest):
    """
    이미지 URL에서 인테리어 스타일을 추출합니다.
    추출된 스타일과 텍스트 입력을 조합하여 인테리어 프롬프트를 생성합니다.
    """
    keywords = None
    try:
        if not img_request.image_url:
            raise HTTPException(status_code=400, detail="이미지 URL이 필요합니다")

        # 상위 3개 스타일 추출  
        keywords = await vision_service.extract_style(img_request.image_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스타일 추출 오류: {str(e)}")
    try:
        # 스타일 기반 프롬프트 생성
        prompt = await llm_service.generate_interior_prompt_with_style(text_request.text, keywords)
        return PromptResponse(prompt=prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프롬프트 생성 오류: {str(e)}")
    
