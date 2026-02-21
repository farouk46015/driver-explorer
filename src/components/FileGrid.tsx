import React, { useState, useCallback, useMemo } from 'react';
import { Folder, Loader2 } from 'lucide-react';
import FileItem from './FileItem';
import { useFileManager } from '@/context/FileManagerContext';
import type { DriveItem } from '@/types';

export default function FileGrid() {
  const { items, loading, viewMode, selectedFilesId, handleBulkMove, handleFileDrop } =
    useFileManager();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Drag and drop functionality
  const handleDragStart = useCallback(
    (e: React.DragEvent, fileId: string) => {
      e.stopPropagation();
      if (selectedFilesId.includes(fileId)) {
        setDraggedItem(fileId);
        e.dataTransfer.setData('text/plain', JSON.stringify(selectedFilesId));
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ type: 'multiple', fileIds: selectedFilesId })
        );
      } else {
        setDraggedItem(fileId);
        e.dataTransfer.setData('text/plain', fileId);
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'single', fileId }));
      }
      e.dataTransfer.effectAllowed = 'move';

      setTimeout(() => {
        const draggedElement = document.querySelector(`[data-file-id="${fileId}"]`);
        if (draggedElement) {
          draggedElement.classList.add('opacity-50');
        }
      }, 0);
    },
    [selectedFilesId]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, item: DriveItem) => {
      if (item.type === 'folder' && draggedItem !== item.id && !selectedFilesId.includes(item.id)) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(item.id);
      }
    },
    [draggedItem, selectedFilesId]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent, item: DriveItem) => {
      if (item.type === 'folder' && draggedItem !== item.id && !selectedFilesId.includes(item.id)) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(item.id);
      }
    },
    [draggedItem, selectedFilesId]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (offsetX < 0 || offsetX > rect.width || offsetY < 0 || offsetY > rect.height) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetFile: DriveItem) => {
      e.preventDefault();
      e.stopPropagation();

      if (targetFile.type === 'folder') {
        const dragData = e.dataTransfer.getData('application/json');
        try {
          const parsedData = JSON.parse(dragData) as {
            type: string;
            fileId?: string;
            fileIds?: string[];
          };
          if (parsedData.type === 'multiple') {
            // Handle multiple file drop
            handleBulkMove([...targetFile.path, targetFile.name]);
          } else if (parsedData.type === 'single') {
            // Handle single file drop
            const draggedItemId = parsedData.fileId ?? '';
            if (draggedItemId && draggedItemId !== targetFile.id && handleFileDrop) {
              handleFileDrop(draggedItemId, [...targetFile.path, targetFile.name]);
            }
          }
        } catch (_error) {
          // Handle parsing error - fallback to plain text
          const draggedFileId = e.dataTransfer.getData('text/plain');
          if (draggedFileId && draggedFileId !== targetFile.id && handleFileDrop) {
            handleFileDrop(draggedFileId, [...targetFile.path, targetFile.name]);
          }
        }
      }
    },
    [handleBulkMove, handleFileDrop]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedItem(null);
    setDropTarget(null);

    // Remove opacity from dragged elements
    const draggedElements = document.querySelectorAll('[data-file-id]');
    draggedElements.forEach((el) => {
      el.classList.remove('opacity-50');
    });
  }, []);

  // Memoize selection set for O(1) lookup instead of O(n) array.includes
  const selectedFilesSet = useMemo(() => new Set(selectedFilesId), [selectedFilesId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-16 h-16 mb-4 animate-spin text-gray-300" />
        <p className="text-lg">Loading...</p>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Folder className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg">This folder is empty</p>
        <p className="text-sm">Upload files or create folders to get started</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 text-sm font-medium text-gray-700">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Modified</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2" />
        </div>
        <div className="divide-y divide-gray-200">
          {items.map((file) => {
            const isSelected = selectedFilesSet.has(file.id);
            const isDragged = selectedFilesSet.has(file.id) && draggedItem !== null;
            const isDropTargetActive = dropTarget === file.id && file.type === 'folder';

            return (
              <FileItem
                key={file.id}
                file={file}
                viewMode="list"
                isSelected={isSelected}
                isDragged={isDragged}
                isDropTargetActive={isDropTargetActive}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {items.map((file) => {
        const isSelected = selectedFilesSet.has(file.id);
        const isDragged = selectedFilesSet.has(file.id) && draggedItem !== null;
        const isDropTargetActive = dropTarget === file.id && file.type === 'folder';

        return (
          <FileItem
            key={file.id}
            file={file}
            viewMode="grid"
            isSelected={isSelected}
            isDragged={isDragged}
            isDropTargetActive={isDropTargetActive}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        );
      })}
    </div>
  );
}
