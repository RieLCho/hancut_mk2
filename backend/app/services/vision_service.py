import os
import io
import torch
import numpy as np
from PIL import Image
import requests
from transformers import CLIPProcessor, CLIPModel
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2, FasterRCNN_ResNet50_FPN_V2_Weights
from torchvision.transforms import functional as F

import faiss

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

        # 의자 이미지 폴더 경로
        self._chair_images_folder = "C:\\Users\\eeheu\\Documents\\15.Lab\\dataset\\chair"  # 폴더 경로
        print(f"의자 이미지 폴더 경로: {self._chair_images_folder}")
        self._chair_images = self._load_chair_images(self._chair_images_folder)
        print(f"총 {len(self._chair_images)} 개의 의자 이미지 로드 완료")
        
        self._chair_features = []
        self._faiss_index = None
        self._load_chair_embeddings()

    def _load_chair_images(self, folder_path):
        """폴더 내 이미지 파일들을 동적으로 불러오기"""
        print(f"폴더에서 이미지 파일 로딩 중... ({folder_path})")
        supported_formats = (".jpg", ".jpeg", ".png")  # 지원되는 이미지 형식
        image_files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.lower().endswith(supported_formats)]
        print(f"지원되는 이미지 형식 파일 {len(image_files)} 개 로드 완료")
        return image_files

    def _load_clip_model(self):
        """CLIP 모델 로드"""
        if self._clip_model is None:
            print("CLIP 모델 로드 중...")
            self._clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self._clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            print("CLIP 모델 로드 완료")
    
    # def _load_rcnn_model(self):
    #     """Faster R-CNN 모델 로드"""
    #     if self._rcnn_model is None:
    #         print("Faster R-CNN 모델 로드 중...")
    #         self._rcnn_weights = FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
    #         self._rcnn_model = fasterrcnn_resnet50_fpn_v2(weights=self._rcnn_weights)
    #         self._rcnn_model.eval()
    #         print("Faster R-CNN 모델 로드 완료")
    def _load_chair_embeddings(self):
        """의자 데이터셋을 CLIP 임베딩으로 변환하여 FAISS에 저장"""
        print("의자 이미지 임베딩 추출 및 FAISS 인덱스 생성 중...")
        self._load_clip_model()
        
        for img_path in self._chair_images:
            print(f"이미지 임베딩 추출 중: {img_path}")
            self._chair_features.append(self._get_clip_embedding(img_path))
        
        d = self._chair_features[0].shape[0]  # 임베딩 차원
        self._faiss_index = faiss.IndexFlatL2(d)
        self._faiss_index.add(np.array(self._chair_features))
        print("FAISS 인덱스 생성 완료")
        
    def _get_clip_embedding(self, image_path):
        """CLIP을 이용해 이미지 임베딩을 추출"""
        print(f"CLIP 임베딩 추출 중: {image_path}")
        image = Image.open(image_path).convert("RGB")
        inputs = self._clip_processor(images=image, return_tensors="pt")
        with torch.no_grad():
            embedding = self._clip_model.get_image_features(**inputs)
        return embedding.squeeze().numpy()

    async def _load_image_from_url(self, image_url: str) -> Image.Image:
        """URL에서 이미지 로드"""
        print(f"URL에서 이미지 로드 중: {image_url}")
        response = requests.get(image_url)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")

    def recommend_chair(self, user_image_path, top_k=3):
        """사용자 이미지와 유사한 의자 추천"""
        print(f"사용자 이미지에서 의자 추천 중: {user_image_path}")
        user_embedding = self._get_clip_embedding(user_image_path).reshape(1, -1)
        distances, indices = self._faiss_index.search(user_embedding, top_k)
        
        results = [(self._chair_images[i], distances[0][j]) for j, i in enumerate(indices[0])]
        print(f"추천된 의자 {top_k} 개: {results}")
        return results
    
    async def extract_style(self, image_url: str, user_image_path: str, top_k: int = 3) -> dict:
        """이미지에서 스타일 키워드 추출 및 의자 추천"""
        try:
            print("스타일 추출 시작...")
            # CLIP 모델 로드
            self._load_clip_model()
            
            # 이미지 로드
            image = await self._load_image_from_url(image_url)
            print("이미지 로드 완료")
            
            # 스타일 텍스트 프롬프트 생성
            style_texts = [f"an interior design in {style} style" for style in self._style_candidates]
            print("스타일 텍스트 프롬프트 생성 완료")
            
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
            print(f"스타일 추출 완료: {top_styles}")
            
            # 사용자 이미지로 의자 추천
            # recommendations = self.recommend_chair(user_image_path, top_k=3)
            
            # 스타일 추출 결과와 의자 추천 결과를 딕셔너리로 반환
            return {
                "styles": top_styles,
                # "recommended_chairs": recommendations
            }
    
        except Exception as e:
            print(f"스타일 추출 및 의자 추천 오류: {str(e)}")
            return {
                "styles": ["modern"],  # 오류 시 기본 스타일 반환
                "recommended_chairs": []
            }

    
    # async def detect_objects(self, image_url: str) -> list:
    #     """이미지에서 인테리어 관련 객체 탐지"""
    #     try:
    #         # Faster R-CNN 모델 로드
    #         self._load_rcnn_model()
            
    #         # 이미지 로드
    #         image = await self._load_image_from_url(image_url)
            
    #         # 이미지 전처리
    #         transform = self._rcnn_weights.transforms()
    #         x = [transform(image)]
            
    #         # 객체 탐지
    #         with torch.no_grad():
    #             predictions = self._rcnn_model(x)
            
    #         # 결과 파싱
    #         detected_objects = []
    #         for i, (boxes, labels, scores) in enumerate(zip(predictions[0]['boxes'], predictions[0]['labels'], predictions[0]['scores'])):
    #             if scores >= 0.7:  # 신뢰도 70% 이상만 고려
    #                 label = self._coco_labels[labels.item()]
    #                 if label in self._interior_objects:  # 인테리어 관련 객체만 필터링
    #                     detected_objects.append({
    #                         "label": label,
    #                         "confidence": float(scores.item())
    #                     })
            
    #         return detected_objects
            
    #     except Exception as e:
    #         print(f"객체 탐지 오류: {str(e)}")
    #         return []  # 오류 시 빈 리스트 반환


    
# 서비스 인스턴스 생성
vision_service = VisionService() 