import React from 'react';
import { FileItem } from '../types/storage';
import { formatBytes, formatDate, getRemainingTrashDays } from '../lib/formatters';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Archive,
  Star,
  Trash2,
  Eye,
  RotateCcw,
  Edit2,
  FolderOpen,
  Clock,
  Presentation,
  Table,
  BookOpen,
  PlayCircle,
  CheckSquare,
  Square,
} from 'lucide-react';

interface FileGridProps {
  files: FileItem[];
  onPreview: (file: FileItem) => void;
  onEdit: (file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
  onMoveToTrash: (fileItem: FileItem) => void;
  onRestore: (fileItem: FileItem) => void;
  onPermanentDelete: (fileItem: FileItem) => void;
  onOpenUpload: () => void;
  selectedFileIds?: string[];
  onToggleSelectFile?: (fileId: string) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  onPreview,
  onEdit,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  onOpenUpload,
  selectedFileIds = [],
  onToggleSelectFile,
}) => {
  if (files.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs my-4 space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <FolderOpen className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Belum Ada File Di Kategori Ini</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Mulai simpan file, dokumen penting, foto, atau video Anda di Cloud Storage 1000 TB ini.
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all inline-flex items-center gap-2"
        >
          Unggah File Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isPhoto = file.type === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
        const isVideo = file.type === 'video' || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
        const isPdf = ext === 'pdf' || file.mimeType.includes('pdf');
        const isPpt = ['ppt', 'pptx'].includes(ext) || file.mimeType.includes('powerpoint');
        const isExcel = ['xls', 'xlsx', 'csv'].includes(ext) || file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet');
        const isWord = ['doc', 'docx'].includes(ext) || file.mimeType.includes('word');

        const daysLeft = file.inTrash ? getRemainingTrashDays(file.deletedAt) : 30;
        const isSelected = selectedFileIds.includes(file.id);

        return (
          <div
            key={file.id}
            className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${
              isSelected
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/10'
                : file.inTrash
                ? 'border-rose-200/80 bg-rose-50/20 hover:border-rose-300 shadow-xs'
                : 'border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md'
            }`}
          >
            {/* Selection Checkbox for Trash / Multi-select */}
            {onToggleSelectFile && (
              <div className="absolute top-2.5 left-2.5 z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectFile(file.id);
                  }}
                  className={`p-1.5 rounded-lg shadow-sm backdrop-blur-md transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/90 text-slate-400 hover:text-slate-700'
                  }`}
                  title={isSelected ? 'Batal Pilih' : 'Pilih File'}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Top Preview Area */}
            <div
              onClick={() => onPreview(file)}
              className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center group-hover:bg-slate-200/60 transition-colors"
            >
              {/* 1. Photo Renderer */}
              {isPhoto && file.url ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : /* 2. Video Renderer */
              isVideo && file.url ? (
                file.url.startsWith('data:image') ? (
                  <div className="relative w-full h-full">
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                    <video src={file.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white/90 drop-shadow-md" />
                    </div>
                  </div>
                )
              ) : /* 3. PDF Cover Card */
              isPdf ? (
                <div className="w-full h-full p-4 bg-gradient-to-br from-rose-50 to-slate-100 flex flex-col justify-between border-b border-rose-100">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-md uppercase shadow-2xs">
                      PDF Document
                    </span>
                    <FileText className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="my-auto text-center">
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-2 px-2">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : /* 4. PPT Presentation Slide Cover Card */
              isPpt ? (
                <div className="w-full h-full p-4 bg-gradient-to-br from-amber-50 to-orange-100/60 flex flex-col justify-between border-b border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 text-white rounded-md uppercase shadow-2xs">
                      PPT Slide Deck
                    </span>
                    <Presentation className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="my-auto text-center">
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-2 px-2">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : /* 5. Excel Spreadsheet Sheet Cover Card */
              isExcel ? (
                <div className="w-full h-full p-4 bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col justify-between border-b border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md uppercase shadow-2xs">
                      Excel Spreadsheet
                    </span>
                    <Table className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="my-auto text-center">
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-2 px-2">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : /* 6. Word Document Cover Card */
              isWord ? (
                <div className="w-full h-full p-4 bg-gradient-to-br from-indigo-50 to-blue-100/60 flex flex-col justify-between border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-md uppercase shadow-2xs">
                      Word Document
                    </span>
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="my-auto text-center">
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-2 px-2">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : (
                /* Fallback File Card */
                <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {ext || file.type}
                  </span>
                </div>
              )}

              {/* Trash 30-Day Countdown Badge */}
              {file.inTrash && (
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-rose-600/95 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1 backdrop-blur-md z-20">
                  <Clock className="w-3 h-3" />
                  <span>Sisa {daysLeft} Hari</span>
                </div>
              )}

              {/* Favorite Action Button */}
              {!file.inTrash && (
                <div className="absolute top-2.5 right-2.5 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(file);
                    }}
                    className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                      file.isFavorite
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white/80 text-slate-600 hover:bg-white hover:text-amber-500'
                    }`}
                    title={file.isFavorite ? 'Hapus dari Favorit' : 'Tandai Favorit'}
                  >
                    <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Card Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4
                    onClick={() => onPreview(file)}
                    className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span>{file.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{formatBytes(file.size)}</span>
                </div>

                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {file.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(file.updatedAt)}
                </span>

                <div className="flex items-center gap-1">
                  {file.inTrash ? (
                    <>
                      <button
                        onClick={() => onRestore(file)}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        title="Pulihkan File Ke Folder Utama"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Pulihkan</span>
                      </button>
                      <button
                        onClick={() => onPermanentDelete(file)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Hapus Permanen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                        title="Buka File Langsung"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka</span>
                      </button>
                      <button
                        onClick={() => onEdit(file)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMoveToTrash(file)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Pindahkan Ke Tempat Sampah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
