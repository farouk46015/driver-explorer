import BreadcrumbNav from '@/components/BreadcrumbNav';
import FileGrid from '@/components/FileGrid';
import FileUploadModal from '@/components/FileUpload';
import SelectedFilesActions from '@/components/SelectedFilesActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import UpdateDialog from '@/components/UpdateDialog';
import PDFPreviewDialog from '@/components/PDFPreviewDialog';
import ImagePreviewDialog from '@/components/ImagePreviewDialog';
import { useFileManager } from '@/context/FileManagerContext';

export default function HomePage() {
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
  } = useFileManager();

  return (
    <div>
      <BreadcrumbNav />
      <SelectedFilesActions />
      <FileGrid />
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
