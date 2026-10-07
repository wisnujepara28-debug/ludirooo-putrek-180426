import { FileType } from '../types/storage';

// 1000 TB in bytes
export const TOTAL_STORAGE_QUOTA_BYTES = 1000 * 1024 * 1024 * 1024 * 1024; // 1,099,511,627,776,000 bytes (~1000 TiB / 1 PB)

/**
 * Formats byte size into human readable string (Bytes, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);

  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx];
}

/**
 * Calculates percentage of storage used out of 1000 TB
 */
export function calculateStoragePercentage(usedBytes: number): number {
  if (usedBytes <= 0) return 0;
  const percentage = (usedBytes / TOTAL_STORAGE_QUOTA_BYTES) * 100;
  if (percentage > 0 && percentage < 0.01) return 0.01;
  return parseFloat(percentage.toFixed(4));
}

/**
 * Infers file type from file extension or MIME type
 */
export function inferFileType(filename: string, mimeType?: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (
    mimeType?.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'heic'].includes(ext)
  ) {
    return 'photo';
  }

  if (
    mimeType?.startsWith('video/') ||
    ['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'm4v', 'flv'].includes(ext)
  ) {
    return 'video';
  }

  if (
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'rtf', 'odt'].includes(ext) ||
    mimeType?.includes('pdf') ||
    mimeType?.includes('word') ||
    mimeType?.includes('excel') ||
    mimeType?.includes('powerpoint') ||
    mimeType?.includes('text')
  ) {
    return 'document';
  }

  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return 'archive';
  }

  return 'other';
}

/**
 * Calculates remaining days in Trash before automatic deletion (max 30 days)
 */
export function getRemainingTrashDays(deletedAt?: string): number {
  if (!deletedAt) return 30;
  try {
    const deletedDate = new Date(deletedAt).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
    const remaining = 30 - elapsedDays;
    return Math.max(0, remaining);
  } catch {
    return 30;
  }
}

/**
 * Strict input validation for file updates/creations
 */
export function validateFileInput(data: {
  name: string;
  size?: number;
  category?: string;
  description?: string;
}): { isValid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Nama file tidak boleh kosong.' };
  }

  if (data.name.length > 255) {
    return { isValid: false, error: 'Nama file terlalu panjang (maksimal 255 karakter).' };
  }

  if (/[\\/:*?"<>|]/.test(data.name)) {
    return { isValid: false, error: 'Nama file mengandung karakter ilegal (\\ / : * ? " < > |).' };
  }

  if (data.description && data.description.length > 2000) {
    return { isValid: false, error: 'Deskripsi terlalu panjang (maksimal 2000 karakter).' };
  }

  if (data.category && data.category.length > 100) {
    return { isValid: false, error: 'Kategori terlalu panjang (maksimal 100 karakter).' };
  }

  if (data.size !== undefined && data.size < 0) {
    return { isValid: false, error: 'Ukuran file tidak valid.' };
  }

  return { isValid: true };
}

/**
 * Format ISO date string into Indonesian formatted date
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}
