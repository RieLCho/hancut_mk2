from backend.app.services.vision_service import vision_service
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


# 이미지 분석 결과 반환
async def analyse_input_image(img_url : str, text : str) -> Tuple[List[str], List[str], str] :                
    combined_text = f'사용자 요청: {text}\n\n'
    
    try:
        # 이미지 분석     
        input_style_list = await vision_service.extract_style(img_url)
        input_object_dict = await vision_service.detect_objects(img_url)
        #input_object_list = [obj['label'] for obj in input_object_dict[:5]]
        
        # 신뢰도 상위 5개 오브젝트 저장
        sorted_objects = sorted(input_object_dict, key=lambda x: x['confidence'], reverse=True)
        top_objects = sorted_objects[:5]
        input_object_list = [obj['label'] for obj in top_objects]
    except Exception as e:  
        logger.warning(f"Input 이미지 분석 오류: {e}")
        input_style_list, input_object_list = list(), list()

    # 이미지 분석 결과 추가
    if len(input_style_list) > 0 or len(input_object_list) > 0:
        combined_text += '이미지 분석 결과:\n'

        # 스타일 키워드 추가
        if len(input_style_list) > 0:
            combined_text += f'- 스타일 키워드: {", ".join(input_style_list)}\n'

        # 탐지된 객체 추가
        if len(input_object_list) > 0:
            combined_text += f'- 주요 인테리어 객체: {", ".join(input_object_list)}\n'

    # 추가 지시사항
    combined_text += """\n다음 사항을 고려하여 고품질 인테리어 이미지 생성용 DALL-E 프롬프트를 작성해주세요:
    1. 포토리얼리스틱한 인테리어 이미지를 위한 명확한 설명
    2. 공간감과 원근감이 잘 표현되도록 구체적인 가구 배치 설명
    3. 조명, 색상 팔레트, 재질 등 세부 사항 포함
    4. 전체적인 분위기와 스타일을 강조"""
    
    return input_style_list, input_object_list, combined_text




# Output 이미지 분석 결과 반환
async def analyze_output_image(generated_image_url : str) -> Tuple[List[str], List[str]]:
    # 이미지 생성 오류 대응
    if generated_image_url == "":
        return list(), list()

    try:
        # dalle3 이미지 분석
        output_style_list = await vision_service.extract_style(generated_image_url)
        output_object_dict = await vision_service.detect_objects(generated_image_url)
        #output_object_list = [obj['label'] for obj in output_object_dict]        
    
        # 신뢰도 상위 5개 오브젝트 저장
        sorted_objects = sorted(output_object_dict, key=lambda x: x['confidence'], reverse=True)
        top_objects = sorted_objects[:5]
        output_object_list = [obj['label'] for obj in top_objects]   
    except Exception as e:  
        logger.warning(f"Output 이미지 특징 추출 서비스 오류: {e}")
        return list(), list()
    
    return output_style_list, output_object_list