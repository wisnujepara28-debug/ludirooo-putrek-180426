import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { FileItem, FileType, StorageStats } from '../types/storage';
import { validateFileInput, TOTAL_STORAGE_QUOTA_BYTES, getRemainingTrashDays } from './formatters';

const FILES_COLLECTION = 'files';

/**
 * Realtime subscription to Firestore /files collection with immediate callback
 */
export function subscribeToFiles(
  ownerId: string,
  onUpdate: (files: FileItem[]) => void,
  onError: (error: Error) => void
) {
  try {
    const q = query(collection(db, FILES_COLLECTION));

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const files: FileItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || 'Untitled File',
              type: (data.type as FileType) || 'other',
              mimeType: data.mimeType || 'application/octet-stream',
              size: Number(data.size) || 0,
              url: data.url || '',
              category: data.category || 'Lainnya',
              tags: Array.isArray(data.tags) ? data.tags : [],
              description: data.description || '',
              isFavorite: Boolean(data.isFavorite),
              inTrash: Boolean(data.inTrash),
              deletedAt: data.deletedAt || undefined,
              ownerId: data.ownerId || ownerId,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
          });

          onUpdate(files);
        } catch (err) {
          console.error('Error parsing Firestore snapshot:', err);
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      },
      (error) => {
        console.warn('Firestore subscription notice:', error);
        onError(error);
      }
    );
  } catch (err) {
    console.error('Error initializing subscribeToFiles:', err);
    onError(err instanceof Error ? err : new Error(String(err)));
    return () => {};
  }
}

/**
 * Add a new file item document to Firestore
 */
export async function addFileItem(
  data: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const validation = validateFileInput({
    name: data.name,
    size: data.size,
    category: data.category,
    description: data.description,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || 'Validasi input file gagal.');
  }

  const now = new Date().toISOString();
  const payload = {
    name: data.name.trim(),
    type: data.type,
    mimeType: data.mimeType,
    size: data.size,
    url: data.url,
    category: data.category || 'Lainnya',
    tags: data.tags || [],
    description: (data.description || '').trim(),
    isFavorite: Boolean(data.isFavorite),
    inTrash: false,
    ownerId: data.ownerId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, FILES_COLLECTION), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, FILES_COLLECTION);
    throw error;
  }
}

/**
 * Update an existing file item in Firestore
 */
export async function updateFileItem(
  fileId: string,
  updates: Partial<Omit<FileItem, 'id' | 'ownerId' | 'createdAt'>>
): Promise<void> {
  if (updates.name !== undefined) {
    const validation = validateFileInput({
      name: updates.name,
      category: updates.category,
      description: updates.description,
    });
    if (!validation.isValid) {
      throw new Error(validation.error || 'Validasi pembaruan file gagal.');
    }
  }

  const docRef = doc(db, FILES_COLLECTION, fileId);
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    ...updates,
    updatedAt: now,
  };

  try {
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FILES_COLLECTION}/${fileId}`);
    throw error;
  }
}

/**
 * Soft delete (move to Trash with 30-day timestamp) or restore
 */
export async function moveToTrash(fileId: string, inTrash: boolean = true): Promise<void> {
  const docRef = doc(db, FILES_COLLECTION, fileId);
  const now = new Date().toISOString();

  const payload = inTrash
    ? { inTrash: true, deletedAt: now, updatedAt: now }
    : { inTrash: false, deletedAt: null, updatedAt: now };

  try {
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FILES_COLLECTION}/${fileId}`);
    throw error;
  }
}

export async function toggleFavorite(fileId: string, currentStatus: boolean): Promise<void> {
  await updateFileItem(fileId, { isFavorite: !currentStatus });
}

/**
 * Permanent delete document from Firestore
 */
export async function deleteFileItemPermanently(fileId: string): Promise<void> {
  const docRef = doc(db, FILES_COLLECTION, fileId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${FILES_COLLECTION}/${fileId}`);
    throw error;
  }
}

/**
 * Permanently delete multiple file items by IDs
 */
export async function deleteMultipleFilesPermanently(fileIds: string[]): Promise<void> {
  if (!fileIds.length) return;
  try {
    const batch = writeBatch(db);
    fileIds.forEach((id) => {
      const docRef = doc(db, FILES_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, FILES_COLLECTION);
    throw error;
  }
}

/**
 * Restore multiple file items from Trash
 */
export async function restoreMultipleFiles(fileIds: string[]): Promise<void> {
  if (!fileIds.length) return;
  const now = new Date().toISOString();
  try {
    const batch = writeBatch(db);
    fileIds.forEach((id) => {
      const docRef = doc(db, FILES_COLLECTION, id);
      batch.update(docRef, { inTrash: false, deletedAt: null, updatedAt: now });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, FILES_COLLECTION);
    throw error;
  }
}

/**
 * Move multiple file items to Trash
 */
export async function moveMultipleFilesToTrash(fileIds: string[]): Promise<void> {
  if (!fileIds.length) return;
  const now = new Date().toISOString();
  try {
    const batch = writeBatch(db);
    fileIds.forEach((id) => {
      const docRef = doc(db, FILES_COLLECTION, id);
      batch.update(docRef, { inTrash: true, deletedAt: now, updatedAt: now });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, FILES_COLLECTION);
    throw error;
  }
}

/**
 * Empty all items in Trash permanently
 */
export async function emptyTrashFiles(userId: string): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, FILES_COLLECTION));
    const trashDocs = snapshot.docs.filter((d) => d.data()?.inTrash === true);

    if (trashDocs.length === 0) return 0;

    const batch = writeBatch(db);
    trashDocs.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit();
    return trashDocs.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, FILES_COLLECTION);
    throw error;
  }
}

/**
 * Compute storage statistics
 */
export function calculateStats(files: FileItem[]): StorageStats {
  const activeFiles = files.filter((f) => !f.inTrash);
  const trashFiles = files.filter((f) => f.inTrash);

  let usedBytes = 0;
  let docsCount = 0;
  let docsBytes = 0;
  let photosCount = 0;
  let photosBytes = 0;
  let videosCount = 0;
  let videosBytes = 0;
  let otherCount = 0;
  let otherBytes = 0;

  activeFiles.forEach((f) => {
    usedBytes += f.size;
    if (f.type === 'document') {
      docsCount++;
      docsBytes += f.size;
    } else if (f.type === 'photo') {
      photosCount++;
      photosBytes += f.size;
    } else if (f.type === 'video') {
      videosCount++;
      videosBytes += f.size;
    } else {
      otherCount++;
      otherBytes += f.size;
    }
  });

  return {
    totalQuotaBytes: TOTAL_STORAGE_QUOTA_BYTES,
    usedBytes,
    freeBytes: Math.max(0, TOTAL_STORAGE_QUOTA_BYTES - usedBytes),
    fileCount: activeFiles.length,
    documentsCount: docsCount,
    documentsBytes: docsBytes,
    photosCount,
    photosBytes,
    videosCount,
    videosBytes,
    otherCount,
    otherBytes,
    trashCount: trashFiles.length,
  };
}
