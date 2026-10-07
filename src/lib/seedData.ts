import { FileItem } from '../types/storage';
import { addFileItem } from './fileService';

const SAMPLE_FILES = [
  {
    name: 'Laporan_Keuangan_PUTREK_FILE_2026.pdf',
    type: 'document' as const,
    mimeType: 'application/pdf',
    size: 4250000, // 4.25 MB
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
    category: 'Dokumen Resmi',
    tags: ['Laporan', 'Keuangan', '2026', 'Penting'],
    description: 'Dokumen laporan keuangan tahunan, analisis neraca, dan estimasi arus kas kuartal terbaru.',
    isFavorite: true,
  },
  {
    name: 'Foto_Dokumentasi_Tim_PUTREK_FILE.jpg',
    type: 'photo' as const,
    mimeType: 'image/jpeg',
    size: 8400000, // 8.4 MB
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    category: 'Media',
    tags: ['Foto', 'Kegiatan', 'Tim', 'Jakarta'],
    description: 'Dokumentasi acara peresmian peluncuran produk PUTREK FILE Cloud Vault bersama tim pengembang.',
    isFavorite: true,
  },
  {
    name: 'Video_Demo_Presentasi_PUTREK_FILE.mp4',
    type: 'video' as const,
    mimeType: 'video/mp4',
    size: 145000000, // 145 MB
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Media',
    tags: ['Video', 'Demo', 'Presentasi', '4K'],
    description: 'Video walkthrough fitur utama sistem penyimpanan cloud 1000 TB dan arsitektur database Firebase.',
    isFavorite: false,
  },
  {
    name: 'Desain_Arsitektur_PUTREK_FILE.png',
    type: 'photo' as const,
    mimeType: 'image/png',
    size: 3100000, // 3.1 MB
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    category: 'Kerja',
    tags: ['Blueprint', 'Arsitektur', 'Firestore'],
    description: 'Diagram skematik relasi data, aturan keamanan ABAC, dan strategi replikasi cloud.',
    isFavorite: false,
  },
  {
    name: 'Panduan_Penggunaan_PUTREK_FILE.docx',
    type: 'document' as const,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1800000, // 1.8 MB
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
    category: 'Dokumen Resmi',
    tags: ['Panduan', 'SOP', 'Keamanan'],
    description: 'Petunjuk langkah-langkah penggunaan fitur CRUD, enkripsi data, dan manajemen tempat sampah.',
    isFavorite: false,
  },
  {
    name: 'Backup_PUTREK_FILE_Sistem_Full.zip',
    type: 'archive' as const,
    mimeType: 'application/zip',
    size: 980000000, // 980 MB
    url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&auto=format&fit=crop&q=80',
    category: 'Pribadi',
    tags: ['Backup', 'Archive', 'PUTREK FILE'],
    description: 'Arsip cadangan data terenkripsi siap restore untuk pemulihan bencana.',
    isFavorite: false,
  },
];

export async function seedInitialFilesIfEmpty(userId: string, currentFilesCount: number) {
  if (currentFilesCount > 0) return;

  console.log('Seeding initial production sample files to Firestore...');
  for (const sample of SAMPLE_FILES) {
    try {
      await addFileItem({
        name: sample.name,
        type: sample.type,
        mimeType: sample.mimeType,
        size: sample.size,
        url: sample.url,
        category: sample.category,
        tags: sample.tags,
        description: sample.description,
        isFavorite: sample.isFavorite,
        inTrash: false,
        ownerId: userId,
      });
    } catch (err) {
      console.error('Failed to seed file:', sample.name, err);
    }
  }
}
