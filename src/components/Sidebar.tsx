import React from 'react';
import { CategoryFilter, StorageStats } from '../types/storage';
import { formatBytes, calculateStoragePercentage } from '../lib/formatters';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  Archive,
  Star,
  Trash2,
  HardDrive,
  ChevronRight,
  Database,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  currentCategory: CategoryFilter;
  setCategory: (category: CategoryFilter) => void;
  stats: StorageStats;
  onOpenStorageMeter: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCategory,
  setCategory,
  stats,
  onOpenStorageMeter,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems: {
    id: CategoryFilter;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    { id: 'all', label: 'Semua File', icon: <Folder className="w-4 h-4" />, count: stats.fileCount },
    {
      id: 'document',
      label: 'Dokumen Office',
      sublabel: 'PPT, Word, Excel, PDF',
      icon: <FileText className="w-4 h-4 text-indigo-600" />,
      count: stats.documentsCount,
    },
    {
      id: 'photo',
      label: 'Foto & Gambar',
      sublabel: 'PNG, JPG, WebP, SVG',
      icon: <ImageIcon className="w-4 h-4 text-emerald-600" />,
      count: stats.photosCount,
    },
    {
      id: 'video',
      label: 'Video',
      sublabel: 'MP4, MKV, AVI, MOV',
      icon: <Film className="w-4 h-4 text-amber-600" />,
      count: stats.videosCount,
    },
    {
      id: 'archive',
      label: 'Arsip & Lainnya',
      sublabel: 'ZIP, RAR, 7Z, TXT',
      icon: <Archive className="w-4 h-4 text-purple-600" />,
      count: stats.otherCount,
    },
    {
      id: 'favorite',
      label: 'Favorit',
      icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
    },
    {
      id: 'trash',
      label: 'Tempat Sampah',
      sublabel: 'Pemulihan Maks. 30 Hari',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      count: stats.trashCount,
    },
  ];

  const percentageUsed = calculateStoragePercentage(stats.usedBytes);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 h-full lg:h-[calc(100vh-61px)] w-68 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Main Navigation */}
        <div className="space-y-6">
          <div className="px-2 pt-2">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Kelompok Jenis File
            </h2>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCategory(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.sublabel && (
                          <span className="block text-[10px] text-slate-400 font-normal truncate">
                            {item.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ml-1 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : item.id === 'trash'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 1000 TB Storage Quota Widget */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Storage Vault</span>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                1000 TB
              </span>
            </div>

            {/* Storage Meter Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(percentageUsed, 1)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-3">
              <span>Terpakai: {formatBytes(stats.usedBytes)}</span>
              <span className="font-semibold text-emerald-400">
                Sisa: {formatBytes(stats.freeBytes)}
              </span>
            </div>

            <button
              onClick={onOpenStorageMeter}
              className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Detail Analisis Storage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-500" /> Firestore Realtime
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Clock className="w-3 h-3 text-rose-400" /> Sampah 30 Hari
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
