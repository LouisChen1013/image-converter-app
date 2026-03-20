import os
import time
from celery_app import celery_app
from converter import convert_image


@celery_app.task(name="image_convert")
def async_convert_image(input_path, output_path, options_dict):
    """
    由 Celery Worker 執行的耗時轉檔任務。
    """
    try:
        convert_image(
            input_path=input_path,
            output_path=output_path,
            format=options_dict["format"],
            resize=options_dict.get("resize"),
            grayscale=options_dict.get("grayscale", False),
            quality=options_dict.get("quality"),
        )

        # 任務完成後，立即刪除「原始上傳檔」以節省空間，結果檔則保留在硬碟供下載路由使用
        if os.path.exists(input_path):
            os.remove(input_path)

        # 回傳給 Celery Backend 的資料，WebSocket 會讀取到此 dictionary
        return {"status": "success", "output_path": output_path}

    except Exception as e:
        # 若失敗，回傳錯誤狀態
        return {"status": "error", "message": str(e)}


@celery_app.task(name="cleanup_old_files")
def cleanup_old_files(max_age_seconds=3600):
    """
    定時清理任務：掃描暫存資料夾，刪除過期的老舊檔案。
    max_age_seconds: 檔案保留時間（秒），預設為 1 小時 (3600s)。
    """
    temp_dir = "/app/temp"
    now = time.time()
    count = 0

    if not os.path.exists(temp_dir):
        return "Temp directory not found"

    for filename in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, filename)
        # 檢查檔案最後修改時間
        if os.stat(file_path).st_mtime < (now - max_age_seconds):
            try:
                os.remove(file_path)
                count += 1
            except Exception as e:
                print(f"Error deleting {filename}: {e}")

    return f"Cleaned up {count} files."
