FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY backend /app

RUN uv sync --frozen --no-cache

EXPOSE 8000

# CMD ["uv", "run", "fastapi", "dev", "--port", "8000", "--host", "0.0.0.0"]
CMD ["uv", "run", "fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]



