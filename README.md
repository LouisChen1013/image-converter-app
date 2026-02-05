# Image Converter App

A modern and intuitive web application to convert and optimize images directly in the browser. Built with FastAPI for the backend and React (Vite) for the frontend. Users can upload images, adjust conversion settings (format, resize, grayscale, quality), and download individual or zipped images after processing.

## Features

- Convert images to JPEG, PNG, or WebP
- Optional resize with custom width and height
- Convert to grayscale
- Adjust image quality
- Drag-and-drop or manual upload
- Download converted files individually or all at once (as ZIP)
- Clear results and re-upload
- Fast, responsive UI built with React + Tailwind CSS + React-Bootstrap
- Backend processing with FastAPI

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

- **Containerization:**
  - Docker
  - Docker Compose

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

Frontend (React + Vite)

```bash
npm install
npm run dev
```

Frontend runs at <http://localhost:3000>
