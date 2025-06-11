import os
import io
import torch
import numpy as np
from PIL import Image, UnidentifiedImageError
import requests
from transformers import AutoModelForImageClassification, AutoImageProcessor
from safetensors import safe_open

from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2, FasterRCNN_ResNet50_FPN_V2_Weights
from torchvision.transforms import functional as F
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionService:
    """이미지 분석 서비스: 스타일 추출 및 객체 탐지"""

    def __init__(self):
        """모델 초기화"""
        # 모델 로드는 첫 요청 시 지연 로드
        self._siglip_model = None
        self._siglip_processor = None
        self._rcnn_model = None
        self._rcnn_weights = None

        # 캐시 디렉토리 설정
        self._cache_dir = os.path.expanduser("~/.cache/torch/hub")
        os.makedirs(self._cache_dir, exist_ok=True)
        logger.info(f"캐시 디렉토리: {self._cache_dir}")

        # COCO 데이터셋 라벨
        self._coco_labels = [
            "background", "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
            "traffic light", "fire hydrant", "street sign", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse",
            "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "hat", "backpack", "umbrella", "shoe",
            "eye glasses", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
            "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle", "plate", "wine glass", "cup", "fork", "knife",
            "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
            "donut", "cake", "chair", "couch", "potted plant", "bed", "mirror", "dining table", "window", "desk",
            "toilet", "door", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave", "oven",
            "toaster", "sink", "refrigerator", "blender", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
            "toothbrush", "hair brush"
        ]
        # 인테리어 관련 객체만 필터링
        self._interior_objects = [
            "chair", "couch", "potted plant", "bed", "mirror", "dining table", "window", "desk",
            "toilet", "door", "tv", "laptop", "refrigerator", "book", "clock", "vase"
        ]
        self._style_candidates = ["Asian", "Coastal", "Contemporary", "Craftsman",
         "Eclectic", "Farmhouse", "French Country", "Industrial", "Mediterranean",
          "Mid-Century Modern", "Modern", "Rustic", "Scandinavian", "Shabby Chic",
           "Southwestern", "Traditional", "Tropical", "Victorian"]

    def _load_siglip_model(self):
        """SIGLIP 모델 로드"""
        if self._siglip_model is None:
            print("SIGLIP 모델 로드 중...")

            try:
                # 모델 로드
                model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "siglip"))


                self._siglip_model = AutoModelForImageClassification.from_pretrained(
                    model_path,
                    config=model_path + "/config.json",
                    cache_dir=self._cache_dir
                )

                # 프로세서 로드
                self._siglip_processor = AutoImageProcessor.from_pretrained(
                    model_path,
                    cache_dir=self._cache_dir
                )

                print("SIGLIP 모델 로드 완료")
            except Exception as e:
                print(f"SIGLIP 모델 로드 중 오류 발생: {str(e)}")
                raise e

    def _load_rcnn_model(self):
        """Faster R-CNN 모델 로드"""
        if self._rcnn_model is None:
            logger.info("Faster R-CNN 모델 로드 중...")
            try:
                print("모델 초기화 중...")

                # 캐시 디렉토리 확인
                checkpoints_dir = os.path.join(self._cache_dir, "checkpoints")
                os.makedirs(checkpoints_dir, exist_ok=True)

                # 캐시 파일 경로 설정
                self._rcnn_weights = FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
                model_url = self._rcnn_weights.url
                filename = os.path.basename(model_url)
                cached_file = os.path.join(checkpoints_dir, filename)

                # 기존 캐시 파일이 존재하면 삭제 (손상된 파일일 수 있음)
                if os.path.exists(cached_file):
                    print(f"기존 캐시 파일 삭제 중: {cached_file}")
                    os.remove(cached_file)

                # 모델 생성
                self._rcnn_model = fasterrcnn_resnet50_fpn_v2(weights=self._rcnn_weights)
                self._rcnn_model.eval()

                print("Faster R-CNN 모델 로드 완료")
            except Exception as e:
                print(f"Faster R-CNN 모델 로드 중 오류 발생: {str(e)}")
                print(f"현재 캐시 디렉토리 내용: {os.listdir(self._cache_dir)}")

                # 두 번째 방법으로 시도 (직접 가중치 로딩)
                try:
                    print("대체 방법으로 모델 로드 시도 중...")
                    self._rcnn_model = fasterrcnn_resnet50_fpn_v2(pretrained=False)
                    self._rcnn_weights = FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
                    self._rcnn_model.eval()
                    print("Faster R-CNN 모델 로드 완료 (대체 방법)")
                except Exception as fallback_error:
                    print(f"대체 방법 실패: {str(fallback_error)}")
                    raise e

    async def _load_image_from_url(self, image_url: str) -> Image.Image:
        """URL에서 이미지 로드"""
        try:
            logger.info(f"이미지 다운로드 시도: {image_url}")
            response = requests.get(image_url)
            response.raise_for_status()

            # 이미지 데이터 확인
            image_data = response.content
            logger.info(f"다운로드 완료: {len(image_data)} 바이트")

            # 이미지 열기 전 파일 헤더 체크 (간단한 검증)
            if len(image_data) < 10:
                logger.error(f"이미지 데이터가 너무 작음: {len(image_data)} 바이트")
                raise ValueError("이미지 데이터가 유효하지 않습니다")

            # BytesIO로 변환하여 PIL로 열기
            image_bytes = io.BytesIO(image_data)
            try:
                image = Image.open(image_bytes).convert("RGB")
                logger.info(f"이미지 로드 성공: {image.format}, {image.size}")
                return image
            except UnidentifiedImageError as img_err:
                logger.error(f"이미지 형식 인식 불가: {str(img_err)}")
                # 이미지 형식 문제라면 더 자세한 로그 남기기
                header_bytes = image_data[:20]
                hex_header = ' '.join([f'{b:02x}' for b in header_bytes])
                logger.error(f"이미지 헤더 (hex): {hex_header}")
                raise ValueError(f"이미지 형식을 인식할 수 없습니다: {str(img_err)}")

        except requests.RequestException as req_err:
            logger.error(f"이미지 다운로드 중 요청 오류: {str(req_err)}")
            raise ValueError(f"이미지 URL에 접근할 수 없습니다: {str(req_err)}")
        except Exception as e:
            logger.error(f"이미지 로드 중 예상치 못한 오류: {str(e)}")
            raise ValueError(f"이미지 로드 실패: {str(e)}")

    async def extract_style(self, image_url: str) -> list:
        """이미지에서 스타일 키워드 추출"""
        print("extract_style 실행됨")
        try:
            # SIGLIP 모델 로드
            self._load_siglip_model()

            # 이미지 로드
            image = await self._load_image_from_url(image_url)

            # 스타일 텍스트 프롬프트 생성
            style_texts = [f"This is a photo of {style} style interior." for style in self._style_candidates]

            # SIGLIP 입력 준비
            logger.info("SIGLIP 모델에 입력 준비 중...")
            inputs = self._siglip_processor(
                text=style_texts,
                images=image,
                return_tensors="pt",
                padding="max_length"
            )

            # 이미지와 텍스트 임베딩 계산
            logger.info("모델 예측 시작...")
            with torch.no_grad():
                outputs = self._siglip_model(**inputs)
                logits = outputs.logits  # logits 속성 사용
                probs = torch.sigmoid(logits)

            # 상위 3개 스타일 추출
            top_probs, top_indices = torch.topk(probs[0], k=3)
            top_styles = [self._style_candidates[idx.item()] for idx in top_indices]
            logger.info(f"상위 3개 스타일: {top_styles}")

            return top_styles

        except Exception as e:
            logger.error(f"스타일 추출 오류: {str(e)}")
            return ["modern"]  # 오류 시 기본 스타일 반환


    async def detect_objects(self, image_url: str) -> list:
        """이미지에서 인테리어 관련 객체 탐지"""
        try:
            # Faster R-CNN 모델 로드
            self._load_rcnn_model()

            # 이미지 로드
            image = await self._load_image_from_url(image_url)

            # 이미지 전처리
            transform = self._rcnn_weights.transforms()
            x = [transform(image)]

            # 객체 탐지
            with torch.no_grad():
                predictions = self._rcnn_model(x)

            # 결과 파싱
            detected_objects = []
            for i, (boxes, labels, scores) in enumerate(zip(predictions[0]['boxes'], predictions[0]['labels'], predictions[0]['scores'])):
                if scores >= 0.7:  # 신뢰도 70% 이상만 고려
                    label = self._coco_labels[labels.item()]
                    if label in self._interior_objects:  # 인테리어 관련 객체만 필터링
                        detected_objects.append({
                            "label": label,
                            "confidence": float(scores.item())
                        })

            return detected_objects

        except Exception as e:
            logger.error(f"객체 탐지 오류: {str(e)}")
            return []  # 오류 시 빈 리스트 반환

# 서비스 인스턴스 생성
vision_service = VisionService()
