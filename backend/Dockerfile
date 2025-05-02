FROM python:3.9-slim

WORKDIR /app

# 필수 도구 설치
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# UV 설치
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:${PATH}"

COPY requirements.txt .

# UV로 의존성 설치
RUN uv pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]