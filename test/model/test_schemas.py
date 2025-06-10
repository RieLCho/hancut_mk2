from pydantic import BaseModel, Field
from typing import List, Optional

# 테스트 종합정보 저장 모델
class StoredData(BaseModel):
    Text: str = Field(..., description="인테리어 관련 사용자 입력 텍스트")
    InputStyles: List[str] = Field(None, description="초기 이미지에서 추출된 스타일 키워드 목록")
    InputObjects: List[str] = Field(None, description="초기 이미지에서 추출된 인테리어 객체 키워드 목록")
    GeneratedPrompt: str = Field(..., description="사전 정의된 형식의 인테리어 프롬프트")
    GeneratedImageUrl: str = Field(..., description="dalle3로 생성된 이미지 url")
    OutputStyles: List[str] = Field(None, description="생성 이미지에서 추출된 스타일 키워드 목록")
    OutputObjects: List[str] = Field(None, description="생서서 이미지에서 추출된 인테리어 객체 키워드 목록")
    