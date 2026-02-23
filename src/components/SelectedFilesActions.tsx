import { useFileManager } from '@/context/FileManagerContext';

export default function SelectedFilesActions() {
  const { selectedFilesId, setSelectedFilesId, handleBulkDelete, handleBulkDownload } =
    useFileManager();

  const handleClearSelection = () => {
    setSelectedFilesId([]);
  };

  return (
    <div>
      {/* Bulk Action Bar */}
      {selectedFilesId.length > 0 ? (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedFilesId.length} item
              {selectedFilesId.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDownload}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear selection
          </button>
        </div>
      ) : null}
    </div>
  );
}
