from PIL import Image, UnidentifiedImageError
import pillow_heif

pillow_heif.register_heif_opener()
SUPPORTED_FORMATS = ["png", "jpeg", "jpg", "webp", "heic"]
OUTPUT_FORMATS = ["png", "jpeg", "jpg", "webp"]
FORMAT_MAPPING = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP"}


def _handle_transparency(img):
    """將帶有透明通道的圖片轉為白底 RGB"""
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, (0, 0), img if img.mode != "P" else img.convert("RGBA"))
        return background
    return img.convert("RGB") if img.mode != "RGB" else img


def _resize_image(img, resize):
    """處理等比縮放邏輯"""
    if not isinstance(resize, (list, tuple)) or not resize:
        return img

    # might need to optimize the resize input
    width, height = (resize + [None, None])[:2]

    if width is None and height is None:
        return img
    elif width is None:
        width = int(img.width * height / img.height)
    elif height is None:
        height = int(img.height * width / img.width)

    if width > 0 and height > 0:
        return img.resize((width, height))
    raise ValueError(
        "Invalid resize dimensions. Width and height must be positive numbers."
    )


def convert_image(
    input_path, output_path, format, resize=None, grayscale=False, quality=None
):
    try:
        format = format.lower()
        if format not in OUTPUT_FORMATS:
            raise ValueError(f"Unsupported format: {format}")

        with Image.open(input_path) as img:
            # 處理格式與模式轉換
            if format in ("jpeg", "jpg"):
                img = _handle_transparency(img)
            elif img.mode not in ("RGB", "RGBA", "L"):
                img = img.convert("RGB")

            # 灰階處理
            if grayscale and img.mode != "L":
                img = img.convert("L")

            # 縮放處理
            img = _resize_image(img, resize)

            # 儲存參數
            save_kwargs = {}
            if format in {"jpeg", "jpg", "webp"} and quality is not None:
                save_kwargs["quality"] = quality

            pillow_format = FORMAT_MAPPING.get(format, format.upper())
            img.save(output_path, format=pillow_format, **save_kwargs)

    except UnidentifiedImageError:
        raise ValueError("Uploaded file is not a valid image.")
    except Exception as e:
        raise RuntimeError(f"Image processing failed: {str(e)}")
