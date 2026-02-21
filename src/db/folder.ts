import { db } from './indexedDb';
import { nanoid } from 'nanoid';
import JSZip from 'jszip';
import type { FolderItem, DriveItem, FileItem } from '@/types';

export class FolderManager {
  /**
   * Create a new folder
   */
  async create(name: string, path: string[] = []): Promise<string> {
    const id = nanoid();
    const now = new Date().toISOString();

    const folderItem: FolderItem = {
      id,
      name,
      type: 'folder',
      size: null,
      modified: now,
      items: 0,
      isFavorite: false,
      path,
      createdAt: now,
    };

    await db.folders.add(folderItem);
    return id;
  }

  /**
   * Get all folders
   */
  async getAll(): Promise<FolderItem[]> {
    return await db.folders.toArray();
  }

  /**
   * Get a folder by ID
   */
  async getById(id: string): Promise<FolderItem | undefined> {
    return await db.folders.get(id);
  }

  /**
   * Get folders by path
   */
  async getByPath(path: string[]): Promise<FolderItem[]> {
    const pathString = path.join('/');
    return await db.folders.filter((folder) => folder.path.join('/') === pathString).toArray();
  }

  /**
   * Get root folders (folders with empty path)
   */
  async getRootFolders(): Promise<FolderItem[]> {
    return await db.folders.filter((folder) => folder.path.length === 0).toArray();
  }

  /**
   * Update a folder
   */
  async update(id: string, updates: Partial<FolderItem>): Promise<void> {
    await db.folders.update(id, {
      ...updates,
      modified: new Date().toISOString(),
    });
  }

  /**
   * Delete a folder by ID
   */
  async delete(id: string): Promise<void> {
    await db.folders.delete(id);
  }

  /**
   * Delete folder and all its contents recursively
   */
  async deleteRecursive(id: string): Promise<void> {
    const folder = await this.getById(id);
    if (!folder) {
      return;
    }

    const folderPath = [...folder.path, folder.name].join('/');

    // Delete all child folders
    const childFolders = await db.folders
      .filter((f) => f.path.join('/').startsWith(folderPath))
      .toArray();

    for (const child of childFolders) {
      await db.folders.delete(child.id);
    }

    // Delete all files in this folder and subfolders
    const files = await db.files
      .filter((file) => file.path?.join('/')?.startsWith(folderPath) ?? false)
      .toArray();

    for (const file of files) {
      await db.files.delete(file.id);
    }

    // Delete the folder itself
    await this.delete(id);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<void> {
    const folder = await this.getById(id);
    if (folder) {
      await this.update(id, { isFavorite: !folder.isFavorite });
    }
  }

  /**
   * Get all favorite folders
   */
  async getFavorites(): Promise<FolderItem[]> {
    return await db.folders.filter((folder) => folder.isFavorite).toArray();
  }

  /**
   * Search folders by name
   */
  async search(query: string): Promise<FolderItem[]> {
    const lowerQuery = query.toLowerCase();
    return await db.folders
      .filter((folder) => folder.name.toLowerCase().includes(lowerQuery))
      .toArray();
  }

  /**
   * Move folder to a new path
   */
  async move(id: string, newPath: string[]): Promise<void> {
    const folder = await this.getById(id);
    if (!folder) {
      return;
    }

    const oldPath = [...folder.path, folder.name].join('/');
    const newFullPath = [...newPath, folder.name].join('/');

    // Update the folder's path
    await this.update(id, { path: newPath });

    // Update all child folders' paths
    const childFolders = await db.folders
      .filter((f) => f.path.join('/').startsWith(oldPath))
      .toArray();

    for (const child of childFolders) {
      const relativePath = child.path.join('/').substring(oldPath.length);
      const newChildPath = (newFullPath + relativePath).split('/').filter(Boolean);
      await db.folders.update(child.id, { path: newChildPath });
    }

    // Update all files' paths
    const files = await db.files
      .filter((file) => file.path?.join('/')?.startsWith(oldPath) ?? false)
      .toArray();

    for (const file of files) {
      const relativePath = file.path?.join('/').substring(oldPath.length) ?? '';
      const newFilePath = (newFullPath + relativePath).split('/').filter(Boolean);
      await db.files.update(file.id, { path: newFilePath });
    }
  }

  /**
   * Update item count for a folder
   */
  async updateItemCount(id: string): Promise<void> {
    const folder = await this.getById(id);
    if (!folder) {
      return;
    }

    const folderPath = [...folder.path, folder.name].join('/');

    const childFolders = await db.folders.filter((f) => f.path.join('/') === folderPath).count();

    const childFiles = await db.files.filter((file) => file.path?.join('/') === folderPath).count();

    await this.update(id, { items: childFolders + childFiles });
  }

  /**
   * Rename a folder
   */
  async rename(id: string, newName: string): Promise<void> {
    await this.update(id, { name: newName });
  }

  /**
   * Get a folder with its immediate children (files and folders)
   */
  async getWithChildren(id: string): Promise<FolderWithChildren | null> {
    const folder = await this.getById(id);
    if (!folder) {
      return null;
    }

    const folderPath = [...folder.path, folder.name].join('/');

    const childFolders = await db.folders.filter((f) => f.path.join('/') === folderPath).toArray();

    const childFiles = await db.files
      .filter((file) => file.path?.join('/') === folderPath)
      .toArray();

    const children: DriveItem[] = [...childFolders, ...childFiles];

    return {
      ...folder,
      children,
    };
  }

  /**
   * Get children (files and folders) by path
   */
  async getChildrenByPath(path: string[]): Promise<DriveItem[]> {
    const pathString = path.join('/');

    const childFolders = await db.folders
      .filter((folder) => folder.path.join('/') === pathString)
      .toArray();

    const childFiles = await db.files
      .filter((file) => file.path?.join('/') === pathString)
      .toArray();

    return [...childFolders, ...childFiles];
  }

  /**
   * Build a complete folder tree starting from root folders
   */
  async buildTree(): Promise<FolderTreeNode[]> {
    const allFolders = await this.getAll();
    const allFiles = await db.files.toArray();

    const folderMap = new Map<string, FolderTreeNode>();

    allFolders.forEach((folder) => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        files: [],
      });
    });

    const rootFolders: FolderTreeNode[] = [];

    allFolders.forEach((folder) => {
      const node = folderMap.get(folder.id);
      if (!node) {
        return;
      }

      if (folder.path.length === 0) {
        rootFolders.push(node);
      } else {
        const parentPath = folder.path.join('/');
        const parentFolder = allFolders.find((f) => [...f.path, f.name].join('/') === parentPath);

        if (parentFolder) {
          const parentNode = folderMap.get(parentFolder.id);

          if (parentNode) {
            parentNode.children = parentNode.children ?? [];
            parentNode.children.push(node);
          }
        }
      }
    });

    allFiles.forEach((file) => {
      if (!file.path || file.path.length === 0) {
        return;
      }

      const filePath = file.path.join('/');
      const parentFolder = allFolders.find((f) => [...f.path, f.name].join('/') === filePath);

      if (parentFolder) {
        const parentNode = folderMap.get(parentFolder.id);
        if (parentNode) {
          parentNode.files.push(file);
        }
      }
    });

    return rootFolders;
  }

  /**
   * Get folder statistics (total files, total size, etc.)
   */
  async getStats(id: string): Promise<FolderStats | null> {
    const folder = await this.getById(id);
    if (!folder) {
      return null;
    }

    const folderPath = [...folder.path, folder.name].join('/');

    const allDescendantFiles = await db.files
      .filter((file) => file.path?.join('/')?.startsWith(folderPath) ?? false)
      .toArray();

    const totalSize = allDescendantFiles.reduce((sum, file) => {
      return sum + (parseInt(file.size) || 0);
    }, 0);

    const fileCount = allDescendantFiles.length;

    const subfolderCount = await db.folders
      .filter((f) => f.path.join('/').startsWith(folderPath))
      .count();

    return {
      fileCount,
      subfolderCount,
      totalSize,
    };
  }

  /**
   * Download folder as ZIP file with all contents
   */
  async download(id: string): Promise<void> {
    const folder = await this.getById(id);
    if (!folder) {
      throw new Error('Folder not found');
    }

    const zip = new JSZip();
    const folderPath = [...folder.path, folder.name].join('/');

    // Get all files in this folder and subfolders
    const allFiles = await db.files
      .filter((file) => file.path?.join('/')?.startsWith(folderPath) ?? false)
      .toArray();

    // Get all subfolders
    const allSubfolders = await db.folders
      .filter((f) => f.path.join('/').startsWith(folderPath))
      .toArray();

    // Add all files to the ZIP
    for (const file of allFiles) {
      if (file.blob) {
        // Calculate relative path from the folder being downloaded
        const relativePath = file.path?.join('/').substring(folderPath.length + 1) ?? '';
        const fullPath = relativePath ? `${relativePath}/${file.name}` : file.name;

        zip.file(fullPath, file.blob);
      }
    }

    // Create empty folders in the ZIP for subfolders that don't have files
    for (const subfolder of allSubfolders) {
      const subfolderFullPath = [...subfolder.path, subfolder.name].join('/');
      const relativePath = subfolderFullPath.substring(folderPath.length + 1);

      // Check if this folder has any files
      const hasFiles = allFiles.some((file) => file.path?.join('/') === subfolderFullPath);

      // If no files, create an empty folder entry
      if (!hasFiles && relativePath) {
        zip.folder(relativePath);
      }
    }

    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folder.name}.zip`;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
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

// Export singleton instance
export const folderManager = new FolderManager();
