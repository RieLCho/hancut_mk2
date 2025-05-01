from datasets import load_dataset
from transformers import SiglipForImageClassification, AutoImageProcessor, TrainingArguments, Trainer
import torch
from torchvision.transforms import Compose, Resize, ToTensor, Normalize
from PIL import Image
from transformers import default_data_collator

def finetune_siglip():
    print("파인튜닝 중...")

    # 1. 데이터셋 로드 (imagefolder 포맷)
    dataset = load_dataset("imagefolder", data_dir="dataset/dataset_train/dataset_train")
    print("전체 데이터셋:", dataset)

    # 2. train/validation split (라벨 비율 유지)
    split = dataset['train'].train_test_split(test_size=0.2, stratify_by_column="label")
    train_data = split['train']
    eval_data = split['test']

    print(f"Train size: {len(train_data)}")
    print(f"Eval size: {len(eval_data)}")

    # 3. 라벨 정보 추출
    labels_list = train_data.features["label"].names
    id2label = {i: l for i, l in enumerate(labels_list)}
    label2id = {l: i for i, l in enumerate(labels_list)}

    # 4. 전처리 및 모델 준비
    processor = AutoImageProcessor.from_pretrained("google/siglip-base-patch16-224")
    model = SiglipForImageClassification.from_pretrained(
        "google/siglip-base-patch16-224",
        num_labels=len(labels_list),
        id2label=id2label,
        label2id=label2id
    )

    # 5. 이미지 전처리(transform)
    image_mean, image_std = processor.image_mean, processor.image_std
    size = processor.size["height"]

    train_transforms = Compose([
        Resize((size, size)),
        ToTensor(),
        Normalize(mean=image_mean, std=image_std)
    ])
    val_transforms = Compose([
        Resize((size, size)),
        ToTensor(),
        Normalize(mean=image_mean, std=image_std)
    ])

    def apply_transforms(example):
        image = example['image'].convert("RGB")
        example['pixel_values'] = processor(image, return_tensors="pt")["pixel_values"][0]
        return example

    train_data = train_data.map(apply_transforms, remove_columns=["image"])
    eval_data = eval_data.map(apply_transforms, remove_columns=["image"])


    # 6. Trainer 설정 및 학습
    training_args = TrainingArguments(
        output_dir="siglip-finetuned-interior",
        evaluation_strategy="epoch",
        learning_rate=2e-6,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=8,
        num_train_epochs=3,  # 필요에 따라 조정
        weight_decay=0.01,
        save_strategy='epoch',
        load_best_model_at_end=True,
        logging_dir='./logs',
        report_to="none"
    )

    def compute_metrics(eval_pred):
        import numpy as np
        predictions = eval_pred.predictions
        label_ids = eval_pred.label_ids
        predicted_labels = predictions.argmax(axis=1)
        acc = (predicted_labels == label_ids).mean()
        return {"accuracy": acc}

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_data,
        eval_dataset=eval_data,
        compute_metrics=compute_metrics,
        data_collator=default_data_collator
    )

    trainer.train()
    print("파인튜닝 완료!")

    # 7. 모델 저장
    trainer.save_model("siglip-finetuned-interior-final")
    print("모델 저장 완료!")

