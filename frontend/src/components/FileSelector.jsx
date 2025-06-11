import { useState, useCallback } from "react";
import ImagePreview from "./ImagePreview";

export default function FileSelector({
  onFilesSelected,
  previewUrls,
  onClear,
}) {
  // 選擇的圖片檔案（File 物件）
  const [internalFiles, setInternalFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleProcessFiles = useCallback(
    // 過濾非圖片檔案
    (selectedFilesArray) => {
      const imageFiles = selectedFilesArray.filter((file) =>
        file.type.startsWith("image/")
      );

      // 過濾掉已經存在的檔案
      const newFiles = imageFiles.filter(
        (file) =>
          !internalFiles.some(
            (f) => f.name === file.name && f.size === file.size
          )
      );

      // 圖片檔案生成預覽 URL
      const newUrls = newFiles.map((file) => {
        const isHeic = file.name.toLowerCase().endsWith(".heic");
        return isHeic ? "UNSUPPORTED_HEIC" : URL.createObjectURL(file);
      });

      // 合併後更新狀態與通知父元件
      const updatedFiles = [...internalFiles, ...newFiles];
      const updatedUrls = [...previewUrls, ...newUrls];

      // 更新內部狀態以顯示檔名列表
      setInternalFiles(updatedFiles);
      // URL 和原始檔案傳遞給父元件
      onFilesSelected(updatedUrls, updatedFiles);
    },
    [internalFiles, previewUrls, onFilesSelected]
  );

  // 處理拖曳檔案釋放事件
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files); // 獲取拖曳的檔案
    if (droppedFiles.length) {
      handleProcessFiles(droppedFiles);
    } else {
      console.warn(
        "No image file was dropped or the file type is unsupported."
      );
    }
  };

  // 處理選擇檔案事件
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files); // 獲取選擇的檔案
    if (selected.length) {
      handleProcessFiles(selected);
    } else {
      console.warn("No image file was selected.");
    }
  };

  return (
    <div
      // 拖曳相關事件處理
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`w-full p-10 border border-dashed rounded-lg transition
        ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 bg-gray-50"
        }
        text-center text-gray-600 text-lg font-medium cursor-pointer`}
    >
      <p className="mb-4">
        Drag and drop images here, or click to select files
      </p>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="fileInput"
      />
      <label
        htmlFor="fileInput"
        className="inline-block mt-3 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium cursor-pointer text-base"
      >
        Select Images
      </label>

      {previewUrls.length > 0 && internalFiles.length > 0 && (
        <div className="mt-8 mb-6">
          {/* 第一列：圖片預覽或 HEIC 提示 */}
          <ImagePreview
            previewUrls={previewUrls}
            internalFiles={internalFiles}
          />

          {/* 清除按鈕 */}
          {onClear && (
            <div className="mt-8 text-center">
              <button
                onClick={onClear}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition duration-200 ease-in-out text-base"
              >
                Clear All Images
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
