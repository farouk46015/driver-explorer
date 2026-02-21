import { fileManager } from './file';
import { folderManager } from './folder';
import type { DriveItem } from '@/types';

/**
 * Unified DriveManager class that combines file and folder operations
 * Provides high-level operations that work across both files and folders
 */
export class DriveManager {
  public files = fileManager;
  public folders = folderManager;

  /**
   * Get all items (files and folders) at a specific path
   */
  async getItemsByPath(path: string[]): Promise<DriveItem[]> {
    return await this.folders.getChildrenByPath(path);
  }

  /**
   * Search both files and folders by name
   */
  async search(query: string): Promise<DriveItem[]> {
    const [folders, files] = await Promise.all([
      this.folders.search(query),
      this.files.search(query),
    ]);

    return [...folders, ...files];
  }

  /**
   * Get all favorite items (files and folders)
   */
  async getFavorites(): Promise<DriveItem[]> {
    const [folders, files] = await Promise.all([
      this.folders.getFavorites(),
      this.files.getFavorites(),
    ]);

    return [...folders, ...files];
  }

  /**
   * Toggle favorite for any item (file or folder)
   */
  async toggleFavorite(id: string, type: 'file' | 'folder'): Promise<void> {
    if (type === 'file') {
      await this.files.toggleFavorite(id);
    } else {
      await this.folders.toggleFavorite(id);
    }
  }

  /**
   * Delete any item (file or folder)
   */
  async deleteItem(id: string, type: 'file' | 'folder'): Promise<void> {
    if (type === 'file') {
      await this.files.delete(id);
    } else {
      await this.folders.delete(id);
    }
  }

  /**
   * Move any item to a new path
   */
  async moveItem(id: string, type: 'file' | 'folder', newPath: string[]): Promise<void> {
    const item = type === 'file' ? await this.files.getById(id) : await this.folders.getById(id);

    if (!item) {
      throw new Error('Item not found');
    }

    const oldPath = item.path;

    if (type === 'file') {
      await this.files.move(id, newPath);
    } else {
      await this.folders.move(id, newPath);
    }

    if (oldPath && oldPath.length > 0) {
      const sourceFolderName = oldPath[oldPath.length - 1];
      const sourceFolderPath = oldPath.slice(0, -1);
      const sourceFolders = await this.folders.getByPath(sourceFolderPath);
      const sourceFolder = sourceFolders.find((f) => f.name === sourceFolderName);

      if (sourceFolder && sourceFolder.items > 0) {
        await this.folders.update(sourceFolder.id, {
          items: sourceFolder.items - 1,
        });
      }
    }
    if (newPath.length > 0) {
      const destFolderName = newPath[newPath.length - 1];
      const destFolderPath = newPath.slice(0, -1);
      const destFolders = await this.folders.getByPath(destFolderPath);
      const destFolder = destFolders.find((f) => f.name === destFolderName);

      if (destFolder) {
        await this.folders.update(destFolder.id, {
          items: destFolder.items + 1,
        });
      }
    }
  }

  /**
   * Get total storage statistics
   */
  async getStorageStats() {
    const [totalSize, fileCount, folderCount] = await Promise.all([
      this.files.getTotalSize(),
      this.files.getAll().then((files) => files.length),
      this.folders.getAll().then((folders) => folders.length),
    ]);

    return {
      totalSize,
      fileCount,
      folderCount,
      totalItems: fileCount + folderCount,
    };
  }

  /**
   * Build complete folder tree with all files
   */
  async buildTree() {
    return await this.folders.buildTree();
  }
}

// Export singleton instance
export const driveManager = new DriveManager();
