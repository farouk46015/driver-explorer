import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { driveManager } from '@/db/driveManager';
// import { seedDatabase } from "@/db/seedData";
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

interface FileManagerContextType {
  items: DriveItem[];
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
  confirmDialog: ConfirmDialogState;
  closeConfirmDialog: () => void;
  renameDialog: RenameDialogState;
  closeRenameDialog: () => void;
  newFolderDialog: NewFolderDialogState;
  openNewFolderDialog: () => void;
  closeNewFolderDialog: () => void;
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

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // await seedDatabase();
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
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, searchQuery, sortBy]);

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
        alert(`Cannot upload to ${pathKey}. Please navigate to a folder first.`);
        return;
      }

      try {
        // Convert File objects to Blobs and upload to IndexedDB
        const uploadPromises = files.map(async (file) => {
          const blob = new Blob([file], { type: file.type });
          return await driveManager.files.create(file.name, blob, currentPath);
        });

        const fileIds = await Promise.all(uploadPromises);

        console.warn(`Successfully uploaded ${fileIds.length.toString()} files:`, fileIds);

        // Optional: Show success message
        alert(`Successfully uploaded ${fileIds.length.toString()} file(s)`);

        // Close the upload modal
        setShowFileUpload(false);
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload files. Please try again.');
      }
    },
    [currentPath]
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

            // Show custom confirmation dialog
            setConfirmDialog({
              isOpen: true,
              title: confirmTitle,
              message: confirmMessage,
              onConfirm: async () => {
                closeConfirmDialog();
                try {
                  await manager.delete(item.id);
                  void loadItems();
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
            // Show rename dialog
            setRenameDialog({
              isOpen: true,
              item,
              onConfirm: async (newValue) => {
                await manager.rename(item.id, newValue);
                await loadItems();
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
    [loadItems, closeConfirmDialog]
  );

  const openNewFolderDialog = useCallback(() => {
    setNewFolderDialog({
      isOpen: true,
      onConfirm: async (folderName: string) => {
        try {
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
      items,
      loading,
      confirmDialog,
      closeConfirmDialog,
      renameDialog,
      closeRenameDialog,
      newFolderDialog,
      openNewFolderDialog,
      closeNewFolderDialog,
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
      handleFileAction,
      items,
      loading,
      confirmDialog,
      closeConfirmDialog,
      renameDialog,
      closeRenameDialog,
      newFolderDialog,
      openNewFolderDialog,
      closeNewFolderDialog,
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
