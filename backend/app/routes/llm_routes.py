from fastapi import APIRouter, HTTPException
from app.models.schemas import TextPromptRequest, PromptResponse
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/generate-prompt", response_model=PromptResponse)
async def generate_prompt(request: TextPromptRequest):
    """
    텍스트 입력으로부터 인테리어 프롬프트를 생성합니다.
    """
    try:
        prompt = await llm_service.generate_interior_prompt(request.text)
        return PromptResponse(prompt=prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프롬프트 생성 오류: {str(e)}") 