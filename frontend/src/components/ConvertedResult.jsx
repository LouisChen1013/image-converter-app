import { MdDownload, MdArchive } from "react-icons/md";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ConvertedResult({ convertedFiles, onClear }) {
  if (!convertedFiles || convertedFiles.length === 0) return null;

  /**
   * ZIP Download Logic
   * 透過 fetch 抓取後端檔案並打包成 ZIP
   */
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder("converted_images");

    try {
      for (let i = 0; i < convertedFiles.length; i++) {
        const file = convertedFiles[i];

        // 抓取後端路徑的二進位資料
        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`File ${i + 1} not found.`);

        const blob = await response.blob();
        const ext = file.format || "jpg";
        folder.file(`converted_image_${i + 1}.${ext}`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "converted_images.zip");
    } catch (err) {
      alert("Download All Failed: " + err.message);
    }
  };

  return (
    <div className="mt-10 max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
      <p className="mb-5 font-semibold text-green-700 text-xl">
        Conversion Complete!
      </p>

      <div className="flex flex-col gap-4 mb-8 items-center">
        {/* ZIP 打包按鈕 (多張時顯示) */}
        {convertedFiles.length > 1 && (
          <button
            onClick={handleDownloadAll}
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition duration-200 w-full"
          >
            <MdArchive className="h-6 w-6 mr-3" />
            Download All (ZIP)
          </button>
        )}

        {/* 單張下載列表 */}
        {convertedFiles.map((file, idx) => (
          <a
            key={idx}
            href={file.url}
            // 使用後端給的檔名或預設檔名
            download={file.filename || `image_${idx + 1}.${file.format}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition duration-200 w-full"
          >
            <MdDownload className="h-6 w-6 mr-3" />
            Download Image {idx + 1}
          </a>
        ))}
      </div>

      {/* 轉檔結果預覽圖 */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-gray-100 pt-8">
        {convertedFiles.map((file, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <img
              src={file.url}
              alt={`Converted ${idx + 1}`}
              className="w-32 h-32 rounded-lg border border-gray-200 object-contain shadow-sm bg-gray-50"
              // 處理圖片過期/已刪除的情況
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <p
              className="mt-2 text-xs text-gray-500 w-full text-center truncate px-1"
              title={file.filename}
            >
              {file.filename || `image_${idx + 1}.${file.format}`}
            </p>

            {/* 原本的格式標籤 */}
            <span className="text-[10px] font-bold text-blue-500 uppercase mt-1">
              {file.format}
            </span>
            {/* <span className="text-xs text-gray-400 mt-2">.{file.format}</span> */}
          </div>
        ))}
      </div>

      {onClear && (
        <button
          onClick={onClear}
          className="mt-10 px-8 py-3 bg-gray-100 text-gray-500 rounded-md font-medium hover:bg-gray-200 transition duration-200 text-sm"
        >
          Clear and Restart
        </button>
      )}
    </div>
  );
}
