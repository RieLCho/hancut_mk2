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

    @staticmethod
    async def generate_interior_prompt_with_style(text: str, style_keywords: list) -> str:
        """
        사용자 입력 텍스트와 스타일 키워드를 기반으로 인테리어 프롬프트 생성
        
        Args:
            text (str): 사용자 입력 텍스트
            style_keywords (list): 이미지 분석을 통해 추출된 스타일 키워드 리스트
            
        Returns:
            str: 생성된 인테리어 프롬프트
        """
        try:
            # 스타일 키워드를 영어 쉼표로 연결
            keyword_str = ", ".join(style_keywords)
            
            # GPT 시스템 프롬프트
            system_prompt = f"""
            당신은 인테리어 디자인 전문가입니다. 사용자 요구사항과 스타일 키워드를 바탕으로, 
            Stable Diffusion, Midjourney, DALL·E 3에서 사용할 수 있는 **극히 현실적이고 스타일이 명확히 반영된** 인테리어 프롬프트를 생성해주세요.

            다음 조건을 반드시 지켜주세요:
            1. 프롬프트는 **영어로 작성**하고, 쉼표로 구분된 짧은 구문들의 나열 형식으로 작성해주세요.
            2. 스타일 키워드는 공간의 분위기, 가구 스타일, 조명, 장식 등 전반에 반영해주세요.
            3. 결과는 실제 인테리어 사진처럼 보여야 하며, **비현실적인 요소(SF적, 공상적 구조 등)는 절대 포함하지 마세요.**
            4. 프롬프트 말미에 다음 키워드를 포함해주세요: **photo-realistic, natural lighting, 4K, high detail**
            5. color_palette는 가구, 벽지, 커튼 등에 자연스럽게 어울리도록 구성해주세요.
            
            스타일 키워드: {keyword_str}

            프롬프트는 다음의 형식을 따라야 합니다:
            "A [스타일] interior of a [공간 크기] [공간 유형] with [벽/바닥 재질 및 색상], featuring [가구 및 장식품 상세], illuminated by [조명 종류 및 분위기], with [특별한 요소], conveying a [전체적인 분위기], photographed in [카메라 시점 및 조명 조건], photo-realistic, high resolution, 4K"
            예시:
            "A minimalist interior of a small living room with white concrete walls and wooden flooring, featuring a low-profile beige sofa, a walnut coffee table, a tall bookshelf, illuminated by warm pendant lighting, with indoor plants and a textured rug, conveying a calm and cozy atmosphere, photographed in soft natural light from a window, photo-realistic, high resolution, 4K"

            결과는 문자열 형태의 JSON이 아닙니다. 실제 JSON 객체로 반환하세요:
            {{
                "prompt": "생성된 프롬프트...",
                "style_keywords": {style_keywords},
                "color_palette": ["색상1", "색상2", ...]
            }}
            """



            # GPT API 호출
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # 응답 파싱
            result = response.choices[0].message.content.strip()
            try:
                result_json = json.loads(result)
                return result_json["prompt"]
            except json.JSONDecodeError:
                return result

        except Exception as e:
            print(f"LLM 서비스 오류: {str(e)}")
            return f"프롬프트 생성 중 오류가 발생했습니다: {str(e)}"

# 서비스 인스턴스 생성
llm_service = LLMService() 