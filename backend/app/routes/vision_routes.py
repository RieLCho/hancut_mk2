from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.models.request_schemas import ImageStyleRequest, ObjectDetectionRequest
from app.models.response_schemas import StyleAnalysisResponse, ObjectDetectionResponse, DetectedObject
from app.services.vision_service import vision_service
from typing import List

router = APIRouter()

@router.post("/extract-style", response_model=StyleAnalysisResponse)
async def extract_style(request: ImageStyleRequest):
    """
    이미지 URL에서 인테리어 스타일을 추출합니다.
    """
    try:
        if not request.image_url:
            raise HTTPException(status_code=400, detail="이미지 URL이 필요합니다")
            
        keywords = await vision_service.extract_style(request.image_url)
        return StyleAnalysisResponse(keywords=keywords)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스타일 추출 오류: {str(e)}")

@router.post("/detect-objects", response_model=ObjectDetectionResponse)
async def detect_objects(request: ObjectDetectionRequest):
    """
    이미지 URL에서 인테리어 객체를 탐지합니다.
    """
    try:
        objects_data = await vision_service.detect_objects(request.image_url)
        objects = [DetectedObject(label=obj["label"], confidence=obj["confidence"]) for obj in objects_data]
        return ObjectDetectionResponse(objects=objects)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"객체 탐지 오류: {str(e)}") 