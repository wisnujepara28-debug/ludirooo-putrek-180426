/**
 * Media Processor for local uploads & persistence:
 * 1. Image Compressor: Converts uploaded photos into embedded JPEG Data URLs (~50KB-120KB).
 * 2. Video Blob Registry & IndexedDB Manager: Persists local video File blobs across reloads.
 * 3. Document Data URL Reader: Reads PDFs, TXT, CSV, and Office files into Data URLs.
 */

// In-memory session registry for local File blobs
const fileBlobRegistry = new Map<string, { file: File; objectUrl: string }>();

export function registerLocalFileBlob(fileKey: string, file: File): string {
  const existing = fileBlobRegistry.get(fileKey);
  if (existing) {
    return existing.objectUrl;
  }
  const objectUrl = URL.createObjectURL(file);
  fileBlobRegistry.set(fileKey, { file, objectUrl });
  return objectUrl;
}

export function getLocalFileBlobUrl(fileKey: string): string | null {
  const reg = fileBlobRegistry.get(fileKey);
  if (reg) return reg.objectUrl;

  // Search by substring key
  for (const [key, val] of fileBlobRegistry.entries()) {
    if (fileKey.includes(key) || key.includes(fileKey)) {
      return val.objectUrl;
    }
  }
  return null;
}

// IndexedDB for local video blob persistence
const DB_NAME = 'putrek_file_vault';
const STORE_NAME = 'media_blobs';

function openBlobDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalVideoToIndexedDb(fileKey: string, file: File): Promise<void> {
  try {
    const db = await openBlobDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, fileKey);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save notice:', err);
  }
}

export async function getLocalVideoFromIndexedDb(fileKey: string): Promise<string | null> {
  try {
    const db = await openBlobDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(fileKey);
    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          const objectUrl = URL.createObjectURL(req.result);
          resolve(objectUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Compresses local photo files to lightweight Data URLs (~800px, 0.75 quality)
 */
export async function processLocalPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDim = 900;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(objectUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Reads document files into Data URLs
 */
export async function readDocumentDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
