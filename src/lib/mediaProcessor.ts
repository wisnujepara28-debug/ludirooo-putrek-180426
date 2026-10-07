/**
 * Media Processor for local uploads:
 * 1. Image Compressor: Converts uploaded photos into embedded JPEG Data URLs (~50KB-120KB).
 * 2. Video Thumbnail Extractor: Seeks into uploaded video files and captures the 1st frame on Canvas as a Data URL poster!
 * 3. Document Data URL Reader: Reads PDFs, TXT, CSV, and Office files into Data URLs.
 * 4. Blob Session Registry: Maintains active local File objects in memory for instant 60fps playback/rendering in the browser session.
 */

// In-memory session registry for local File blobs
const fileBlobRegistry = new Map<string, { file: File; objectUrl: string }>();

export function registerLocalFileBlob(fileId: string, file: File): string {
  const existing = fileBlobRegistry.get(fileId);
  if (existing) {
    return existing.objectUrl;
  }
  const objectUrl = URL.createObjectURL(file);
  fileBlobRegistry.set(fileId, { file, objectUrl });
  return objectUrl;
}

export function getLocalFileBlobUrl(fileId: string): string | null {
  return fileBlobRegistry.get(fileId)?.objectUrl || null;
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
 * Extracts a thumbnail poster frame from a local Video file using HTML5 Video + Canvas
 */
export async function processLocalVideoThumbnail(file: File): Promise<{ posterUrl: string; streamUrl: string }> {
  return new Promise((resolve) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.currentTime = 1; // Seek to 1 second for thumbnail frame

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 640, 640);
        canvas.height = Math.min(video.videoHeight || 360, 360);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ posterUrl, streamUrl: videoUrl });
          return;
        }
      } catch (e) {
        console.warn('Video canvas thumbnail extraction notice:', e);
      }
      resolve({ posterUrl: '', streamUrl: videoUrl });
    };

    video.onerror = () => {
      resolve({ posterUrl: '', streamUrl: videoUrl });
    };

    // Timeout fallback after 2s if video loading takes too long
    setTimeout(() => {
      resolve({ posterUrl: '', streamUrl: videoUrl });
    }, 2000);
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
