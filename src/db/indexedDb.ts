import Dexie, { type Table } from 'dexie';
import type { FileItem, FolderItem, User } from '@/types';

export class DriveDb extends Dexie {
  files!: Table<FileItem, string>;
  folders!: Table<FolderItem, string>;

  constructor(dbName: string) {
    super(dbName);
    this.version(1).stores({
      files: 'id, name, type, size, modified, ext, isFavorite',
      folders: 'id, name, type, modified, items, isFavorite, *path',
    });
  }
}

export class AuthDb extends Dexie {
  users!: Table<User, string>;

  constructor() {
    super('AuthDb');
    this.version(1).stores({
      users: 'id, name, email, createdAt',
    });
  }
}

// Auth database is shared across all users
export const authDb = new AuthDb();

// Cache for fingerprint-based databases
const dbCache: Map<string, DriveDb> = new Map();

/**
 * Get the DriveDb instance based on browser fingerprint
 * Each unique browser/device gets its own database
 */
export async function getFingerprintDb(): Promise<DriveDb> {
  const { getFingerprint } = await import('@/utils/fingerprint');
  const fingerprint = await getFingerprint();

  // Return cached instance if exists
  const cachedDb = dbCache.get(fingerprint);
  if (cachedDb) {
    return cachedDb;
  }

  // Create new database instance for this fingerprint
  const dbName = `DriveDb_${fingerprint}`;
  const fingerprintDb = new DriveDb(dbName);
  dbCache.set(fingerprint, fingerprintDb);

  console.log(`Created database: ${dbName}`);
  return fingerprintDb;
}

/**
 * Clear the database cache
 */
export function clearDbCache(): void {
  dbCache.clear();
}

// For backward compatibility, export db that gets initialized on first use
let dbInstance: DriveDb | null = null;

export const db = new Proxy({} as DriveDb, {
  get(_target, prop: string) {
    if (!dbInstance) {
      throw new Error(
        'Database not initialized. Call initializeDb() first or use getFingerprintDb() directly.'
      );
    }
    return dbInstance[prop as keyof DriveDb];
  },
});

/**
 * Initialize the database with fingerprint
 * Call this at app startup
 */
export async function initializeDb(): Promise<DriveDb> {
  dbInstance = await getFingerprintDb();
  return dbInstance;
}
