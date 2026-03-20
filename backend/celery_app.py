import os
from celery import Celery


broker_url = os.getenv("CELERY_BROKER_URL", "pyamqp://guest:guest@localhost:5672//")

# 初始化實例
celery_app = Celery(
    "image_app",
    broker=broker_url,
    backend="rpc://",  # 使用 RPC 協定回傳任務執行結果
    include=["tasks"],  # 告訴 Worker 去哪裡載入任務定義 tasks.py
)

# Celery 細節配置
celery_app.conf.update(
    task_track_started=True,  # 追蹤任務是否已開始執行
    task_serializer="json",  # 任務資料序列化格式
    result_expires=3600,  # 結果保留時間 (1小時)
)

# 定時排程
celery_app.conf.beat_schedule = {
    "cleanup-every-hour": {
        "task": "cleanup_old_files",
        "schedule": 3600.0,  # 每 3600 秒執行一次
    },
}
