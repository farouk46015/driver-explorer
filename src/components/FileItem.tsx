import { memo, useCallback } from 'react';
import { Star, Download, MoreVertical, Trash2, Edit } from 'lucide-react';
import FileIcon from './FileIcon';
import { formatDate, isImageFile, isPdfFile } from '@/utils';
import { useFileManager } from '@/context/FileManagerContext';
import type { DriveItem } from '@/types';

interface FileItemProps {
  file: DriveItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  isDragged: boolean;
  isDropTargetActive: boolean;
  onDragStart: (e: React.DragEvent, fileId: string) => void;
  onDragOver: (e: React.DragEvent, file: DriveItem) => void;
  onDragEnter: (e: React.DragEvent, file: DriveItem) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, file: DriveItem) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const FileItem = memo(
  ({
    file,
    viewMode,
    isSelected,
    isDragged,
    isDropTargetActive,
    onDragStart,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onDragEnd,
  }: FileItemProps) => {
    const { setCurrentPath, onFileSelection, selectedFilesId, handleFileAction } = useFileManager();

    const handleItemClick = useCallback(
      (e: React.MouseEvent) => {
        const isCtrKey = e.ctrlKey || e.metaKey;
        const isShiftKey = e.shiftKey;
        if (isCtrKey || isShiftKey || selectedFilesId.length > 0) {
          onFileSelection(file.id, isCtrKey, isShiftKey);
        } else if (file.type === 'folder' && file.path) {
          setCurrentPath([...file.path, file.name]);
        } else if (file.type === 'file' && isImageFile(file.ext)) {
          // setImagePreview({isOpen: true ,fileId: file.id})
        } else if (file.type === 'file' && isPdfFile(file.ext)) {
          // setPDFPreview({ isOpen: true , fileId: file.id })
        }
      },
      [file, selectedFilesId, onFileSelection, setCurrentPath]
    );

    const handleSelectionChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        e.preventDefault();
        const nativeEvent = e.nativeEvent as MouseEvent | KeyboardEvent;
        const isCtrKey = nativeEvent.ctrlKey || nativeEvent.metaKey;
        const isShiftKey = nativeEvent.shiftKey;
        onFileSelection(file.id, isCtrKey, isShiftKey);
      },
      [file.id, onFileSelection]
    );

    const handleAction = useCallback(
      (action: 'favorite' | 'delete' | 'rename' | 'download') => {
        if (handleFileAction) {
          void handleFileAction(file, action);
        }
      },
      [file, handleFileAction]
    );
    if (viewMode === 'list') {
      return (
        <div
          data-file-id={file.id}
          draggable
          onDragStart={(e) => {
            onDragStart(e, file.id);
          }}
          onDragOver={(e) => {
            onDragOver(e, file);
          }}
          onDragEnter={(e) => {
            onDragEnter(e, file);
          }}
          onDragLeave={onDragLeave}
          onDrop={(e) => {
            onDrop(e, file);
          }}
          onDragEnd={onDragEnd}
          className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          } ${isDragged ? 'opacity-50' : ''} ${
            isDropTargetActive ? 'bg-green-50 border-l-4 border-green-500 shadow-md' : ''
          }`}
          onClick={handleItemClick}
        >
          <div className="col-span-6 flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectionChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <FileIcon type={file.type} extension={file.type === 'file' ? file.ext : null} />
            <span className="text-sm font-medium text-gray-900 truncate flex items-center space-x-2">
              <span>{file.name}</span>
              {file.isFavorite ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : null}
            </span>
          </div>
          <div className="col-span-2 flex items-center">
            <span className="text-sm text-gray-600">{formatDate(file.modified)}</span>
          </div>
          <div className="col-span-2 flex items-center">
            <span className="text-sm text-gray-600">
              {file.type === 'folder' ? `${file.items.toString()} items` : file.size}
            </span>
          </div>
          <div className="col-span-2 flex items-center justify-end space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction('favorite');
              }}
              className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                file.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction('download');
              }}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div
        data-file-id={file.id}
        draggable
        onDragStart={(e) => {
          onDragStart(e, file.id);
        }}
        onDragOver={(e) => {
          onDragOver(e, file);
        }}
        onDragEnter={(e) => {
          onDragEnter(e, file);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          onDrop(e, file);
        }}
        onDragEnd={onDragEnd}
        className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${isDragged ? 'opacity-50' : ''} ${
          isDropTargetActive
            ? 'ring-2 ring-green-500 bg-green-50 shadow-lg transform scale-105'
            : ''
        }`}
        onClick={handleItemClick}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectionChange}
          className="absolute top-2 left-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 z-10"
        />

        {file.isFavorite ? (
          <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-500 fill-current" />
        ) : null}

        {isDropTargetActive ? (
          <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg bg-green-50 bg-opacity-50 flex items-center justify-center">
            <span className="text-green-600 font-medium text-sm">Drop here</span>
          </div>
        ) : null}

        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <FileIcon
              type={file.type}
              extension={file.type === 'file' ? file.ext : null}
              size="large"
            />
          </div>
          <h3 className="text-sm font-medium text-gray-900 truncate w-full mb-1">{file.name}</h3>
          <p className="text-xs text-gray-500">
            {file.type === 'folder' ? `${file.items.toString()} items` : file.size}
          </p>
        </div>

        <div className="flex justify-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('favorite');
            }}
            className={`p-1 transition-colors ${
              file.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('download');
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-red-600 hover:text-red-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('delete');
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('rename');
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

FileItem.displayName = 'FileItem';

export default FileItem;
