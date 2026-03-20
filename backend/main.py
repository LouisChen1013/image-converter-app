import json
import os
import shutil
import uuid
import asyncio
from typing import Annotated, Literal, Optional, Tuple, Union

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from celery_app import celery_app
from tasks import async_convert_image
from celery.result import AsyncResult
from converter import OUTPUT_FORMATS, SUPPORTED_FORMATS

app = FastAPI()

# --- 1. 跨域設定 (CORS) ---
# 允許前端 Vite 連線
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)


# --- 2. 資料驗證模型 (Pydantic) ---
class ConvertOptions(BaseModel):
    """
    定義轉檔參數的格式，Pydantic 會自動幫我們檢查輸入是否符合規定
    """

    format: Literal["jpeg", "png", "webp"]
    resize: Optional[Union[Tuple[int, int], list[int]]] = None
    grayscale: Optional[bool] = False
    quality: Optional[int] = Field(None, ge=0, le=100)


# --- 3. 基礎資訊路由 ---
@app.get("/supported-formats")
async def get_supported_formats():
    return {"formats": OUTPUT_FORMATS}


# --- 4. 核心功能：發送轉檔任務 ---
@app.post("/convert/")
async def convert(
    file: Annotated[UploadFile, File()],
    params: Annotated[
        str,
        Form(
            description="轉檔參數的 JSON 字串",
            examples=['{"format": "webp", "quality": 80, "resize": [800, 600]}'],
        ),
    ],
):
    """
    1. 接收使用者上傳的圖片與參數
    2. 存入暫存區
    3. 發送「任務指令」給 RabbitMQ，但不等待結果，立刻回傳 ID
    """
    try:
        options = ConvertOptions.model_validate(json.loads(params))

        if options.format.lower() not in OUTPUT_FORMATS:
            raise HTTPException(status_code=400, detail="Unsupported output format.")

        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in SUPPORTED_FORMATS:
            raise HTTPException(status_code=400, detail="Unsupported input file type.")

        # 生成不重複的檔名 (使用 UUID)
        file_id = str(uuid.uuid4())
        input_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
        output_filename = f"{file_id}_converted.{options.format.lower()}"
        output_path = os.path.join(TEMP_DIR, output_filename)

        # 將上傳的檔案存入實體硬碟 (Worker 容器必須讀取此路徑)
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 使用 .delay() 觸發 Celery 非同步任務，任務會被排入 RabbitMQ 隊列
        # 此操作為 Non-blocking，API 會立即繼續執行並回傳任務 ID。
        task = async_convert_image.delay(
            input_path, output_path, options.model_dump()  # Pydantic 轉 dict 以便序列化
        )

        # 回傳任務 ID，前端拿到後會去連 WebSocket
        return {"task_id": task.id, "status": "pending"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task queuing failed: {str(e)}")


# --- 5. WebSocket：即時進度推播 ---
@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    建立一條雙向連線：
    1. 前端連進來後，API 開始監控該 task_id 的進度
    2. 一旦結果出爐，主動傳訊息通知前端，前端不用一直發 HTTP 請求詢問
    """

    # 接受前端的 WebSocket 建立持久連線
    await websocket.accept()
    try:
        while True:
            # 向 Celery 查詢該任務的最新狀況 (PENDING, STARTED, SUCCESS, FAILURE)
            result = AsyncResult(task_id, app=celery_app)

            response = {"status": result.state}

            if result.state == "SUCCESS":
                # 任務成功，回傳結果資料
                response["filename"] = os.path.basename(result.result["output_path"])
                await websocket.send_json(response)
                break  # 任務完成，跳出迴圈中斷 WS 連線

            elif result.state == "FAILURE":
                # 轉檔失敗，回傳錯誤原因
                response["error"] = str(result.info)
                await websocket.send_json(response)
                break

            # 若還在處理中，發送當前狀態給前端
            # 每秒檢查一次即可，避免無止盡的迴圈燒乾 CPU 資源
            await websocket.send_json(response)
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        # 使用者關閉視窗或連線中斷
        print(f"Client disconnected for task: {task_id}")


# --- 6. 檔案下載路由 ---
@app.get("/download/{filename}")
async def download_file(filename: str, background_tasks: BackgroundTasks):
    """
    提供轉換後圖片的下載。
    """
    file_path = os.path.join(TEMP_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or expired")

    # 使用 FastAPI 的 BackgroundTasks：當 FileResponse 傳送完畢後才執行刪除
    # background_tasks.add_task(os.remove, file_path)

    return FileResponse(
        file_path,
        filename=f"converted_{filename.split('_')[-1]}",  # 下載時的預設檔名
        media_type="application/octet-stream",
    )
