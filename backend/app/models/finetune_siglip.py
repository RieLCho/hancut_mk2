# 1. 라이브러리 설치
# !pip install datasets transformers evaluate accelerate scikit-learn torchvision timm --quiet
from google.colab import drive
drive._mount('/content/drive')
from datasets import load_dataset
from transformers import SiglipForImageClassification,AutoModelForImageClassification, AutoImageProcessor, TrainingArguments, Trainer
import torch
print(torch.cuda.is_available())
from torchvision import transforms
from PIL import Image
from transformers import default_data_collator
from torch.utils.data import default_collate
from torchvision.transforms import Compose, Resize, ToTensor, Normalize, RandomRotation, RandomAdjustSharpness
import evaluate

# Colab에서 진행 !
dataset = load_dataset("imagefolder", data_dir="/content/drive/MyDrive/dataset/dataset_train")

# 데이터셋 로드
split = dataset['train'].train_test_split(test_size=0.2, stratify_by_column="label")
train_data = split['train']
eval_data = split['test']

# 라벨 정의
labels_list = train_data.features["label"].names
id2label = {i: l for i, l in enumerate(labels_list)}
label2id = {l: i for i, l in enumerate(labels_list)}


# SIGLIP 로드, 이미지 전처리 모델
model_name = "google/siglip-base-patch16-224"
processor = AutoImageProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(
    model_name,
    num_labels=19,  # 분류 클래스 수(데이터셋 라벨 수)
    ignore_mismatched_sizes=True
)

# Train, Test 데이터에 적용하는 이미지 전처리
_train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=processor.image_mean, std=processor.image_std)
])

_val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=processor.image_mean, std=processor.image_std)
])


# 이미지를 픽셀 값으로 바꿈
def train_transforms(example):
    image = example["image"].convert("RGB")
    example["pixel_values"] = _train_transforms(image)
    return example

def val_transforms(example):
    image = example["image"].convert("RGB")
    example["pixel_values"] = _val_transforms(image)
    return example

train_data = train_data.map(train_transforms)
eval_data = eval_data.map(val_transforms)


# pixel_values, label로 설정
train_data.set_format(type="torch", columns=["pixel_values", "label"])
eval_data.set_format(type="torch", columns=["pixel_values", "label"])

# TrainingArguments
training_args = TrainingArguments(
    output_dir="./outputs",
    report_to="none",
    logging_dir="./logs",
    metric_for_best_model="accuracy",
    greater_is_better=True,
    per_device_train_batch_size=64,
    per_device_eval_batch_size=16,
    num_train_epochs=5,
    logging_steps=10,
    save_total_limit=2,
)

# 정확도 평가
import evaluate
accuracy_metric = evaluate.load("accuracy")

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = torch.argmax(torch.tensor(logits), dim=-1)
    return accuracy_metric.compute(predictions=predictions, references=labels)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_data,
    eval_dataset=eval_data,
    compute_metrics=compute_metrics,
)

trainer.train()
trainer.evaluate()
# 모델 저장
trainer.save_model("/content/drive/MyDrive/siglip_model")
processor.save_pretrained("/content/drive/MyDrive/siglip_model")