import os
import json
import openai
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

class LLMService:
    """GPT-3.5-turbo를 이용한 인테리어 프롬프트 생성 서비스"""

    @staticmethod
    async def generate_interior_prompt(text: str) -> str:
        """
        사용자 텍스트로부터 인테리어 프롬프트를 생성합니다.
        
        Args:
            text (str): 사용자가 입력한 인테리어 요구사항 텍스트
            
        Returns:
            str: 생성된 인테리어 디자인 프롬프트
        """
        try:
            # GPT-3.5-turbo 시스템 프롬프트
            system_prompt = """
            당신은 인테리어 디자인 전문가입니다. 사용자의 요구사항을 바탕으로 Stable Diffusion이나 Midjourney에서 사용할 수 있는 상세한 프롬프트를 생성해주세요.
            
            프롬프트는 다음 형식을 따라야 합니다:
            "A [스타일] interior of a [공간 크기] room, [주요 특징], [색상 팔레트], [가구 및 장식품], [조명], [특별한 요소], [전체적인 분위기], [추가 세부사항]"
            
            프롬프트는 영어로 작성하고, 각 요소는 쉼표로 구분하며, 자연스러운 문장이 아닌 프롬프트 형식으로 작성해주세요.
            
            결과는 JSON 형식으로 반환하세요:
            {
                "prompt": "생성된 프롬프트...",
                "style_keywords": ["키워드1", "키워드2", ...],
                "color_palette": ["색상1", "색상2", ...]
            }
            """
            
            # API 호출
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # 응답에서 JSON 추출
            result = response.choices[0].message.content.strip()
            
            # JSON 파싱
            try:
                result_json = json.loads(result)
                return result_json["prompt"]
            except json.JSONDecodeError:
                # JSON 파싱에 실패한 경우 텍스트 그대로 반환
                return result
                
        except Exception as e:
            print(f"LLM 서비스 오류: {str(e)}")
            return f"프롬프트 생성 중 오류가 발생했습니다: {str(e)}"

# 서비스 인스턴스 생성
llm_service = LLMService() 