export default function ImagePreview({ previewUrls, internalFiles }) {
  if (previewUrls.length === 0 || internalFiles.length === 0) return null;

  return (
    <div className="mt-8 mb-6 flex flex-wrap justify-center gap-6">
      {previewUrls.map((url, idx) => (
        <div key={idx} className="w-32 flex flex-col items-center">
          <div className="w-32 h-32 flex items-center justify-center rounded-lg border border-gray-200 shadow-sm bg-white">
            {url === "UNSUPPORTED_HEIC" ? (
              <div className="relative group w-full h-full flex flex-col items-center justify-center text-sm text-gray-500 px-2 text-center">
                Cannot preview HEIC
                <div className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs rounded-md px-2 py-1 shadow-lg whitespace-nowrap z-10">
                  Browser does not support HEIC image preview
                </div>
              </div>
            ) : (
              <img
                src={url}
                alt={`預覽圖片 ${idx + 1}`}
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </div>

          <p
            className="text-sm text-gray-700 truncate mt-2 w-full text-center"
            title={internalFiles[idx]?.name}
          >
            {internalFiles[idx]?.name}
          </p>
        </div>
      ))}
    </div>
  );
}
