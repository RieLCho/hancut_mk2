from test.service import db_service
import os
import asyncio
import json

base_dir = os.path.dirname(os.path.dirname(__file__))  # hancut_mk2/
img_dir = os.path.join(base_dir, "test", "data", "img_data.txt")
text_dir = os.path.join(base_dir, "test", "data", "text_data.txt")
db_dir = os.path.join(base_dir, "test","result", "test_db.json")
style_result_dir = os.path.join(base_dir, "test", "result", "style_result.txt")
object_result_dir = os.path.join(base_dir, "test", "result", "object_result.txt")


async def test():
    # 테스트용 DB 생성
    await db_service.make_db(img_dir, text_dir, db_dir)
    
    # test_db JSON 파일 로드
    with open(db_dir, "r", encoding="utf-8") as f:
        results = json.load(f)    
    
    style_logs = []
    object_logs = []
    style_accuracy_list = []
    object_accuracy_list = []

    # 테스트 시작
    try : 
        for idx, item in enumerate(results, start=1):
            input_styles = set(item["InputStyles"])
            output_styles = set(item["OutputStyles"])
            input_objects = set(item["InputObjects"])
            output_objects = set(item["OutputObjects"])

            style_intersection = input_styles & output_styles
            object_intersection = input_objects & output_objects

            style_acc = len(style_intersection) / len(input_styles) * 100 if input_styles else 0.0
            object_acc = len(object_intersection) / len(input_objects) * 100 if input_objects else 0.0

            style_accuracy_list.append(style_acc)
            object_accuracy_list.append(object_acc)

            # style 로그
            style_logs.append(f"[Case {idx}]")
            style_logs.append(f"- Input Styles      : {sorted(input_styles)}")
            style_logs.append(f"- Output Styles     : {sorted(output_styles)}")
            style_logs.append(f"- Intersection      : {sorted(style_intersection)}")
            style_logs.append(f"- Accuracy          : {style_acc:.2f}%")
            style_logs.append("-" * 50)

            # object 로그
            object_logs.append(f"[Case {idx}]")
            object_logs.append(f"- Input Objects     : {sorted(input_objects)}")
            object_logs.append(f"- Output Objects    : {sorted(output_objects)}")
            object_logs.append(f"- Intersection      : {sorted(object_intersection)}")
            object_logs.append(f"- Accuracy          : {object_acc:.2f}%")
            object_logs.append("-" * 50)

        # 평균 정확도
        mean_style_accuracy = sum(style_accuracy_list) / len(style_accuracy_list) if style_accuracy_list else 0.0
        mean_object_accuracy = sum(object_accuracy_list) / len(object_accuracy_list) if object_accuracy_list else 0.0

        style_logs.append("[Total]")
        style_logs.append(f"- Mean Style Accuracy  : {mean_style_accuracy:.2f}%")

        object_logs.append("[Total]")
        object_logs.append(f"- Mean Object Accuracy : {mean_object_accuracy:.2f}%")

    except Exception as e:
        print(f"분석 중 오류 발생: {str(e)}")
        raise e

    # 파일 저장
    with open(style_result_dir, "w", encoding="utf-8") as f:
        f.write("\n".join(style_logs))

    with open(object_result_dir, "w", encoding="utf-8") as f:
        f.write("\n".join(object_logs))


# 테스트 시작
if __name__ == "__main__" :
    asyncio.run(test())
       
            
