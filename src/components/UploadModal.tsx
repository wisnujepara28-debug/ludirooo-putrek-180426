import React, { useState } from 'react';
import { FileType } from '../types/storage';
import { validateFileInput, inferFileType, formatBytes } from '../lib/formatters';
import { processLocalPhoto, processLocalVideoThumbnail, readDocumentDataUrl, registerLocalFileBlob } from '../lib/mediaProcessor';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Archive,
  AlertCircle,
  CheckCircle2,
  Tag,
  FolderOpen,
  Link as LinkIcon,
  Sparkles,
  Camera,
  PlayCircle,
  Presentation,
  Table,
  BookOpen,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (fileData: {
    name: string;
    type: FileType;
    mimeType: string;
    size: number;
    url: string;
    category: string;
    tags: string[];
    description: string;
  }) => Promise<void>;
}

// Preset samples with real media URLs
const PRESET_SAMPLES = [
  {
    name: 'Foto_Pemandangan_Alam_HD.jpg',
    type: 'photo' as const,
    mimeType: 'image/jpeg',
    size: 5200000,
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    category: 'Media',
    tags: ['Foto', 'Pemandangan', 'Alam', 'HD'],
    description: 'Foto pemandangan alam pegunungan dan danau beresolusi tinggi.',
  },
  {
    name: 'Foto_Arsitektur_Modern.jpg',
    type: 'photo' as const,
    mimeType: 'image/jpeg',
    size: 4100000,
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    category: 'Pribadi',
    tags: ['Foto', 'Desain', 'Arsitektur'],
    description: 'Foto gedung arsitektur modern minimalis.',
  },
  {
    name: 'Video_Cinematic_Nature_4K.mp4',
    type: 'video' as const,
    mimeType: 'video/mp4',
    size: 85000000,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Media',
    tags: ['Video', '4K', 'Sinematik'],
    description: 'Video pemandangan alam sinematik resolusi 4K dengan audio jernih.',
  },
  {
    name: 'Video_Walkthrough_Tutorial.mp4',
    type: 'video' as const,
    mimeType: 'video/mp4',
    size: 62000000,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Kerja',
    tags: ['Video', 'Tutorial', 'Demo'],
    description: 'Video animasi tutorial penggunaan aplikasi dan walkthrough.',
  },
  {
    name: 'Dokumen_Presentasi_Strategi.pptx',
    type: 'document' as const,
    mimeType: 'application/vnd.ms-powerpoint',
    size: 3400000,
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
    category: 'Dokumen Resmi',
    tags: ['PPT', 'Presentasi', '2026'],
    description: 'Slide modul presentasi strategi bisnis dan pengembangan.',
  },
  {
    name: 'Dokumen_Panduan_PDF.pdf',
    type: 'document' as const,
    mimeType: 'application/pdf',
    size: 2800000,
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
    category: 'Dokumen Resmi',
    tags: ['PDF', 'Panduan', 'SOP'],
    description: 'Dokumen panduan standar operasional dan prosedur kerja.',
  },
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'file' | 'sample' | 'url'>('file');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<FileType>('photo');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileSize, setFileSize] = useState<number>(2500000);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [category, setCategory] = useState<string>('Media');
  const [tagsInput, setTagsInput] = useState<string>('Foto, Media');
  const [description, setDescription] = useState<string>('');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);

  const handleLocalFileSelect = async (file: File) => {
    setSelectedLocalFile(file);
    setFileName(file.name);
    const inferred = inferFileType(file.name, file.type);
    setFileType(inferred);
    setMimeType(file.type || (inferred === 'photo' ? 'image/jpeg' : inferred === 'video' ? 'video/mp4' : 'application/pdf'));
    setFileSize(file.size);
    setValidationError(null);

    const tempId = `temp_${Date.now()}`;
    registerLocalFileBlob(tempId, file);

    // 1. Process Photo
    if (inferred === 'photo') {
      setStatusMessage('Mengompresi & menyiapkan foto...');
      try {
        const compressedDataUrl = await processLocalPhoto(file);
        setFileUrl(compressedDataUrl);
      } catch (err) {
        console.warn('Photo processing fallback:', err);
        const dataUrl = await readDocumentDataUrl(file);
        setFileUrl(dataUrl);
      } finally {
        setStatusMessage(null);
      }
    }
    // 2. Process Video
    else if (inferred === 'video') {
      setStatusMessage('Mengambil poster frame dari video...');
      try {
        const { posterUrl, streamUrl } = await processLocalVideoThumbnail(file);
        // Use poster Data URL if extracted or streamUrl
        setFileUrl(posterUrl || streamUrl);
      } catch (err) {
        console.warn('Video thumbnail processing fallback:', err);
        const dataUrl = await readDocumentDataUrl(file);
        setFileUrl(dataUrl);
      } fontFinally: {
        setStatusMessage(null);
      }
    }
    // 3. Process PDF & Office Documents
    else {
      setStatusMessage('Membaca dokumen...');
      try {
        const dataUrl = await readDocumentDataUrl(file);
        setFileUrl(dataUrl);
      } catch (err) {
        console.warn('Document processing notice:', err);
      } finally {
        setStatusMessage(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLocalFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: typeof PRESET_SAMPLES[0]) => {
    setFileName(sample.name);
    setFileType(sample.type);
    setMimeType(sample.mimeType);
    setFileSize(sample.size);
    setFileUrl(sample.url);
    setCategory(sample.category);
    setTagsInput(sample.tags.join(', '));
    setDescription(sample.description);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const valResult = validateFileInput({
      name: fileName,
      size: fileSize,
      category,
      description,
    });

    if (!valResult.isValid) {
      setValidationError(valResult.error || 'Validasi gagal.');
      return;
    }

    let finalUrl = fileUrl.trim();
    if (!finalUrl) {
      if (fileType === 'photo') {
        finalUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';
      } else if (fileType === 'video') {
        finalUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      } else {
        finalUrl = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&auto=format&fit=crop&q=80';
      }
    }

    const tagsList = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsUploading(true);
    setStatusMessage('Menyimpan ke PUTREK FILE Vault...');
    try {
      await onUploadSuccess({
        name: fileName.trim(),
        type: fileType,
        mimeType: mimeType || 'application/octet-stream',
        size: fileSize,
        url: finalUrl,
        category: category.trim() || 'Lainnya',
        tags: tagsList,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal menyimpan file.');
    } finally {
      setIsUploading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Unggah Foto, Video, PDF & PPT</h3>
              <p className="text-xs text-slate-500">
                PUTREK FILE · Pemroses Gambar & Media Terbuka Langsung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Kesalahan Validasi Input</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'file'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>File Lokal (Komputer/HP)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('sample')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'sample'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Contoh Foto & Video</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'url'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Tautan URL</span>
          </button>
        </div>

        {/* Mode 1: Local File Drag and Drop */}
        {mode === 'file' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-2xl p-6 text-center transition-all relative group cursor-pointer"
          >
            <input
              type="file"
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.zip,.rar"
              onChange={(e) => e.target.files?.[0] && handleLocalFileSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white border border-indigo-100 shadow-xs flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              {fileType === 'photo' ? (
                <Camera className="w-6 h-6 text-emerald-600" />
              ) : fileType === 'video' ? (
                <PlayCircle className="w-6 h-6 text-amber-600" />
              ) : (
                <Upload className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            {selectedLocalFile ? (
              <div>
                <p className="text-xs font-bold text-slate-900">{selectedLocalFile.name}</p>
                <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  Ukuran: {formatBytes(selectedLocalFile.size)} · Tipe: {fileType.toUpperCase()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Klik di sini untuk memilih Foto, Video, PDF, atau PowerPoint
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  🖼️ Foto (JPG, PNG, WebP) · 🎥 Video (MP4, MKV) · 📊 PowerPoint (PPTX) · 📄 PDF
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Sample Preset Selection */}
        {mode === 'sample' && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilih Contoh Media Siap Pakai:
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {PRESET_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                    fileName === sample.name
                      ? 'bg-indigo-50/90 border-indigo-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 shrink-0 mt-0.5">
                    {sample.type === 'photo' ? (
                      <Camera className="w-4 h-4 text-emerald-600" />
                    ) : sample.type === 'video' ? (
                      <PlayCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{sample.name}</p>
                    <p className="text-[10px] text-slate-500">{formatBytes(sample.size)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* File Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama File <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setFileType(inferFileType(e.target.value, mimeType));
              }}
              placeholder="Contoh: Foto_Liburan_2026.jpg atau Presentasi_Proyek.pptx"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          {/* Type & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Media
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as FileType)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="photo">🖼️ Foto / Gambar (PNG, JPG, WebP)</option>
                <option value="video">🎥 Video (MP4, MKV, AVI)</option>
                <option value="document">📄 Dokumen (PDF, PPTX, Word, Excel)</option>
                <option value="archive">📦 Arsip (ZIP, RAR)</option>
                <option value="other">📁 File Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="Media">Media (Foto & Video)</option>
                <option value="Dokumen Resmi">Dokumen Resmi</option>
                <option value="Kerja">Kerja</option>
                <option value="Pribadi">Pribadi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* URL Input if URL Mode */}
          {mode === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Direct Gambar / Video / Dokumentasi
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... atau https://domain.com/file.mp4"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Tag (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Foto, Video, PPT, PDF, 2026"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Catatan (Opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Rincian catatan file foto, video, atau dokumen..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Vault...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Ke PUTREK FILE</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
