import React from 'react';
import { FileItem, SortByOption } from '../types/storage';
import { formatBytes, formatDate, getRemainingTrashDays } from '../lib/formatters';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Archive,
  Star,
  Trash2,
  Eye,
  Edit2,
  RotateCcw,
  ArrowUpDown,
  Clock,
  CheckSquare,
  Square,
} from 'lucide-react';

interface FileListProps {
  files: FileItem[];
  onPreview: (file: FileItem) => void;
  onEdit: (file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
  onMoveToTrash: (fileItem: FileItem) => void;
  onRestore: (fileItem: FileItem) => void;
  onPermanentDelete: (fileItem: FileItem) => void;
  sortBy: SortByOption;
  setSortBy: (sort: SortByOption) => void;
  selectedFileIds?: string[];
  onToggleSelectFile?: (fileId: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onPreview,
  onEdit,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  sortBy,
  setSortBy,
  selectedFileIds = [],
  onToggleSelectFile,
}) => {
  const getFileIcon = (type: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx'].includes(ext)) {
      return <FileText className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileText className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (type === 'photo') {
      return <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (type === 'video') {
      return <Film className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (type === 'archive') {
      return <Archive className="w-4 h-4 text-purple-600 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  const toggleSort = (field: 'name' | 'date' | 'size') => {
    if (field === 'name') {
      setSortBy('name');
    } else if (field === 'date') {
      setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc');
    } else if (field === 'size') {
      setSortBy(sortBy === 'size-desc' ? 'size-asc' : 'size-desc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              {onToggleSelectFile && <th className="py-3 px-3 w-10 text-center">Pilih</th>}
              <th className="py-3 px-4">Nama File</th>
              <th className="py-3 px-4">Kategori & Tag</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('size')}>
                <div className="flex items-center gap-1">
                  <span>Ukuran</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Tanggal Update</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {files.map((file) => {
              const daysLeft = file.inTrash ? getRemainingTrashDays(file.deletedAt) : 30;
              const isSelected = selectedFileIds.includes(file.id);

              return (
                <tr
                  key={file.id}
                  className={`transition-colors group cursor-pointer ${
                    isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-slate-50/80'
                  }`}
                  onClick={() => onPreview(file)}
                >
                  {/* Checkbox Column */}
                  {onToggleSelectFile && (
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleSelectFile(file.id)}
                        className={`p-1 rounded-md transition-all ${
                          isSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-600'
                        }`}
                        title={isSelected ? 'Batal Pilih' : 'Pilih File'}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                  )}

                  {/* File Name Column */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {!file.inTrash && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(file);
                          }}
                          className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                            file.isFavorite ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      {getFileIcon(file.type, file.name)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {file.name}
                          </p>
                          {file.inTrash && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Sisa {daysLeft} Hari
                            </span>
                          )}
                        </div>
                        {file.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category & Tags Column */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-semibold">{file.category}</span>
                      {file.tags.length > 0 && (
                        <span className="text-slate-400 text-[10px]">
                          ({file.tags.join(', ')})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Size Column */}
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                    {formatBytes(file.size)}
                  </td>

                  {/* Date Column */}
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                    {formatDate(file.updatedAt)}
                  </td>

                  {/* Action Buttons Column */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {file.inTrash ? (
                        <>
                          <button
                            onClick={() => onRestore(file)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
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
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
