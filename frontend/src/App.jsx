import { useState, useEffect } from "react";
import FileSelector from "./components/FileSelector";
import ConvertForm from "./components/ConvertForm";
import ConvertedResult from "./components/ConvertedResult";
import axios from "axios";
import { MdClose } from "react-icons/md";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appError, setAppError] = useState(null);
  const [fileSelectorKey, setFileSelectorKey] = useState(0);
  const [supportedFormats, setSupportedFormats] = useState([
    "jpeg",
    "png",
    "webp",
  ]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [previewUrls, convertedFiles]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/supported-formats`)
      .then((res) => {
        if (Array.isArray(res.data.formats)) {
          setSupportedFormats(res.data.formats);
        }
      })
      .catch(() => {
        console.warn(
          "Failed to load supported formats. Using default formats."
        );
      });
  }, []);

  /**
   * 處理 ConvertForm 的異步操作。
   * 接收來自 ConvertForm 的檔案和轉換參數，並發送請求到後端。
   * @param {File[]} files 要轉換的檔案陣列
   * @param {Object} params 轉換參數
   */
  const handleConvert = async (files, params) => {
    if (!files || files.length === 0) {
      setAppError("Please select image files to convert.");
      return;
    }

    setIsLoading(true);
    setAppError(null);

    convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setConvertedFiles([]);

    try {
      const convertedResults = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("params", JSON.stringify(params));

        const res = await axios.post(`${API_BASE_URL}/convert/`, formData, {
          responseType: "blob",
        });

        const blob = new Blob([res.data]);
        const url = URL.createObjectURL(blob);
        convertedResults.push({ url, format: params.format });
      }
      setConvertedFiles(convertedResults);
    } catch (err) {
      console.error("Conversion failed:", err);
      setAppError(
        "轉換失敗：" +
          (err.response?.data?.detail ||
            err.message ||
            "Unknown error. Please try again later.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 處理 FileSelector 選定檔案後的邏輯。
   * 從 FileSelector 接收預覽 URL 和原始檔案。
   * @param {string[]} urls 預覽 URL 陣列
   * @param {File[]} files 原始檔案陣列
   */
  const handleFilesSelected = (urls, files) => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setAppError(null);

    setPreviewUrls(urls);
    setSelectedFiles(files);
    setConvertedFiles([]);
  };

  /**
   * 清除所有檔案選擇、預覽和轉換結果的狀態，並釋放所有 URL 資源。
   * 同時強制 FileSelector 重置其內部檔案輸入框。
   */
  const handleClearAll = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));

    setPreviewUrls([]);
    setSelectedFiles([]);
    setConvertedFiles([]);
    setAppError(null);

    // 清空 FileSelector：1. 傳空陣列 2. 更新 key 強制重掛載
    handleFilesSelected([], []);
    setFileSelectorKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-md border border-gray-100 p-10">
        {/* Loading 遮罩 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <h1 className="text-4xl font-semibold mb-10 text-center text-gray-800">
          Image Converter
        </h1>

        {/* 應用層級錯誤 */}
        {appError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-md relative mb-6 flex items-start"
            role="alert"
          >
            <div className="flex-grow">
              <strong className="font-medium">Error!</strong>
              <span className="block sm:inline"> {appError}</span>
            </div>
            <span
              className="ml-4 cursor-pointer"
              onClick={() => setAppError(null)}
            >
              <MdClose className="h-6 w-6 text-red-500" />
            </span>
          </div>
        )}

        {/* 檔案選擇器：key 改變時強制重掛載重置狀態 */}
        <FileSelector
          key={fileSelectorKey}
          onFilesSelected={handleFilesSelected}
          previewUrls={previewUrls}
          onClear={handleClearAll}
        />

        {/* 轉換表單：根據 files 判斷是否禁用提交 */}
        <ConvertForm
          files={selectedFiles}
          onConvert={handleConvert}
          supportedFormats={supportedFormats}
        />

        {/* 轉換結果顯示區域，僅在有轉換結果時顯示 */}
        {convertedFiles.length > 0 && (
          <ConvertedResult
            convertedFiles={convertedFiles}
            onClear={handleClearAll}
          />
        )}
      </div>
    </div>
  );
}

export default App;
