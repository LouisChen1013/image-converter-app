import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";

export default function ConvertForm({ files, onConvert, supportedFormats }) {
  const [format, setFormat] = useState("jpeg");
  const [resize, setResize] = useState({ width: "", height: "" });
  const [grayscale, setGrayscale] = useState(false);
  const [quality, setQuality] = useState(80);
  const [formError, setFormError] = useState(null);

  // 當檔案列表變動時，重置錯誤訊息
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

    // --- 尺寸邏輯處理 ---
    let resizeParam = null;
    const w = parseInt(resize.width);
    const h = parseInt(resize.height);

    if (resize.width || resize.height) {
      if (
        (resize.width && (isNaN(w) || w <= 0)) ||
        (resize.height && (isNaN(h) || h <= 0))
      ) {
        setFormError("Width and height must be valid positive numbers.");
        return;
      }

      // 這裡改為傳送 [width, height]，若其中一個沒填則傳 null
      // 這樣後端的 converter.py 才能正確處理等比縮放
      resizeParam = [resize.width ? w : null, resize.height ? h : null];
    }

    // --- 品質邏輯處理 ---
    const parsedQuality = parseInt(quality);
    if (isNaN(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
      setFormError("Quality must be a number between 1 and 100.");
      return;
    }

    // 建立參數物件
    const params = {
      format,
      // 只有當使用者有輸入尺寸時才加入 resize 欄位
      ...(resizeParam ? { resize: resizeParam } : {}),
      grayscale,
      quality: parsedQuality,
    };

    // 呼叫 App.jsx 的 handleConvert，開始執行 WebSocket 流程
    onConvert(files, params);
  };

  const isSubmitDisabled = !files || files.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-10 w-full">
      {/* Error Message */}
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

      {/* Format Selection */}
      <label className="block text-gray-700 font-medium text-base">
        Target Format
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {supportedFormats.map((fmt) => (
            <option key={fmt} value={fmt}>
              {fmt.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      {/* Resize Input */}
      <div className="flex gap-6">
        <label className="flex-1 text-gray-700 font-medium text-base">
          Width (px)
          <input
            type="number"
            min="1"
            value={resize.width}
            onChange={(e) => setResize({ ...resize, width: e.target.value })}
            placeholder="Optional"
            className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="flex-1 text-gray-700 font-medium text-base">
          Height (px)
          <input
            type="number"
            min="1"
            value={resize.height}
            onChange={(e) => setResize({ ...resize, height: e.target.value })}
            placeholder="Optional"
            className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
      </div>

      {/* Grayscale Toggle */}
      <label className="flex items-center gap-3 text-gray-700 font-medium text-base cursor-pointer">
        <input
          type="checkbox"
          checked={grayscale}
          onChange={(e) => setGrayscale(e.target.checked)}
          className="h-5 w-5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>Apply Grayscale Filter</span>
      </label>

      {/* Quality Slider/Input */}
      <label className="block text-gray-700 font-medium text-base">
        Quality (1–100)
        <input
          type="number"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={`w-full py-4 rounded-md font-semibold text-xl transition duration-200 
          ${isSubmitDisabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
      >
        Start Conversion
      </button>
    </form>
  );
}
