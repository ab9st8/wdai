FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc build-essential libffi-dev dumb-init \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/

ENV UV_PROJECT_ENVIRONMENT=/usr/local

RUN pip install --upgrade pip setuptools wheel uv

RUN uv sync

COPY . /app

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["uv", "run", "python", "-m", "src.main"]
