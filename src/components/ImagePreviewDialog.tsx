import { X } from 'lucide-react';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  fileUrl: string | null;
  fileName: string;
  onClose: () => void;
}

export default function ImagePreviewDialog({
  isOpen,
  fileUrl,
  fileName,
  onClose,
}: ImagePreviewDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">{fileName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          {fileUrl ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white">Loading image...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
