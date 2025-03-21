import os
import io
import torch
import numpy as np
from PIL import Image
import requests
from transformers import CLIPProcessor, CLIPModel
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2, FasterRCNN_ResNet50_FPN_V2_Weights
from torchvision.transforms import functional as F

class VisionService:
    """이미지 분석 서비스: 스타일 추출 및 객체 탐지"""
    
    def __init__(self):
        """모델 초기화"""
        # 모델 로드는 첫 요청 시 지연 로드
        self._clip_model = None
        self._clip_processor = None
        self._rcnn_model = None
        self._rcnn_weights = None
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
        # 인테리어 스타일 후보
        self._style_candidates = [
            "modern", "minimalist", "scandinavian", "industrial", "rustic", "bohemian", "traditional", 
            "contemporary", "mid-century modern", "art deco", "coastal", "farmhouse", "tropical", 
            "eclectic", "zen", "vintage", "retro"
        ]
    
    def _load_clip_model(self):
        """CLIP 모델 로드"""
        if self._clip_model is None:
            print("CLIP 모델 로드 중...")
            self._clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self._clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            print("CLIP 모델 로드 완료")
    
    def _load_rcnn_model(self):
        """Faster R-CNN 모델 로드"""
        if self._rcnn_model is None:
            print("Faster R-CNN 모델 로드 중...")
            self._rcnn_weights = FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
            self._rcnn_model = fasterrcnn_resnet50_fpn_v2(weights=self._rcnn_weights)
            self._rcnn_model.eval()
            print("Faster R-CNN 모델 로드 완료")
    
    async def _load_image_from_url(self, image_url: str) -> Image.Image:
        """URL에서 이미지 로드"""
        response = requests.get(image_url)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    
    async def extract_style(self, image_url: str) -> list:
        """이미지에서 스타일 키워드 추출"""
        try:
            # CLIP 모델 로드
            self._load_clip_model()
            
            # 이미지 로드
            image = await self._load_image_from_url(image_url)
            
            # 스타일 텍스트 프롬프트 생성
            style_texts = [f"an interior design in {style} style" for style in self._style_candidates]
            
            # CLIP 입력 준비
            inputs = self._clip_processor(
                text=style_texts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            # 이미지와 텍스트 임베딩 계산
            with torch.no_grad():
                outputs = self._clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            # 상위 3개 스타일 추출
            top_probs, top_indices = torch.topk(probs[0], k=3)
            top_styles = [self._style_candidates[idx.item()] for idx in top_indices]
            
            return top_styles
            
        except Exception as e:
            print(f"스타일 추출 오류: {str(e)}")
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
            print(f"객체 탐지 오류: {str(e)}")
            return []  # 오류 시 빈 리스트 반환

# 서비스 인스턴스 생성
vision_service = VisionService() 