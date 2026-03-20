import { useState, useCallback, useRef } from "react";
import ImagePreview from "./ImagePreview";

export default function FileSelector({
  onFilesSelected,
  previewUrls,
  onClear,
}) {
  const [internalFiles, setInternalFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleProcessFiles = useCallback(
    (selectedFilesArray) => {
      const imageFiles = selectedFilesArray.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.name.toLowerCase().endsWith(".heic"),
      );

      const newFiles = imageFiles.filter(
        (file) =>
          !internalFiles.some(
            (f) => f.name === file.name && f.size === file.size,
          ),
      );

      if (newFiles.length === 0) return;

      const newUrls = newFiles.map((file) => {
        const isHeic = file.name.toLowerCase().endsWith(".heic");
        return isHeic ? "UNSUPPORTED_HEIC" : URL.createObjectURL(file);
      });

      const updatedFiles = [...internalFiles, ...newFiles];
      const updatedUrls = [...previewUrls, ...newUrls];

      setInternalFiles(updatedFiles);
      onFilesSelected(updatedUrls, updatedFiles);
    },
    [internalFiles, previewUrls, onFilesSelected],
  );

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length) {
      handleProcessFiles(selected);
      e.target.value = "";
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    previewUrls.forEach((url) => {
      if (url && url !== "UNSUPPORTED_HEIC") URL.revokeObjectURL(url);
    });
    onClear();
    setInternalFiles([]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleProcessFiles(Array.from(e.dataTransfer.files));
      }}
      className={`w-full p-8 border-2 border-dashed rounded-xl transition-all
        ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50/50"}
        relative`}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.heic"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrls.length === 0 ? (
        <div
          className="py-12 cursor-pointer text-center"
          onClick={() => fileInputRef.current.click()}
        >
          <div className="text-4xl mb-4">📸</div>
          <p className="text-gray-600 font-medium">
            Drag images here or click to upload
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Supports JPG, PNG, WEBP, HEIC
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 w-full items-start">
            {/* 輸出圖片列表 */}
            <ImagePreview
              previewUrls={previewUrls}
              internalFiles={internalFiles}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="flex flex-col items-center group w-32"
            >
              {/* 上半部：虛線框 */}
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 group-hover:border-blue-400 group-hover:text-blue-500 transition-colors bg-white shadow-sm">
                <span className="text-3xl font-light">+</span>
              </div>

              {/* 下半部：佔位文字，確保整體高度與左側帶檔名的圖片一致 */}
              <p className="mt-2 text-xs font-medium text-gray-400 text-center w-full px-1 group-hover:text-blue-500 transition-colors">
                Add More
              </p>
            </button>
          </div>

          {/* Clear All 按鈕 */}
          <div className="mt-12">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all text-sm font-medium shadow-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
