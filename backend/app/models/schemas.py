from pydantic import BaseModel, Field
from typing import List, Optional

# 텍스트 프롬프트 요청 모델
class TextPromptRequest(BaseModel):
    text: str = Field(..., description="인테리어 관련 사용자 입력 텍스트")
    
# 이미지 스타일 분석 요청 모델
class ImageStyleRequest(BaseModel):
    image_url: Optional[str] = Field(None, description="분석할 이미지의 URL")
    
# 객체 탐지 요청 모델
class ObjectDetectionRequest(BaseModel):
    image_url: Optional[str] = Field(None, description="객체 탐지를 위한 이미지 URL")

# 이미지 생성 요청 모델
class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., description="이미지 생성을 위한 프롬프트")


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