from fastapi import APIRouter, HTTPException
from app.models.request_schemas import ImageStyleRequest, ObjectDetectionRequest, TextPromptRequest
from app.models.response_schemas import ImageGenerationResponse
from app.routes import llm_routes, vision_routes
from app.services.llm_service import llm_service
from app.services.vision_service import vision_service

router = APIRouter()

@router.post("/", response_model=ImageGenerationResponse)
async def generate_hancut_image(text_request: TextPromptRequest, style_img_request: ImageStyleRequest, object_img_request: ObjectDetectionRequest):
    """
    이미지 URL에서 인테리어 스타일을 추출합니다.
    이미지 URL에서 인테리어 객체를 탐지합니다.
    추출된 스타일과 객체를 사용자가 입력한 텍스트와 조합하여 인테리어 프롬프트를 생성합니다.
    프롬프트를 기반으로 DALL-E 3를 사용하여 이미지를 생성합니다.
    """
    
    styles = None
    objects = None
    prompt = None

    try:
        # 스타일 추출
        styles = await vision_service.extract_style(style_img_request.image_url)

        # 인테리어 객체 추출
        objects_data = await vision_service.detect_objects(object_img_request.image_url)
        objects = [obj["label"] for obj in objects_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"vision model 오류: {str(e)}")
  
    try:
        # 스타일, 객체, 텍스트 기반 프롬프트 생성
        prompt = await llm_service.generate_hancut_prompt(text_request.text, styles, objects)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프롬프트 생성 오류: {str(e)}")
    
    try:
        # 프롬프트 기반 이미지 생성
        result = await llm_service.generate_image_with_dalle(prompt)
        return ImageGenerationResponse(image_url=result["image_url"], prompt=result["prompt"])
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 생성 오류: {str(e)}")
