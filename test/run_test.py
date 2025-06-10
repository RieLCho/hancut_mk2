from ..backend.app import main
from ..backend.app.services import llm_service, vision_service
from .model.test_schemas import StoredData
import json

img_dir = "./data/img_data.txt"
text_dir = "./data/text_data.txt"
test_db = []

# 테스트 시작
if __name__ == "__main__" :
    # main.main()
    pass

    # 파일 읽기
    with open(img_dir, 'r') as fp_img, open(text_dir, 'r') as fp_text :
        # 케이스별로 테스트
        for img_url, text in zip(fp_img, fp_text):
            # 좌우 공백 예방
            img_url = img_url.strip()
            text = text.strip()

            # 테스트 정보 초기화
            input_style_list = []
            input_object_list = []
            generated_prompt = ""
            generated_image_url = ""
            combined_text = f'사용자 요청: {text}\n\n'
            output_style_list = []
            output_object_list = []

            # Input Image 스타일,객체 추출
            try: 
                # 이미지 분석
                input_style_list = vision_service.vision_service.extract_style(img_url)
                input_object_list = vision_service.vision_service.detect_objects(img_url)
                
                # 이미지 분석 결과 추가
                if len(input_style_list) > 0 or len(input_object_list) > 0:
                    combined_text += '이미지 분석 결과:\n'

                    # 스타일 키워드 추가
                    if len(input_style_list) > 0:
                        combined_text += f'- 스타일 키워드: {", ".join(input_style_list)}\n'

                    # 탐지된 객체 추가
                    if len(input_object_list) > 0:
                        combined_text += f'- 주요 인테리어 객체: {", ".join(input_object_list[:5])}\n'

                # 추가 지시사항
                combined_text += """\n다음 사항을 고려하여 고품질 인테리어 이미지 생성용 DALL-E 프롬프트를 작성해주세요:
                1. 포토리얼리스틱한 인테리어 이미지를 위한 명확한 설명
                2. 공간감과 원근감이 잘 표현되도록 구체적인 가구 배치 설명
                3. 조명, 색상 팔레트, 재질 등 세부 사항 포함
                4. 전체적인 분위기와 스타일을 강조"""
            
            except Exception as e:  
                print(f"Input 이미지 특징 추출 오류: {e}")
                break
            
            # 추출된 정보 기반 인테리어 프롬프트 및 이미지 생성
            try:
                # 인테리어 도메인 프롬프트 생성
                generated_prompt = llm_service.llm_service.generate_interior_prompt(combined_text)
                
                # dalle3 인테리어 이미지 이미지 생성
                generated_image_url = llm_service.llm_service.generate_image_with_dalle(generated_prompt)
            
            except Exception as e:  
                print(f"OpenAI API 호출 오류: {e}")
                break

            # Output Image 스타일,객체 추출
            try:
                # dalle3 이미지 분석
                output_style_list = vision_service.vision_service.extract_style(generated_image_url)
                output_object_list = vision_service.vision_service.detect_objects(generated_image_url)
                                
            except Exception as e:  
                print(f"Output 이미지 특징 추출 서비스 오류: {e}")
                break
            

            test_db.append(StoredData(Text=text, InputStyles=input_style_list, 
                                        InputObjects=input_object_list,GeneratedPrompt=generated_prompt,
                                        GeneratedImageUrl=generated_image_url,
                                        OutputStyles=output_style_list, 
                                        OutputObjects=output_object_list))

    # 테스트 결과 저장
    with open('./result/test_results.json', 'w', encoding='utf-8') as f:
        json.dump([d.dict() for d in test_db], f, ensure_ascii=False, indent=2)        
            
