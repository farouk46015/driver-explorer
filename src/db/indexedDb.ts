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

export const db = new DriveDb('DriveDb');

// // Cache for user databases
// const dbCache: Map<string, DriveDb> = new Map();

// /**
//  * Get the DriveDb instance for the current user
//  * Throws an error if no user is logged in
//  */
// export function getUserDb(): DriveDb {
//   const userJson = localStorage.getItem('user');

//   if (!userJson) {
//     throw new Error('No user logged in. Please sign in to access the database.');
//   }

//   const user = JSON.parse(userJson) as { id?: string; name?: string; email?: string };
//   const userId = user.id;

//   if (!userId || typeof userId !== 'string') {
//     throw new Error('Invalid user data. Please sign in again.');
//   }

//   // Return cached instance if exists
//   const cachedDb = dbCache.get(userId);
//   if (cachedDb) {
//     return cachedDb;
//   }

//   // Create new database instance for this user
//   // const dbName = `DriveDb_${userId}`;
//   const dbName = 'DriveDb';

//   const userDb = new DriveDb(dbName);
//   dbCache.set(userId, userDb);

//   return userDb;
// }

/**
 * Clear the database cache (call on logout)
 */
// export function clearDbCache(): void {
//   dbCache.clear();
// }

// // For backward compatibility, export a getter
// export const db = new Proxy({} as DriveDb, {
//   get(_target, prop) {
//     const userDb = getUserDb();
//     return userDb[prop as keyof DriveDb];
//   },
// });
