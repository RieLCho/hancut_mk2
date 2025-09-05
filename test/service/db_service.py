from backend.app.services.vision_service import vision_service
from test.model.test_schemas import StoredData
from test.service.analyze_service import analyse_input_image, analyze_output_image
from test.service.generate_service import generate_output
import json
import os


base_dir = os.path.dirname(os.path.dirname(__file__))  # hancut_mk2/
img_dir = os.path.join(base_dir, "test", "data", "img_data.txt")
text_dir = os.path.join(base_dir, "test", "data", "text_data.txt")
result_dir = os.path.join(base_dir, "test","result", "test_results.json")


async def make_db(img_dir, text_dir, result_dir):
    print("DB 생성 시작: 모델 초기화 중...")
    try:
        # SIGLIP 모델 초기화
        vision_service._load_siglip_model()
        print("SIGLIP 모델 초기화 완료")
        
        # Faster R-CNN 모델 초기화
        vision_service._load_rcnn_model()
        print("Faster R-CNN 모델 초기화 완료")

    except Exception as e:
        print(f"모델 초기화 중 오류 발생: {str(e)}")
        raise e

    test_db = []
    count = 30      # 30개 테스트 케이스
    # 파일 읽기
    with open(img_dir, 'r', encoding='utf-8') as fp_img, open(text_dir, 'r', encoding='utf-8') as fp_text :
        # 케이스별로 테스트
        for idx, (img_url, text) in enumerate(zip(fp_img, fp_text), start=1):
            if idx > count:
                break
            # 좌우 공백 예방
            img_url = img_url.strip()
            text = text.strip()

            # 테스트 정보 초기화
            input_style_list = []
            input_object_list = []
            generated_prompt = ""
            generated_image_url = ""
            combined_text = ""
            output_style_list = []
            output_object_list = []

            # Input 이미지 분석
            input_style_list, input_object_list, combined_text = await analyse_input_image(img_url, text)

            
            # 추출된 정보 기반 인테리어 프롬프트 및 이미지 생성
            generated_prompt, generated_image_url = await generate_output(combined_text)

            # Output 이미지 분석
            output_style_list, output_object_list = await analyze_output_image(generated_image_url)

            test_db.append(StoredData(Text=text, InputStyles=input_style_list, 
                                        InputObjects=input_object_list,GeneratedPrompt=generated_prompt,
                                        GeneratedImageUrl=generated_image_url,
                                        OutputStyles=output_style_list, 
                                        OutputObjects=output_object_list))

    # 테스트 결과 저장
    with open(result_dir, 'w', encoding='utf-8') as f:
        json.dump([d.dict() for d in test_db], f, ensure_ascii=False, indent=2) 