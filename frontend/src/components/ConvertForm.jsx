import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";

export default function ConvertForm({ files, onConvert, supportedFormats }) {
  const [format, setFormat] = useState("jpeg");
  const [resize, setResize] = useState({ width: "", height: "" });
  const [grayscale, setGrayscale] = useState(false);
  const [quality, setQuality] = useState(80);
  const [formError, setFormError] = useState(null);

  // 當傳入的檔案列表改變時，清除任何表單錯誤訊息。
  useEffect(() => {
    setFormError(null);
  }, [files]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!files || files.length === 0) {
      setFormError("Please select image files to convert.");
      return;
    }

    let resizeParam;
    if (resize.width || resize.height) {
      const parsedWidth = parseInt(resize.width);
      const parsedHeight = parseInt(resize.height);

      if (
        (resize.width && (isNaN(parsedWidth) || parsedWidth <= 0)) ||
        (resize.height && (isNaN(parsedHeight) || parsedHeight <= 0))
      ) {
        setFormError("Width and height must be valid positive numbers.");
        return;
      }

      if (resize.width && resize.height) {
        resizeParam = [parsedWidth, parsedHeight];
      }
    }

    const parsedQuality = parseInt(quality);
    if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
      setFormError("Quality must be a number between 1 and 100.");
      return;
    }

    const params = {
      format,
      ...(resizeParam ? { resize: resizeParam } : {}),
      grayscale,
      quality: parsedQuality,
    };

    // 使用父元件傳遞下來的 onConvert 函數轉換
    onConvert(files, params);
  };

  // 判斷是否禁用提交按鈕：無檔案時禁用
  const isSubmitDisabled = !files || files.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-10 w-full">
      {/* 表單錯誤訊息 */}
      {formError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-md relative"
          role="alert"
        >
          <strong className="font-medium">Error!</strong>
          <span className="block sm:inline"> {formError}</span>
          <span
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setFormError(null)}
          >
            <MdClose className="h-6 w-6 text-red-500" />
          </span>
        </div>
      )}

      {/* 格式選擇 */}
      <label className="block text-gray-700 font-medium text-base">
        Format
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {supportedFormats.map((fmt) => (
            <option key={fmt} value={fmt}>
              {fmt.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      {/* 尺寸輸入區域 */}
      <div className="flex gap-6">
        <label className="flex-1 text-gray-700 font-medium text-base">
          Width
          <input
            type="number"
            min="1"
            value={resize.width}
            onChange={(e) => setResize({ ...resize, width: e.target.value })}
            placeholder="Width px (optional)"
            className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </label>

        <label className="flex-1 text-gray-700 font-medium text-base">
          Height
          <input
            type="number"
            min="1"
            value={resize.height}
            onChange={(e) => setResize({ ...resize, height: e.target.value })}
            placeholder="Height px (optional)"
            className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
      </div>

      {/* 灰階選項 */}
      <label className="flex items-center gap-3 text-gray-700 font-medium text-base">
        <input
          type="checkbox"
          checked={grayscale}
          onChange={(e) => setGrayscale(e.target.checked)}
          className="h-5 w-5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>Grayscale</span>
      </label>

      {/* 品質輸入 */}
      <label className="block text-gray-700 font-medium text-base">
        Quality (1–100)
        <input
          type="number"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </label>

      {/* 提交按鈕 */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={`w-full py-4 rounded-md font-semibold text-xl transition duration-200 ease-in-out
          ${
            isSubmitDisabled
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
      >
        Start Conversion
      </button>
    </form>
  );
}
