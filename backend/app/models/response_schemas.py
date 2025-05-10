from pydantic import BaseModel, Field
from typing import List, Optional

# 프롬프트 응답 모델
class PromptResponse(BaseModel):
    prompt: str = Field(..., description="생성된 인테리어 프롬프트") 
    
# 스타일 분석 응답 모델
class StyleAnalysisResponse(BaseModel):
    keywords: List[str] = Field(..., description="추출된 스타일 키워드 목록")
    
# 객체 탐지 응답 모델
class DetectedObject(BaseModel):
    label: str = Field(..., description="탐지된 객체 라벨")
    confidence: float = Field(..., description="탐지 신뢰도")
    
class ObjectDetectionResponse(BaseModel):
    objects: List[DetectedObject] = Field(..., description="탐지된 객체 목록")

# 이미지 생성 응답 모델
class ImageGenerationResponse(BaseModel):
    image_url: str = Field(..., description="생성된 이미지 URL")
    prompt: str = Field(..., description="사용된 프롬프트")