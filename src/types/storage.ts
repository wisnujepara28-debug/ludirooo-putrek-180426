export type FileType = 'document' | 'photo' | 'video' | 'archive' | 'other';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number; // in bytes
  url: string; // Base64 data URL, Blob URL, or remote file URL
  category: string; // e.g. "Kerja", "Pribadi", "Dokumen Resmi", "Media", "Lainnya"
  tags: string[];
  description: string;
  isFavorite: boolean;
  inTrash: boolean;
  deletedAt?: string; // ISO string timestamp when moved to trash
  ownerId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface StorageStats {
  totalQuotaBytes: number; // 1,000 TB = 1,000,000,000,000,000 bytes
  usedBytes: number;
  freeBytes: number;
  fileCount: number;
  documentsCount: number;
  documentsBytes: number;
  photosCount: number;
  photosBytes: number;
  videosCount: number;
  videosBytes: number;
  otherCount: number;
  otherBytes: number;
  trashCount: number;
}

export type ViewMode = 'grid' | 'list';

export type CategoryFilter = 'all' | 'document' | 'photo' | 'video' | 'archive' | 'favorite' | 'trash';

export type SortByOption = 'name' | 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc';

export interface AdminUser {
  uid: string;
  username: string; // LUDIRO or PUTRI
  displayName: string;
  email: string;
  role: 'admin';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
