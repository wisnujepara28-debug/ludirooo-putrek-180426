import React from 'react';
import { StorageStats } from '../types/storage';
import { formatBytes, calculateStoragePercentage } from '../lib/formatters';
import {
  PieChart,
  HardDrive,
  FileText,
  Image,
  Film,
  Archive,
  X,
  ShieldCheck,
  Zap,
  Database,
} from 'lucide-react';

interface StorageMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StorageStats;
}

export const StorageMeterModal: React.FC<StorageMeterModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const percentageUsed = calculateStoragePercentage(stats.usedBytes);

  const categories = [
    {
      name: 'Dokumen',
      count: stats.documentsCount,
      bytes: stats.documentsBytes,
      icon: <FileText className="w-4 h-4 text-indigo-600" />,
      color: 'bg-indigo-500',
    },
    {
      name: 'Foto',
      count: stats.photosCount,
      bytes: stats.photosBytes,
      icon: <Image className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-500',
    },
    {
      name: 'Video',
      count: stats.videosCount,
      bytes: stats.videosBytes,
      icon: <Film className="w-4 h-4 text-amber-600" />,
      color: 'bg-amber-500',
    },
    {
      name: 'Arsip & Lainnya',
      count: stats.otherCount,
      bytes: stats.otherBytes,
      icon: <Archive className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Analisis Kapasitas Storage</h3>
              <p className="text-xs text-slate-500">Kuota Terdaftar: 1,000 TB (1,000,000 GB)</p>
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

        {/* Main Meter Showcase */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-400" /> Penggunaan Ruang Simpan
            </span>
            <span className="font-bold text-emerald-400">{percentageUsed}% Terpakai</span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{
                width: `${stats.usedBytes > 0 ? (stats.documentsBytes / stats.usedBytes) * 100 : 0}%`,
              }}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${stats.usedBytes > 0 ? (stats.photosBytes / stats.usedBytes) * 100 : 0}%`,
              }}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{
                width: `${stats.usedBytes > 0 ? (stats.videosBytes / stats.usedBytes) * 100 : 0}%`,
              }}
            />
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{
                width: `${stats.usedBytes > 0 ? (stats.otherBytes / stats.usedBytes) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-slate-400 text-[11px]">Total Ruang Terpakai</p>
              <p className="text-base font-bold text-white mt-0.5">{formatBytes(stats.usedBytes)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-slate-400 text-[11px]">Ruang Bebas Tersedia</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {formatBytes(stats.freeBytes)}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Rincian Kategori File
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{cat.name}</p>
                    <p className="text-[11px] text-slate-500">{cat.count} file</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{formatBytes(cat.bytes)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Single Source of Truth Banner */}
        <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs leading-relaxed flex items-start gap-3">
          <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Nyata (Firebase Firestore)</p>
            <p className="text-slate-600 mt-0.5">
              Semua dokumen, foto, video, metadata, serta kalkulasi kuota disimpan secara persisten di database cloud nyata tanpa menggunakan localStorage.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Tutup Analisis
          </button>
        </div>
      </div>
    </div>
  );
};
