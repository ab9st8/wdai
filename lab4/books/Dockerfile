FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ADD books /app
ADD commons /commons

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc build-essential libffi-dev dumb-init libpq-dev \
    && rm -rf /var/lib/apt/lists/*

ENV UV_PROJECT_ENVIRONMENT=/usr/local

RUN pip install --upgrade pip setuptools wheel uv

# do uv sync first, then install local package.
# other way around causes uv sync to remove the local package lul
RUN uv sync
RUN pip install -e /commons

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["uv", "run", "python", "-m", "src.main"]
