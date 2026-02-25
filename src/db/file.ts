import { db } from './indexedDb';
import { nanoid } from 'nanoid';
import { slugify } from '@/utils';
import type { FileItem } from '@/types';

export class FileManager {
  /**
   * Create a new file in the database
   */
  async create(name: string, blob: Blob, path: string[] = []): Promise<string> {
    const id = nanoid();
    const ext = name.split('.').pop() ?? '';
    const now = new Date().toISOString();

    const fileItem: FileItem = {
      id,
      name,
      slug: slugify(name),
      type: 'file',
      size: blob.size.toString(),
      modified: now,
      ext,
      isFavorite: false,
      path,
      blob,
      createdAt: now,
    };

    await db.files.add(fileItem);
    return id;
  }

  /**
   * Get all files from the database
   */
  async getAll(): Promise<FileItem[]> {
    return await db.files.toArray();
  }

  /**
   * Get a file by ID
   */
  async getById(id: string): Promise<FileItem | undefined> {
    return await db.files.get(id);
  }

  /**
   * Get files by path
   */
  async getByPath(path: string[]): Promise<FileItem[]> {
    const pathString = path.join('/');
    return await db.files.filter((file) => file.path?.join('/') === pathString).toArray();
  }

  /**
   * Update a file
   */
  async update(id: string, updates: Partial<FileItem>): Promise<void> {
    await db.files.update(id, {
      ...updates,
      modified: new Date().toISOString(),
    });
  }

  /**
   * Delete a file by ID
   */
  async delete(id: string): Promise<void> {
    await db.files.delete(id);
  }

  /**
   * Rename a file
   */
  async rename(id: string, newName: string): Promise<void> {
    await this.update(id, { name: newName, slug: slugify(newName) });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<void> {
    const file = await this.getById(id);
    if (file) {
      await this.update(id, { isFavorite: !file.isFavorite });
    }
  }

  /**
   * Get all favorite files
   */
  async getFavorites(): Promise<FileItem[]> {
    return await db.files.filter((file) => file.isFavorite).toArray();
  }

  /**
   * Search files by name
   */
  async search(query: string): Promise<FileItem[]> {
    const lowerQuery = query.toLowerCase();
    return await db.files.filter((file) => file.name.toLowerCase().includes(lowerQuery)).toArray();
  }

  /**
   * Move file to a new path
   */
  async move(id: string, newPath: string[]): Promise<void> {
    await this.update(id, { path: newPath });
  }

  /**
   * Get files by extension
   */
  async getByExtension(ext: string): Promise<FileItem[]> {
    return await db.files.where('ext').equals(ext).toArray();
  }

  /**
   * Bulk create files
   */
  async bulkCreate(files: Array<{ name: string; blob: Blob; path?: string[] }>): Promise<string[]> {
    const ids: string[] = [];

    for (const file of files) {
      const id = await this.create(file.name, file.blob, file.path ?? []);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Get total storage used
   */
  async getTotalSize(): Promise<number> {
    const files = await this.getAll();
    return files.reduce((total, file) => total + parseInt(file.size ?? '0'), 0);
  }

  /**
   * Download a file by creating a blob URL and triggering browser download
   */
  async download(id: string): Promise<void> {
    const file = await this.getById(id);

    if (!file?.blob) {
      throw new Error('File not found or has no blob data');
    }

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(file.blob);

    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// Export singleton instance
export const fileManager = new FileManager();
