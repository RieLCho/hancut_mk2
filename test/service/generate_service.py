from backend.app.services.llm_service import llm_service
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)

# 분석 정보 기반 인테리어 프롬프트 및 이미지 생성
async def generate_output(combined_text : str) -> Tuple[str, str]:
    try:
        # 인테리어 도메인 프롬프트 생성
        generated_prompt = await llm_service.generate_interior_prompt(combined_text)
        
        # dalle3 인테리어 이미지 생성
        generated_image_dict = await llm_service.generate_image_with_dalle(generated_prompt)
        generated_image_url = generated_image_dict['image_url']
    except Exception as e:  
        logger.warning(f"OpenAI API 호출 오류: {e}")
        return "", ""

    return generated_prompt, generated_image_url