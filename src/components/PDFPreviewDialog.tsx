import { X } from 'lucide-react';

interface PDFPreviewDialogProps {
  isOpen: boolean;
  fileUrl: string | null;
  fileName: string;
  onClose: () => void;
}

export default function PDFPreviewDialog({
  isOpen,
  fileUrl,
  fileName,
  onClose,
}: PDFPreviewDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{fileName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {fileUrl ? (
            <iframe src={fileUrl} className="w-full h-full border-0" title={fileName} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading PDF...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
