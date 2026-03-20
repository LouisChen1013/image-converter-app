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

  // Cleanup: 畫面上傳預覽圖時產生的臨時 URL，避免記憶體洩漏
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Initial Load: 向後端請求支援的格式清單
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/supported-formats`)
      .then((res) => {
        if (Array.isArray(res.data.formats)) {
          setSupportedFormats(res.data.formats);
        }
      })
      .catch(() => {
        console.warn("Using default formats due to API error.");
      });
  }, []);

  /**
   * Main Conversion Logic (Async/WebSocket)
   * 1. POST file -> get task_id
   * 2. Connect WebSocket -> wait for SUCCESS
   * 3. Set download URL
   */
  const handleConvert = async (files, params) => {
    if (!files || files.length === 0) {
      setAppError("Please select image files to convert.");
      return;
    }

    setIsLoading(true);
    setAppError(null);
    setConvertedFiles([]);

    try {
      const results = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("params", JSON.stringify(params));

        // 第一步：上傳並取得任務 ID
        const res = await axios.post(`${API_BASE_URL}/convert/`, formData);
        const { task_id } = res.data;

        // 第二步：將 http 轉為 ws 協定連線 WebSocket
        const wsUrl = API_BASE_URL.replace(/^http/, "ws") + `/ws/${task_id}`;

        // 使用 Promise 包裝 WebSocket，確保順序執行
        const conversionPromise = new Promise((resolve, reject) => {
          const socket = new WebSocket(wsUrl);

          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // 監聽後端回傳的 SUCCESS 狀態
            if (data.status === "SUCCESS") {
              const downloadUrl = `${API_BASE_URL}/download/${data.filename}`;
              socket.close();
              resolve({
                url: downloadUrl,
                format: params.format,
                filename: data.filename,
              });
            } else if (data.status === "FAILURE") {
              socket.close();
              reject(new Error(data.error || "Worker failed"));
            }
          };

          socket.onerror = () =>
            reject(new Error("WebSocket connection error."));
        });

        const finishedFile = await conversionPromise;
        results.push(finishedFile);
      }

      setConvertedFiles(results);
    } catch (err) {
      console.error("Conversion error:", err);
      setAppError(err.response?.data?.detail || err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = (urls, files) => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAppError(null);
    setPreviewUrls(urls);
    setSelectedFiles(files);
    setConvertedFiles([]);
  };

  const handleClearAll = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setSelectedFiles([]);
    setConvertedFiles([]);
    setAppError(null);
    setFileSelectorKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-md border border-gray-100 p-10">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-50 rounded-lg transition-all duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
              <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-600 font-bold tracking-wide">
                Processing...
              </p>
              <p className="text-gray-400 text-xs mt-2">Please wait a moment</p>
            </div>
          </div>
        )}

        <h1 className="text-4xl font-semibold mb-10 text-center text-gray-800">
          Image Converter
        </h1>

        {appError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-md relative mb-6 flex items-start">
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

        <FileSelector
          key={fileSelectorKey}
          onFilesSelected={handleFilesSelected}
          previewUrls={previewUrls}
          onClear={handleClearAll}
        />

        <ConvertForm
          files={selectedFiles}
          onConvert={handleConvert}
          supportedFormats={supportedFormats}
        />

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
