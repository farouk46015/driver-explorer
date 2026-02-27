import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { driveManager } from '@/db/driveManager';
import { initializeDb } from '@/db/indexedDb';
import { slugify } from '@/utils';
import type { DriveItem } from '@/types';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface RenameDialogState {
  isOpen: boolean;
  item: DriveItem | null;
  onConfirm: (newValue: string) => Promise<void>;
}

interface StoreStatus {
  totalSize: number;
  fileCount: number;
  folderCount: number;
  totalItems: number;
}

interface NewFolderDialogState {
  isOpen: boolean;
  onConfirm: (folderName: string) => Promise<void>;
}

interface PDFPreviewDialogState {
  isOpen: boolean;
  fileUrl: string | null;
  fileName: string;
}

interface ImagePreviewDialogState {
  isOpen: boolean;
  fileUrl: string | null;
  fileName: string;
}

interface FileManagerContextType {
  items: DriveItem[];
  paginatedItems: DriveItem[];
  loading: boolean;
  currentPath: string[];
  setCurrentPath: (path: string[]) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'name' | 'modified' | 'size' | 'type';
  setSortBy: (sort: 'name' | 'modified' | 'size' | 'type') => void;
  showFileUpload: boolean;
  setShowFileUpload: (show: boolean) => void;
  handleFileUpload: (files: File[]) => Promise<void>;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  selectedFilesId: string[];
  onFileSelection: (fileId: string, isCtrKey: boolean, isShiftKey: boolean) => void;
  setSelectedFilesId: (ids: string[]) => void;
  handleBulkMove: (targetPath: string[]) => void;
  handleFileDrop: (draggedFileId: string, targetPath: string[]) => void;
  handleFileAction?: (
    item: DriveItem,
    action: 'favorite' | 'delete' | 'rename' | 'download',
    payload?: { newName?: string }
  ) => Promise<void>;
  handleBulkDelete: () => void;
  handleBulkDownload: () => Promise<void>;
  confirmDialog: ConfirmDialogState;
  closeConfirmDialog: () => void;
  renameDialog: RenameDialogState;
  closeRenameDialog: () => void;
  newFolderDialog: NewFolderDialogState;
  openNewFolderDialog: () => void;
  closeNewFolderDialog: () => void;
  pdfPreviewDialog: PDFPreviewDialogState;
  openPDFPreview: (fileId: string) => Promise<void>;
  closePDFPreview: () => void;
  imagePreviewDialog: ImagePreviewDialogState;
  openImagePreview: (fileId: string) => Promise<void>;
  closeImagePreview: () => void;
  storeStatus: StoreStatus;
}

export const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined);

function FileManagerContextProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState(['My Drive']);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFilesId, setSelectedFilesId] = useState<string[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [storeStatus, setStoreStatus] = useState<StoreStatus>({
    totalSize: 0,
    fileCount: 0,
    folderCount: 0,
    totalItems: 0,
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    isOpen: false,
    item: null,
    onConfirm: async () => {},
  });
  const [newFolderDialog, setNewFolderDialog] = useState<NewFolderDialogState>({
    isOpen: false,
    onConfirm: async () => {},
  });
  const [pdfPreviewDialog, setPdfPreviewDialog] = useState<PDFPreviewDialogState>({
    isOpen: false,
    fileUrl: null,
    fileName: '',
  });
  const [imagePreviewDialog, setImagePreviewDialog] = useState<ImagePreviewDialogState>({
    isOpen: false,
    fileUrl: null,
    fileName: '',
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // Initialize fingerprint-based database
        await initializeDb();
        console.log('Database initialized with fingerprint');
        setDbInitialized(true);

        await loadItems();
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    void initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dbInitialized) {
      void loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, searchQuery, sortBy, dbInitialized]);

  const loadItems = useCallback(async () => {
    try {
      const pathItems = await driveManager.getItemsByPath(currentPath);
      const storageStats = await driveManager.getStorageStats();
      setStoreStatus(storageStats);
      if (searchQuery || sortBy) {
        const filteredItem = pathItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sortBy === 'modified') {
          filteredItem.sort(
            (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
          );
        } else if (sortBy === 'size') {
          filteredItem.sort((a, b) => {
            const sizeA = a.type === 'file' ? parseInt(a.size) || 0 : 0;
            const sizeB = b.type === 'file' ? parseInt(b.size) || 0 : 0;
            return sizeB - sizeA;
          });
        } else if (sortBy === 'type') {
          filteredItem.sort((a, b) => a.type.localeCompare(b.type));
        } else if (sortBy === 'name') {
          filteredItem.sort((a, b) => a.name.localeCompare(b.name));
        }
        setItems(filteredItem);
      } else {
        setItems(pathItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }, [currentPath, searchQuery, sortBy]);

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      // Files to upload

      const pathKey = currentPath.join('/');

      // Don't allow upload to special directories
      if (
        pathKey === 'Starred' ||
        pathKey === 'Recent' ||
        pathKey === 'Trash' ||
        pathKey === 'Shared with me'
      ) {
        toast.error(`Cannot upload to ${pathKey}. Please navigate to a folder first.`);
        return;
      }

      try {
        const uploadPromises = files.map(async (file) => {
          return await driveManager.files.create(file.name, file, currentPath);
        });

        const fileIds = await Promise.all(uploadPromises);

        console.warn(`Successfully uploaded ${fileIds.length.toString()} files:`, fileIds);

        if (currentPath.length > 0) {
          const parentFolderName = currentPath[currentPath.length - 1];
          const parentFolderPath = currentPath.slice(0, -1);
          const parentFolders = await driveManager.folders.getByPath(parentFolderPath);
          const parentFolder = parentFolders.find((f) => f.name === parentFolderName);

          if (parentFolder) {
            await driveManager.folders.update(parentFolder.id, {
              items: parentFolder.items + fileIds.length,
            });
          }
        }

        await loadItems();

        toast.success(`Successfully uploaded ${fileIds.length.toString()} file(s)`);

        // Close the upload modal
        setShowFileUpload(false);
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload files. Please try again.');
      }
    },
    [currentPath, loadItems]
  );

  const handleFileDrop = useCallback(
    async (draggedFileId: string, targetPath: string[]) => {
      if (targetPath?.[0] === 'Starred') {
        return;
      }
      const file = items.find((item) => item.id === draggedFileId);
      if (file) {
        await driveManager.moveItem(draggedFileId, file.type, targetPath);
        await loadItems();
      }
    },
    [items, loadItems]
  );

  const handleBulkMove = useCallback(
    (targetPath: string[]) => {
      if (
        !targetPath ||
        targetPath[0] === 'Starred' ||
        targetPath[0] === 'Recent' ||
        targetPath[0] === 'Shared with me'
      ) {
        alert('Cannot move to special directories');
        return;
      }
      selectedFilesId.forEach((id) => {
        void handleFileDrop(id, targetPath);
      });
      setSelectedFilesId([]);
    },
    [selectedFilesId, handleFileDrop]
  );

  const onFileSelection = useCallback(
    (fileId: string, isCtrKey: boolean, isShiftKey: boolean) => {
      setSelectedFilesId((prev) => {
        if (isCtrKey) {
          setLastSelectedId(fileId);
          return prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId];
        } else if (isShiftKey && lastSelectedId) {
          const lastIndex = items.findIndex((item) => item.id === lastSelectedId);
          const currentIndex = items.findIndex((item) => item.id === fileId);

          if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            const rangeIds = items.slice(start, end + 1).map((item) => item.id);

            const newSelection = [...new Set([...prev, ...rangeIds])];
            return newSelection;
          }
        }
        setLastSelectedId(fileId);
        return [fileId];
      });
    },
    [lastSelectedId, items]
  );

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
    });
  }, []);

  const closeRenameDialog = useCallback(() => {
    setRenameDialog({
      isOpen: false,
      item: null,
      onConfirm: async () => {},
    });
  }, []);

  const handleFileAction = useCallback(
    async (item: DriveItem, action: 'favorite' | 'delete' | 'rename' | 'download') => {
      try {
        const manager = item.type === 'folder' ? driveManager.folders : driveManager.files;

        switch (action) {
          case 'delete': {
            const confirmMessage =
              item.type === 'folder'
                ? `Are you sure you want to delete the folder "${item.name}" and all its contents? This action cannot be undone.`
                : `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;

            const confirmTitle = item.type === 'folder' ? 'Delete Folder' : 'Delete File';

            setConfirmDialog({
              isOpen: true,
              title: confirmTitle,
              message: confirmMessage,
              onConfirm: async () => {
                closeConfirmDialog();
                try {
                  await driveManager.deleteItem(item.id, item.type);
                  await loadItems();

                  const newTotalItems = items.length - 1;
                  const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);

                  if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                  }
                } catch (error) {
                  console.error(`Error deleting ${item.type}:`, error);
                  throw error;
                }
              },
            });
            return;
          }

          case 'favorite':
            await manager.update(item.id, { isFavorite: !item.isFavorite });
            await loadItems();
            break;

          case 'rename': {
            setRenameDialog({
              isOpen: true,
              item,
              onConfirm: async (newValue) => {
                if (!newValue.trim()) {
                  toast.error('Name cannot be empty');
                  return;
                }

                const itemsInCurrentPath = await driveManager.getItemsByPath(item.path ?? []);

                let nameToCheck = newValue;
                if (item.type === 'file' && item.ext) {
                  if (!newValue.endsWith(`.${item.ext}`)) {
                    nameToCheck = `${newValue}.${item.ext}`;
                  }
                }

                const newSlug = slugify(nameToCheck);
                const duplicateExists = itemsInCurrentPath.some(
                  (existingItem) => existingItem.id !== item.id && existingItem.slug === newSlug
                );

                if (duplicateExists) {
                  toast.error(
                    `A ${item.type === 'file' ? 'file' : 'folder'} with a similar name already exists in this location. Please choose a different name.`
                  );
                  return;
                }

                await manager.rename(item.id, nameToCheck);
                await loadItems();
                closeRenameDialog();
              },
            });
            return;
          }

          case 'download':
            await manager.download(item.id);
            return;

          default:
            console.warn(`Unknown action: ${String(action)}`);
            return;
        }

        await loadItems();
      } catch (error) {
        console.error(`Error performing ${action} on ${item.type}:`, error);
        throw error;
      }
    },
    [loadItems, closeConfirmDialog, closeRenameDialog, currentPage, items.length, itemsPerPage]
  );

  const openNewFolderDialog = useCallback(() => {
    setNewFolderDialog({
      isOpen: true,
      onConfirm: async (folderName: string) => {
        try {
          if (!folderName.trim()) {
            toast.error('Folder name cannot be empty');
            return;
          }

          const itemsInCurrentPath = await driveManager.getItemsByPath(currentPath);
          const newSlug = slugify(folderName.trim());
          const duplicateExists = itemsInCurrentPath.some(
            (existingItem) => existingItem.slug === newSlug
          );

          if (duplicateExists) {
            toast.error(
              `A file or folder with a similar name already exists in this location. Please choose a different name.`
            );
            return;
          }

          await driveManager.folders.create(folderName, currentPath);
          await loadItems();
          setNewFolderDialog({
            isOpen: false,
            onConfirm: async () => {},
          });
        } catch (error) {
          console.error('Error creating folder:', error);
          throw error;
        }
      },
    });
  }, [currentPath, loadItems]);

  const closeNewFolderDialog = useCallback(() => {
    setNewFolderDialog({
      isOpen: false,
      onConfirm: async () => {},
    });
  }, []);

  const openPDFPreview = useCallback(async (fileId: string) => {
    try {
      const file = await driveManager.files.getById(fileId);

      if (!file) {
        toast.error('File not found');
        return;
      }

      if (!file.blob) {
        toast.error('This file has no content. Please upload a real PDF file to preview.');
        return;
      }

      if (!(file.blob instanceof Blob)) {
        console.error('blob is not a Blob instance, it is:', typeof file.blob, file.blob);
        toast.error('File data is corrupted. The blob is not a valid Blob object.');
        return;
      }

      if (file.blob.size === 0) {
        toast.error('This file is empty. Please upload a real PDF file to preview.');
        return;
      }

      const url = URL.createObjectURL(file.blob);
      setPdfPreviewDialog({
        isOpen: true,
        fileUrl: url,
        fileName: file.name,
      });
    } catch (error) {
      console.error('Error opening PDF preview:', error);
      toast.error('Failed to open PDF preview. Please try again.');
    }
  }, []);

  const closePDFPreview = useCallback(() => {
    if (pdfPreviewDialog.fileUrl) {
      URL.revokeObjectURL(pdfPreviewDialog.fileUrl);
    }
    setPdfPreviewDialog({
      isOpen: false,
      fileUrl: null,
      fileName: '',
    });
  }, [pdfPreviewDialog.fileUrl]);

  const openImagePreview = useCallback(async (fileId: string) => {
    try {
      const file = await driveManager.files.getById(fileId);

      if (!file) {
        toast.error('File not found');
        return;
      }

      if (!file.blob) {
        toast.error('This file has no content. Please upload a real image file to preview.');
        return;
      }

      if (!(file.blob instanceof Blob)) {
        console.error('blob is not a Blob instance, it is:', typeof file.blob, file.blob);
        toast.error('File data is corrupted. The blob is not a valid Blob object.');
        return;
      }

      if (file.blob.size === 0) {
        toast.error('This file is empty. Please upload a real image file to preview.');
        return;
      }

      const url = URL.createObjectURL(file.blob);
      setImagePreviewDialog({
        isOpen: true,
        fileUrl: url,
        fileName: file.name,
      });
    } catch (error) {
      console.error('Error opening image preview:', error);
      toast.error('Failed to open image preview. Please try again.');
    }
  }, []);

  const closeImagePreview = useCallback(() => {
    if (imagePreviewDialog.fileUrl) {
      URL.revokeObjectURL(imagePreviewDialog.fileUrl);
    }
    setImagePreviewDialog({
      isOpen: false,
      fileUrl: null,
      fileName: '',
    });
  }, [imagePreviewDialog.fileUrl]);

  const handleBulkDelete = useCallback(() => {
    if (selectedFilesId.length === 0) {
      return;
    }

    const itemCount = selectedFilesId.length;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Items',
      message: `Are you sure you want to delete ${itemCount.toString()} item${itemCount > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: async () => {
        closeConfirmDialog();
        try {
          const itemsToDelete = selectedFilesId
            .map((id) => items.find((i) => i.id === id))
            .filter((item): item is DriveItem => item !== undefined);

          // Delete all items (files and folders)
          const deletePromises = itemsToDelete.map(async (item) => {
            if (item.type === 'file') {
              await driveManager.files.delete(item.id);
            } else {
              await driveManager.folders.deleteRecursive(item.id);
            }
          });

          await Promise.all(deletePromises);

          if (currentPath.length > 0) {
            const parentFolderName = currentPath[currentPath.length - 1];
            const parentFolderPath = currentPath.slice(0, -1);
            const parentFolders = await driveManager.folders.getByPath(parentFolderPath);
            const parentFolder = parentFolders.find((f) => f.name === parentFolderName);

            if (parentFolder && parentFolder.items >= itemsToDelete.length) {
              await driveManager.folders.update(parentFolder.id, {
                items: parentFolder.items - itemsToDelete.length,
              });
            }
          }

          await loadItems();
          setSelectedFilesId([]);

          const newTotalItems = items.length - itemCount;
          const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);

          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          }

          toast.success(
            `Successfully deleted ${itemCount.toString()} item${itemCount > 1 ? 's' : ''}`
          );
        } catch (error) {
          console.error('Error during bulk delete:', error);
          toast.error('Failed to delete some items. Please try again.');
        }
      },
    });
  }, [
    selectedFilesId,
    items,
    closeConfirmDialog,
    loadItems,
    currentPage,
    itemsPerPage,
    currentPath,
  ]);

  const handleBulkDownload = useCallback(async () => {
    if (selectedFilesId.length === 0) {
      return;
    }

    try {
      const downloadPromises = selectedFilesId.map(async (id) => {
        const item = items.find((i) => i.id === id);
        if (item?.type === 'file') {
          await driveManager.files.download(id);
        }
      });

      await Promise.all(downloadPromises);

      const fileCount = selectedFilesId.filter((id) => {
        const item = items.find((i) => i.id === id);
        return item?.type === 'file';
      }).length;

      if (fileCount > 0) {
        toast.success(
          `Successfully downloaded ${fileCount.toString()} file${fileCount > 1 ? 's' : ''}`
        );
      } else {
        toast('No files selected. Folders cannot be downloaded.', {
          icon: 'ℹ️',
        });
      }
    } catch (error) {
      console.error('Error during bulk download:', error);
      toast.error('Failed to download some files. Please try again.');
    }
  }, [selectedFilesId, items]);

  const totalPages = useMemo(
    () => Math.ceil(items.length / itemsPerPage),
    [items.length, itemsPerPage]
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentPath, searchQuery, sortBy]);

  const values = useMemo(
    () => ({
      currentPath,
      setCurrentPath,
      viewMode,
      setViewMode,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      showFileUpload,
      setShowFileUpload,
      handleFileUpload,
      selectedFilesId,
      setSelectedFilesId,
      onFileSelection,
      handleBulkMove,
      handleFileDrop,
      handleFileAction,
      handleBulkDelete,
      handleBulkDownload,
      items,
      paginatedItems,
      loading,
      itemsPerPage,
      setItemsPerPage,
      currentPage,
      setCurrentPage,
      totalPages,
      confirmDialog,
      closeConfirmDialog,
      renameDialog,
      closeRenameDialog,
      newFolderDialog,
      openNewFolderDialog,
      closeNewFolderDialog,
      pdfPreviewDialog,
      openPDFPreview,
      closePDFPreview,
      imagePreviewDialog,
      openImagePreview,
      closeImagePreview,
      storeStatus,
    }),
    [
      currentPath,
      viewMode,
      searchQuery,
      sortBy,
      showFileUpload,
      handleFileUpload,
      selectedFilesId,
      setSelectedFilesId,
      onFileSelection,
      handleBulkMove,
      handleFileDrop,
      handleBulkDelete,
      handleBulkDownload,
      handleFileAction,
      items,
      paginatedItems,
      loading,
      itemsPerPage,
      setItemsPerPage,
      currentPage,
      setCurrentPage,
      totalPages,
      confirmDialog,
      closeConfirmDialog,
      renameDialog,
      closeRenameDialog,
      newFolderDialog,
      openNewFolderDialog,
      closeNewFolderDialog,
      pdfPreviewDialog,
      openPDFPreview,
      closePDFPreview,
      imagePreviewDialog,
      openImagePreview,
      closeImagePreview,
      storeStatus,
    ]
  );
  return <FileManagerContext.Provider value={values}>{children}</FileManagerContext.Provider>;
}

export default FileManagerContextProvider;

const useFileManager = () => {
  const context = useContext(FileManagerContext);
  if (context === undefined) {
    throw new Error('useFileManager must be used within a FileManagerContextProvider');
  }
  return context;
};

export { useFileManager };
