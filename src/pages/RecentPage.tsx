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

export default function RecentPage() {
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

  const [recentItems, setRecentItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate paginated items
  const paginatedRecentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return recentItems.slice(startIndex, endIndex);
  }, [recentItems, currentPage, itemsPerPage]);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [recentItems]);

  // Load all recent files and folders - refresh when items change
  useEffect(() => {
    const loadRecentItems = async () => {
      try {
        setLoading(true);
        const items = await driveManager.getAllRecent();
        setRecentItems(items);
      } catch (error) {
        console.error('Error loading recent items:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadRecentItems();
  }, [items]);

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Recent</h1>
        <p className="text-sm text-gray-600 mt-1">
          Files and folders sorted by most recent activity
        </p>
      </div>
      <SelectedFilesActions />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading recent items...</p>
        </div>
      ) : recentItems.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No items found</p>
        </div>
      ) : (
        <div className="p-6 pb-24">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedRecentItems.map((item) => (
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
              {paginatedRecentItems.map((item) => (
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
        totalItems={recentItems.length}
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
