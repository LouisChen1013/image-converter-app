# Image Converter App

A high-performance, asynchronous web application to convert and optimize images. Powered by FastAPI, Celery, and RabbitMQ to handle heavy image processing tasks in the background without blocking the UI.

## Features

- Asynchronous Processing: Large batches of images are processed in the background via Celery workers.
- Real-time Updates: Track conversion progress and status via WebSockets.
- Flexible Conversion: Support for JPEG, PNG, and WebP formats.
- Image Optimization: Optional resizing, grayscale conversion, and quality adjustment.
- Batch Download: Download results individually or as a single ZIP file.
- Containerized Architecture: Fully dockerized for easy scaling of worker nodes.

## Tech Stack

- **Frontend:**
  - React (with Vite)
  - Tailwind CSS
  - React-Bootstrap
  - JSZip & FileSaver

- **Backend:**
  - FastAPI (Python)
  - Pillow (image processing)
  - uv
  - CORS support

- **Task Queue & Broker**
  - RabbitMQ
  - Celery
  - Celery Beat

- **Containerization:**
  - Docker
  - Docker Compose

## System Architecture

The application follows a producer-consumer pattern:

1. Producer (FastAPI): Receives image uploads, generates unique Task IDs, and pushes tasks into the RabbitMQ queue.

2. Message Broker (RabbitMQ): Manages the task distribution and ensures message reliability.

3. Consumer (Celery Worker): Listens to the queue, performs heavy image processing, and saves results.

4. WebSocket Manager: Notifies the frontend immediately when a task status changes to SUCCESS.

## Setup & Run with Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/LouisChen1013/image-converter-app.git
cd image-converter-app
```

### 2. Build and Start

```bash
docker compose up --build
```

This command builds and starts both backend and frontend containers.
• Frontend will be available at: <http://localhost:3000>
• Backend API will be available at: <http://localhost:8000>

### 3. Stop Containers

```bash
docker compose down
```

### 4. Setup & Run Without Docker

Backend (FastAPI + uv)

Install uv (if not already installed)
Follow the official installation instructions:  
 👉 <https://github.com/astral-sh/uv#installation>

```bash
uv sync
uv run fastapi dev
```

Backend runs at <http://localhost:8000>

Celery

```bash
uv run celery -A celery_app worker --loglevel=info
uv run celery -A celery_app beat --loglevel=info
```

Frontend (React + Vite)

```bash
npm install
npm run dev
```

Frontend runs at <http://localhost:3000>
