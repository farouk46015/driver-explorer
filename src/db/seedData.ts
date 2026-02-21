import { driveManager } from './driveManager';
import { db } from './indexedDb';

/**
 * Seed the database with initial mock data
 */
export async function seedDatabase() {
  // Check if data already exists
  const existingFolders = await db.folders.count();
  const existingFiles = await db.files.count();

  if (existingFolders > 0 || existingFiles > 0) {
    console.warn('Database already seeded, skipping...');
    return;
  }

  console.warn('Seeding database with mock data...');

  try {
    // Create root folders
    await driveManager.folders.create('Documents', ['My Drive']);
    await driveManager.folders.create('Images', ['My Drive']);
    await driveManager.folders.create('Projects', ['My Drive']);

    // Create subfolders in Documents
    await driveManager.folders.create('Work', ['My Drive', 'Documents']);
    await driveManager.folders.create('Personal', ['My Drive', 'Documents']);

    // Create subfolders in Images
    await driveManager.folders.create('Vacation Photos', ['My Drive', 'Images']);
    await driveManager.folders.create('Screenshots', ['My Drive', 'Images']);

    // Create mock files in My Drive
    await createMockFile('Resume.pdf', 'application/pdf', 2.1, ['My Drive'], true);
    await createMockFile(
      'Presentation.pptx',
      'application/vnd.ms-powerpoint',
      5.3,
      ['My Drive'],
      false
    );
    await createMockFile('Budget.xlsx', 'application/vnd.ms-excel', 1.8, ['My Drive'], false);
    await createMockFile('Photo_2024.jpg', 'image/jpeg', 3.2, ['My Drive'], false);
    await createMockFile('Notes.txt', 'text/plain', 0.045, ['My Drive'], false);

    // Create mock files in Documents
    await createMockFile('Contract.pdf', 'application/pdf', 1.2, ['My Drive', 'Documents'], false);
    await createMockFile(
      'Invoice.docx',
      'application/msword',
      0.5,
      ['My Drive', 'Documents'],
      false
    );

    // Create mock files in Images
    await createMockFile('Profile.jpg', 'image/jpeg', 2.5, ['My Drive', 'Images'], true);
    await createMockFile('Background.png', 'image/png', 4.1, ['My Drive', 'Images'], false);

    // Create mock files in Projects
    await createMockFile('Website.zip', 'application/zip', 15.2, ['My Drive', 'Projects'], false);
    await createMockFile(
      'App_Design.sketch',
      'application/octet-stream',
      8.7,
      ['My Drive', 'Projects'],
      true
    );

    // Update folder item counts
    await updateFolderCounts();

    console.warn('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

/**
 * Update all folder item counts based on actual children
 */
async function updateFolderCounts() {
  const allFolders = await db.folders.toArray();

  for (const folder of allFolders) {
    const folderPath = [...folder.path, folder.name];
    const pathString = folderPath.join('/');

    // Count direct children (files + folders)
    const childFiles = await db.files.filter((f) => f.path?.join('/') === pathString).count();

    const childFolders = await db.folders.filter((f) => f.path?.join('/') === pathString).count();

    const totalItems = childFiles + childFolders;

    if (folder.items !== totalItems) {
      await driveManager.folders.update(folder.id, { items: totalItems });
    }
  }
}

/**
 * Helper function to create a mock file with blob data
 */
async function createMockFile(
  name: string,
  mimeType: string,
  sizeMB: number,
  path: string[],
  isFavorite: boolean
) {
  // Create a mock blob with the specified size
  const sizeBytes = Math.floor(sizeMB * 1024 * 1024);
  const blob = new Blob([new ArrayBuffer(sizeBytes)], { type: mimeType });

  const fileId = await driveManager.files.create(name, blob, path);

  // Update favorite status if needed
  if (isFavorite) {
    await driveManager.files.toggleFavorite(fileId);
  }

  return fileId;
}

/**
 * Clear all data from the database
 */
export async function clearDatabase() {
  await db.files.clear();
  await db.folders.clear();
  console.warn('Database cleared!');
}
