import { MdDownload } from "react-icons/md";
import { MdArchive } from "react-icons/md";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ConvertedResult({ convertedFiles, onClear }) {
  if (!convertedFiles || convertedFiles.length === 0) return null;

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder("converted_images");

    for (let i = 0; i < convertedFiles.length; i++) {
      const file = convertedFiles[i];
      const response = await fetch(file.url);
      const blob = await response.blob();
      const ext = file.format || "jpg";
      folder.file(`converted_image_${i + 1}.${ext}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "converted_images.zip");
  };

  return (
    <div className="mt-10 max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
      <p className="mb-5 font-semibold text-green-700 text-xl">
        Conversion Complete!
      </p>
      <p className="mb-8 text-gray-600 text-base">
        Click the buttons below to download your converted images:
      </p>

      {/* 下載按鈕區域 */}
      <div className="flex flex-col gap-4 mb-8 items-center">
        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center justify-center w-1/2 px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition duration-200 ease-in-out text-lg w-full sm:w-auto min-w-[14rem]"
        >
          <MdArchive className="h-6 w-6 mr-3" />
          Download All Images
        </button>

        {convertedFiles.map((file, idx) => (
          <a
            key={idx}
            href={file.url}
            download={`converted_image_${idx + 1}.${file.format}`}
            className="inline-flex items-center justify-center w-1/2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition duration-200 ease-in-out text-lg w-full sm:w-auto min-w-[14rem]"
          >
            <MdDownload className="h-6 w-6 mr-3" />
            Download Image {idx + 1}
          </a>
        ))}
      </div>

      {/* 圖片預覽區域 (轉換後) */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-gray-100 pt-8">
        {convertedFiles.map((file, idx) => (
          <img
            key={idx}
            src={file.url}
            alt={`Converted image ${idx + 1}`}
            className="w-36 h-36 rounded-lg border border-gray-200 object-contain shadow-sm"
          />
        ))}
      </div>

      {/* 清除結果並重新轉換的按鈕，只有當 onClear prop 存在時才顯示 */}
      {onClear && (
        <button
          onClick={onClear}
          className="mt-10 px-8 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition duration-200 ease-in-out text-base"
        >
          Clear Results and Convert Again
        </button>
      )}
    </div>
  );
}
