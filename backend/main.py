import json
import os
import shutil
import uuid
from typing import Annotated, Literal, Optional, Tuple, Union

from converter import OUTPUT_FORMATS, SUPPORTED_FORMATS, convert_image
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator

app = FastAPI()

# CORS 設定，允許前端 Vite 連線
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

media_types = {
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)


def delete_file_safely(path: str):
    """Deletes a file if it exists, logging any errors."""
    if os.path.exists(path):
        try:
            os.remove(path)
            print(f"Cleaned up file: {path}")
        except OSError as e:
            print(f"Error deleting file {path}: {e}")


# Pydantic 模型驗證 params
class ConvertOptions(BaseModel):
    format: Literal["jpeg", "png", "webp"]
    resize: Optional[Union[Tuple[int, int], list[int]]] = None
    grayscale: Optional[bool] = False
    quality: Optional[int] = None

    @field_validator("quality")
    @classmethod
    def check_quality_range(cls, v: int) -> int:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("quality must be between 0 and 100")
        return v


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/supported-formats")
async def get_supported_formats():
    return {"formats": OUTPUT_FORMATS}


@app.post("/convert/")
async def convert(
    file: Annotated[UploadFile, File()],
    params: Annotated[str, Form()],
    background_tasks: BackgroundTasks,
):
    input_path = ""
    output_path = ""

    try:
        # 將 params JSON 字串轉成 ConvertOptions
        print(f"Received params: {params}")
        options = ConvertOptions.model_validate(json.loads(params))
        if options.format.lower() not in SUPPORTED_FORMATS:
            raise HTTPException(status_code=400, detail="Unsupported format.")

        if options.format.lower() not in OUTPUT_FORMATS:
            raise HTTPException(
                status_code=400, detail="Only jpeg/png/webp output is supported."
            )

        # 儲存上傳檔案到暫存目錄
        file_id = str(uuid.uuid4())
        input_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
        output_path = os.path.join(
            TEMP_DIR, f"{file_id}_converted.{options.format.lower()}"
        )

        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 呼叫你的圖片轉換函式
        convert_image(
            input_path=input_path,
            output_path=output_path,
            format=options.format,
            resize=options.resize,
            grayscale=options.grayscale,
            quality=options.quality,
        )
        print(f"Conversion completed: {output_path}")

        # 背景刪除 output 檔案
        background_tasks.add_task(delete_file_safely, output_path)

        # 回傳轉換後檔案
        response = FileResponse(
            output_path,
            filename=f"converted.{options.format.lower()}",
            media_type=media_types[options.format.lower()],
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

    finally:
        # 清理暫存檔案
        if input_path and os.path.exists(input_path):
            try:
                os.remove(input_path)
                print(f"Cleaned up input file: {input_path}")
            except OSError as e:
                print(f"Error deleting input file {input_path}: {e}")
