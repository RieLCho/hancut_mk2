FROM python:3.10.17-slim

WORKDIR /app

# 필수 도구 설치
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# UV 설치
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:/root/.local/bin:${PATH}"

# 먼저 pyproject.toml 복사
COPY pyproject.toml .

# UV로 의존성 설치
RUN uv sync

COPY . .

EXPOSE 8000
ENV PATH="/root/.cargo/bin:${PATH}"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]