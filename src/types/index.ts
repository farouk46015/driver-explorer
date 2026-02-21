export interface FileItem {
  id: string;
  name: string;
  type: 'file';
  size: string;
  modified: string;
  ext: string;
  isFavorite: boolean;
  path?: string[];
  blob?: Blob;
  createdAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  size: null;
  modified: string;
  items: number;
  isFavorite: boolean;
  path: string[];
  createdAt: string;
}

export type DriveItem = FileItem | FolderItem;

export interface DriveItemsMap {
  [path: string]: DriveItem[];
}

export interface FolderWithChildren extends FolderItem {
  children: DriveItem[];
}

export interface FolderTreeNode extends FolderItem {
  children: FolderTreeNode[];
  files: FileItem[];
}

export interface FolderStats {
  fileCount: number;
  subfolderCount: number;
  totalSize: number;
}

export interface StorageStats {
  totalSize: number;
  fileCount: number;
  folderCount: number;
  totalItems: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}
