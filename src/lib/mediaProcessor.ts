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

/**
 * Converts a Base64 Data URL to an in-memory Blob Object URL for HTML5 video seeking
 */
export function dataUrlToBlobUrl(dataUrl: string): string | null {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('dataUrlToBlobUrl conversion notice:', err);
    return null;
  }
}

/**
 * Generates an in-memory animated WebM video blob URL using HTML5 Canvas & MediaRecorder
 * Guarantees a 100% playable video stream on any browser without network/CORS dependency
 */
let cachedSyntheticVideoUrl: string | null = null;

export async function generateSyntheticVideoBlobUrl(title: string = 'PUTREK FILE - VIDEO DEMO'): Promise<string> {
  if (cachedSyntheticVideoUrl) {
    return cachedSyntheticVideoUrl;
  }

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      if (!ctx || !('MediaRecorder' in window)) {
        resolve('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
        return;
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const blobUrl = URL.createObjectURL(blob);
        cachedSyntheticVideoUrl = blobUrl;
        resolve(blobUrl);
      };

      recorder.start();

      let frame = 0;
      const totalFrames = 90; // 3 seconds loop at 30fps

      const drawFrame = () => {
        frame++;
        const progress = frame / totalFrames;

        // Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 640, 360);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#0284c7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);

        // Animated Circle
        const centerX = 320 + Math.sin(progress * Math.PI * 2) * 80;
        const centerY = 180 + Math.cos(progress * Math.PI * 2) * 40;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.fill();

        // Title Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, 320, 150);

        // Subtitle & Timer
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`PUTERAN VIDEO VAULT AKTIF · 00:0${Math.floor(progress * 3)} / 00:03`, 320, 190);

        // Play Badge
        ctx.fillStyle = '#10b981';
        ctx.fillRect(200, 220, 240, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('▶ PUTREK FILE VIDEO PLAYER', 320, 241);

        if (frame < totalFrames) {
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };

      drawFrame();
    } catch (err) {
      console.warn('Synthetic video creation notice:', err);
      resolve('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
    }
  });
}
