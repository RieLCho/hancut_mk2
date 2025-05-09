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