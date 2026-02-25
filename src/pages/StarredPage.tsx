import { useEffect, useState, useMemo } from 'react';
import FileUploadModal from '@/components/FileUpload';
import SelectedFilesActions from '@/components/SelectedFilesActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import UpdateDialog from '@/components/UpdateDialog';
import PDFPreviewDialog from '@/components/PDFPreviewDialog';
import ImagePreviewDialog from '@/components/ImagePreviewDialog';
import FileItem from '@/components/FileItem';
import Pagination from '@/components/Pagination';
import { useFileManager } from '@/context/FileManagerContext';
import { driveManager } from '@/db/driveManager';
import type { DriveItem } from '@/types';

export default function StarredPage() {
  const {
    confirmDialog,
    closeConfirmDialog,
    renameDialog,
    closeRenameDialog,
    newFolderDialog,
    closeNewFolderDialog,
    pdfPreviewDialog,
    closePDFPreview,
    imagePreviewDialog,
    closeImagePreview,
    viewMode,
    selectedFilesId,
    items,
  } = useFileManager();

  const [starredItems, setStarredItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate paginated items
  const paginatedStarredItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return starredItems.slice(startIndex, endIndex);
  }, [starredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [starredItems]);

  // Load all starred/favorite files and folders - refresh when items change
  useEffect(() => {
    const loadStarredItems = async () => {
      try {
        setLoading(true);
        const items = await driveManager.getFavorites();
        setStarredItems(items);
      } catch (error) {
        console.error('Error loading starred items:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadStarredItems();
  }, [items]);

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Starred</h1>
        <p className="text-sm text-gray-600 mt-1">Your favorite files and folders</p>
      </div>
      <SelectedFilesActions />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading starred items...</p>
        </div>
      ) : starredItems.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No starred items yet</p>
            <p className="text-sm text-gray-400">
              Click the star icon on files or folders to add them here
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 pb-24">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedStarredItems.map((item) => (
                <FileItem
                  key={item.id}
                  file={item}
                  viewMode="grid"
                  isSelected={selectedFilesId.includes(item.id)}
                  isDragged={false}
                  isDropTargetActive={false}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnter={() => {}}
                  onDragLeave={() => {}}
                  onDrop={() => {}}
                  onDragEnd={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Actions</div>
              </div>
              {paginatedStarredItems.map((item) => (
                <FileItem
                  key={item.id}
                  file={item}
                  viewMode="list"
                  isSelected={selectedFilesId.includes(item.id)}
                  isDragged={false}
                  isDropTargetActive={false}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnter={() => {}}
                  onDragLeave={() => {}}
                  onDrop={() => {}}
                  onDragEnd={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination
        totalItems={starredItems.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <FileUploadModal />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        type="danger"
      />
      <UpdateDialog
        isOpen={renameDialog.isOpen}
        title={renameDialog.item?.type === 'folder' ? 'Rename Folder' : 'Rename File'}
        currentValue={renameDialog.item?.name ?? ''}
        placeholder="Enter new name"
        confirmText="Rename"
        cancelText="Cancel"
        onConfirm={async (newName: string) => {
          await renameDialog.onConfirm(newName);
          closeRenameDialog();
        }}
        onCancel={closeRenameDialog}
      />
      <UpdateDialog
        isOpen={newFolderDialog.isOpen}
        title="Create New Folder"
        currentValue=""
        placeholder="Enter folder name"
        confirmText="Create"
        cancelText="Cancel"
        onConfirm={async (folderName: string) => {
          await newFolderDialog.onConfirm(folderName);
        }}
        onCancel={closeNewFolderDialog}
      />
      <PDFPreviewDialog
        isOpen={pdfPreviewDialog.isOpen}
        fileUrl={pdfPreviewDialog.fileUrl}
        fileName={pdfPreviewDialog.fileName}
        onClose={closePDFPreview}
      />
      <ImagePreviewDialog
        isOpen={imagePreviewDialog.isOpen}
        fileUrl={imagePreviewDialog.fileUrl}
        fileName={imagePreviewDialog.fileName}
        onClose={closeImagePreview}
      />
    </div>
  );
}
