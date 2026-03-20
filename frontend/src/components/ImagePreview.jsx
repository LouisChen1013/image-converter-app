import { Fragment } from "react";

export default function ImagePreview({ previewUrls, internalFiles }) {
  if (previewUrls.length === 0 || internalFiles.length === 0) return null;

  return (
    <Fragment>
      {previewUrls.map((url, idx) => (
        <div key={idx} className="w-32 flex flex-col items-center">
          <div className="w-32 h-32 flex items-center justify-center rounded-lg border border-gray-200 shadow-sm bg-white overflow-hidden">
            {url === "UNSUPPORTED_HEIC" ? (
              <div className="relative group w-full h-full flex flex-col items-center justify-center text-[10px] text-gray-400 px-2 text-center bg-gray-50">
                <span className="text-2xl mb-1">📄</span>
                HEIC Preview Not Supported
              </div>
            ) : (
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <p
            className="text-xs text-gray-500 truncate mt-2 w-full text-center px-1"
            title={internalFiles[idx]?.name}
          >
            {internalFiles[idx]?.name}
          </p>
        </div>
      ))}
    </Fragment>
  );
}
