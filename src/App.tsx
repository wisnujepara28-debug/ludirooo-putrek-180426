import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { UploadModal } from './components/UploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { EditFileModal } from './components/EditFileModal';
import { StorageMeterModal } from './components/StorageMeterModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { ToastContainer } from './components/ToastContainer';
import {
  FileItem,
  FileType,
  CategoryFilter,
  ViewMode,
  SortByOption,
  ToastMessage,
} from './types/storage';
import {
  subscribeToFiles,
  addFileItem,
  updateFileItem,
  moveToTrash,
  toggleFavorite,
  deleteFileItemPermanently,
  deleteMultipleFilesPermanently,
  restoreMultipleFiles,
  moveMultipleFilesToTrash,
  emptyTrashFiles,
  calculateStats,
} from './lib/fileService';
import { startPresencePing, subscribeToOnlineUsers, UserPresence } from './lib/presenceService';
import { seedInitialFilesIfEmpty } from './lib/seedData';
import { testConnection } from './lib/firebase';
import {
  Trash2,
  ArrowUpDown,
  Database,
  Clock,
  Wifi,
  CheckSquare,
  Square,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();

  // Firestore Files state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  // View state
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortByOption>('date-desc');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Selection state
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isStorageMeterOpen, setIsStorageMeterOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [editFile, setEditFile] = useState<FileItem | null>(null);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
    isProcessing?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast Notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Clear selected files when category or search changes
  useEffect(() => {
    setSelectedFileIds([]);
  }, [category, searchQuery]);

  const addToast = (title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Realtime Presence Sync
  useEffect(() => {
    if (!user) return;

    const stopPing = startPresencePing(user.uid, user.username, user.displayName);
    const unsubscribePresence = subscribeToOnlineUsers((usersList) => {
      setOnlineUsers(usersList);
    });

    return () => {
      stopPing();
      unsubscribePresence();
    };
  }, [user]);

  // Subscribe to Realtime Firestore updates across all online users
  useEffect(() => {
    if (!user) return;

    testConnection();
    setLoadingFiles(true);

    const safetyTimer = setTimeout(() => {
      setLoadingFiles(false);
    }, 1000);

    const unsubscribe = subscribeToFiles(
      user.uid,
      async (updatedFiles) => {
        clearTimeout(safetyTimer);
        setFiles(updatedFiles);
        setLoadingFiles(false);

        // Seed initial production files if database is empty
        if (updatedFiles.length === 0) {
          await seedInitialFilesIfEmpty(user.uid, 0);
        }
      },
      (error) => {
        clearTimeout(safetyTimer);
        setLoadingFiles(false);
        console.warn('Subscription load notice:', error);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [user]);

  // Compute storage statistics out of 1000 TB
  const stats = useMemo(() => calculateStats(files), [files]);

  // Filtered and Sorted Files
  const filteredFiles = useMemo(() => {
    return files
      .filter((f) => {
        // Category filtering
        if (category === 'trash') {
          if (!f.inTrash) return false;
        } else {
          if (f.inTrash) return false;

          if (category === 'favorite' && !f.isFavorite) return false;
          if (category === 'document' && f.type !== 'document') return false;
          if (category === 'photo' && f.type !== 'photo') return false;
          if (category === 'video' && f.type !== 'video') return false;
          if (category === 'archive' && f.type !== 'archive' && f.type !== 'other') return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = f.name.toLowerCase().includes(q);
          const matchesCategory = f.category.toLowerCase().includes(q);
          const matchesDesc = f.description.toLowerCase().includes(q);
          const matchesTags = f.tags.some((t) => t.toLowerCase().includes(q));
          return matchesName || matchesCategory || matchesDesc || matchesTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'date-desc') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortBy === 'date-asc') {
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        } else if (sortBy === 'size-desc') {
          return b.size - a.size;
        } else if (sortBy === 'size-asc') {
          return a.size - b.size;
        }
        return 0;
      });
  }, [files, category, searchQuery, sortBy]);

  // CRUD Actions - Broadcasts in Realtime to ALL Online Users!
  const handleUploadSuccess = async (fileData: {
    name: string;
    type: FileType;
    mimeType: string;
    size: number;
    url: string;
    category: string;
    tags: string[];
    description: string;
  }) => {
    if (!user) return;

    const newFile: FileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...fileData,
      isFavorite: false,
      inTrash: false,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFiles((prev) => [newFile, ...prev]);

    try {
      await addFileItem({
        ...fileData,
        isFavorite: false,
        inTrash: false,
        ownerId: user.uid,
      });
      addToast('File Tersimpan & Diterbitkan Online', `${fileData.name} kini terlihat secara realtime oleh semua pengguna.`, 'success');
    } catch (err) {
      addToast('File Tersimpan Lokal', `${fileData.name} dapat diakses di browser.`, 'info');
    }
  };

  const handleEditSave = async (
    fileId: string,
    updates: { name: string; category: string; tags: string[]; description: string }
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
      )
    );

    try {
      await updateFileItem(fileId, updates);
      addToast('Metadata Diperbarui', `Perubahan file disinkronisasi online.`, 'success');
    } catch (err) {
      addToast('Diperbarui', `Metadata diperbarui.`, 'info');
    }
  };

  const handleToggleFavorite = async (fileItem: FileItem) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileItem.id ? { ...f, isFavorite: !f.isFavorite } : f))
    );

    try {
      await toggleFavorite(fileItem.id, fileItem.isFavorite);
      addToast(
        fileItem.isFavorite ? 'Dihapus dari Favorit' : 'Ditambahkan ke Favorit',
        fileItem.name,
        'info'
      );
    } catch (err) {
      // Handled
    }
  };

  // Selection Actions
  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  const handleMoveToTrash = async (fileItem: FileItem) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileItem.id
          ? { ...f, inTrash: true, deletedAt: new Date().toISOString() }
          : f
      )
    );

    try {
      await moveToTrash(fileItem.id, true);
      addToast('File Dipindahkan ke Sampah', `${fileItem.name} disimpan selama 30 hari & dapat dipulihkan.`, 'warning');
    } catch (err) {
      addToast('File Dipindahkan Ke Sampah', `${fileItem.name} disimpan di sampah.`, 'warning');
    }
  };

  const handleRestore = async (fileItem: FileItem) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileItem.id ? { ...f, inTrash: false, deletedAt: undefined } : f))
    );

    try {
      await moveToTrash(fileItem.id, false);
      addToast('File Dipulihkan', `${fileItem.name} dikembalikan ke folder utama secara online.`, 'success');
    } catch (err) {
      addToast('File Dipulihkan', `${fileItem.name} dikembalikan ke folder utama.`, 'success');
    }
  };

  const handlePermanentDelete = (fileItem: FileItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen File',
      message: `Apakah Anda yakin ingin menghapus file "${fileItem.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Permanen',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          await deleteFileItemPermanently(fileItem.id);
          setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
          setSelectedFileIds((prev) => prev.filter((id) => id !== fileItem.id));
          addToast('File Dihapus Permanen', fileItem.name, 'success');
        } catch (err) {
          addToast('File Dihapus Permanen', fileItem.name, 'success');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    const trashFiles = files.filter((f) => f.inTrash);
    if (trashFiles.length === 0) {
      addToast('Tempat Sampah Kosong', 'Tidak ada file di tempat sampah.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Tempat Sampah',
      message: `Apakah Anda yakin ingin mengosongkan tempat sampah? Seluruh ${trashFiles.length} file di dalam tempat sampah akan dihapus secara permanen dan tidak dapat dipulihkan.`,
      confirmText: 'Kosongkan Semua',
      type: 'danger',
      onConfirm: async () => {
        if (!user) return;
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          await emptyTrashFiles(user.uid);
          const trashIds = trashFiles.map((f) => f.id);
          if (trashIds.length > 0) {
            await deleteMultipleFilesPermanently(trashIds);
          }
          setFiles((prev) => prev.filter((f) => !f.inTrash));
          setSelectedFileIds([]);
          addToast('Tempat Sampah Dikosongkan', `${trashFiles.length} file berhasil dihapus permanen.`, 'success');
        } catch (err) {
          addToast('Tempat Sampah Dikosongkan', `${trashFiles.length} file dihapus.`, 'success');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  const handleBulkDeletePermanently = () => {
    if (selectedFileIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Terpilih Secara Permanen',
      message: `Apakah Anda yakin ingin menghapus ${selectedFileIds.length} file yang dipilih secara permanen?`,
      confirmText: `Hapus (${selectedFileIds.length}) File`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
        try {
          await deleteMultipleFilesPermanently(selectedFileIds);
          setFiles((prev) => prev.filter((f) => !selectedFileIds.includes(f.id)));
          addToast('File Terpilih Dihapus Permanen', `${selectedFileIds.length} file berhasil dihapus.`, 'success');
          setSelectedFileIds([]);
        } catch (err) {
          addToast('File Terpilih Dihapus Permanen', `${selectedFileIds.length} file dihapus.`, 'success');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  const handleBulkRestore = async () => {
    if (selectedFileIds.length === 0) return;
    try {
      await restoreMultipleFiles(selectedFileIds);
      setFiles((prev) =>
        prev.map((f) =>
          selectedFileIds.includes(f.id) ? { ...f, inTrash: false, deletedAt: undefined } : f
        )
      );
      addToast('File Terpilih Dipulihkan', `${selectedFileIds.length} file dikembalikan ke folder utama.`, 'success');
      setSelectedFileIds([]);
    } catch (err) {
      addToast('File Dipulihkan', `${selectedFileIds.length} file dikembalikan.`, 'success');
    }
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedFileIds.length === 0) return;
    const now = new Date().toISOString();
    try {
      await moveMultipleFilesToTrash(selectedFileIds);
      setFiles((prev) =>
        prev.map((f) =>
          selectedFileIds.includes(f.id) ? { ...f, inTrash: true, deletedAt: now } : f
        )
      );
      addToast('File Dipindahkan ke Sampah', `${selectedFileIds.length} file berada di tempat sampah.`, 'warning');
      setSelectedFileIds([]);
    } catch (err) {
      addToast('File Dipindahkan ke Sampah', `${selectedFileIds.length} file dipindahkan.`, 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenStorageMeter={() => setIsStorageMeterOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onlineUsers={onlineUsers}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentCategory={category}
          setCategory={setCategory}
          stats={stats}
          onOpenStorageMeter={() => setIsStorageMeterOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Top Banner / Breadcrumb & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">PUTREK FILE</span>
                <span>/</span>
                <span className="capitalize font-medium text-indigo-600">
                  {category === 'all'
                    ? 'Semua File'
                    : category === 'trash'
                    ? 'Tempat Sampah (Maks. 30 Hari)'
                    : category === 'favorite'
                    ? 'Favorit'
                    : category === 'document'
                    ? 'Dokumen Office (PPT, Word, Excel, PDF)'
                    : category === 'photo'
                    ? 'Foto & Gambar'
                    : category === 'video'
                    ? 'Video'
                    : 'Arsip & Lainnya'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {category === 'all' && 'Semua Dokumen & Media'}
                {category === 'document' && 'Dokumen Office (PPT, Word, Excel, PDF)'}
                {category === 'photo' && 'Galeri Foto & Gambar (PNG, JPG, WebP)'}
                {category === 'video' && 'Koleksi Video (MP4, MKV, AVI)'}
                {category === 'archive' && 'Arsip & File Lainnya (ZIP, RAR)'}
                {category === 'favorite' && 'File Favorit Anda'}
                {category === 'trash' && 'Tempat Sampah (Auto-Delete 30 Hari)'}
              </h1>
            </div>

            {/* Quick Actions & Sorting Bar */}
            <div className="flex items-center gap-3">
              {category === 'trash' && filteredFiles.length > 0 && (
                <button
                  onClick={handleEmptyTrash}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Kosongkan Sampah</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortByOption)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="date-desc">Terbaru</option>
                  <option value="date-asc">Terlama</option>
                  <option value="name">Nama (A-Z)</option>
                  <option value="size-desc">Ukuran (Besar - Kecil)</option>
                  <option value="size-asc">Ukuran (Kecil - Besar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Special Informative Trash Banner or Live Online Sync Banner */}
          {category === 'trash' ? (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-950">
              <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Ketentuan Tempat Sampah (Maksimal 30 Hari)</p>
                <p className="text-rose-800 mt-0.5 leading-relaxed">
                  File yang berada di Tempat Sampah akan disimpan hingga <strong>maksimal 30 hari</strong>. Anda dapat menekan tombol <strong>"Pulihkan"</strong> kapan saja untuk mengembalikan file ke folder utama sebelum terhapus secara otomatis.
                </p>
              </div>
            </div>
          ) : (
            /* Global Live Online Sync Banner */
            <div className="mb-6 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                <span>
                  <strong>Terhubung Online Realtime:</strong> Setiap penambahan, pengubahan, atau penghapusan file oleh pengguna mana pun langsung diperbarui secara otomatis di semua layar secara bersamaan.
                </span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-bold bg-white text-emerald-700 rounded-lg border border-emerald-200 shadow-2xs">
                {Math.max(onlineUsers.length, 1)} Online
              </span>
            </div>
          )}

          {/* Selection & Bulk Operations Bar */}
          {filteredFiles.length > 0 && (
            <div className="mb-4 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {selectedFileIds.length > 0 && selectedFileIds.length === filteredFiles.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedFileIds.length > 0 && selectedFileIds.length === filteredFiles.length
                      ? 'Batal Pilih Semua'
                      : `Pilih Semua (${filteredFiles.length})`}
                  </span>
                </button>

                {selectedFileIds.length > 0 && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100">
                    {selectedFileIds.length} Terpilih
                  </span>
                )}
              </div>

              {/* Action buttons based on selection and category */}
              <div className="flex items-center gap-2">
                {category === 'trash' ? (
                  <>
                    {selectedFileIds.length > 0 && (
                      <>
                        <button
                          onClick={handleBulkRestore}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan Terpilih ({selectedFileIds.length})</span>
                        </button>

                        <button
                          onClick={handleBulkDeletePermanently}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Permanen Terpilih ({selectedFileIds.length})</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleEmptyTrash}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Kosongkan Tempat Sampah</span>
                    </button>
                  </>
                ) : (
                  selectedFileIds.length > 0 && (
                    <button
                      onClick={handleBulkMoveToTrash}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Pindahkan Terpilih ke Sampah ({selectedFileIds.length})</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loadingFiles ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 my-4 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Menghubungkan ke Firestore & memuat data file online...
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={filteredFiles}
              onPreview={(f) => setPreviewFile(f)}
              onEdit={(f) => setEditFile(f)}
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onOpenUpload={() => setIsUploadOpen(true)}
              selectedFileIds={selectedFileIds}
              onToggleSelectFile={handleToggleSelectFile}
            />
          ) : (
            <FileList
              files={filteredFiles}
              onPreview={(f) => setPreviewFile(f)}
              onEdit={(f) => setEditFile(f)}
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedFileIds={selectedFileIds}
              onToggleSelectFile={handleToggleSelectFile}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <StorageMeterModal
        isOpen={isStorageMeterOpen}
        onClose={() => setIsStorageMeterOpen(false)}
        stats={stats}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onEdit={(f) => setEditFile(f)}
        onToggleFavorite={handleToggleFavorite}
        onMoveToTrash={handleMoveToTrash}
        onShowToast={(title, msg, type) => addToast(title, msg, type)}
      />

      <EditFileModal
        file={editFile}
        onClose={() => setEditFile(null)}
        onSave={handleEditSave}
      />

      <GeminiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        files={files}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        isProcessing={confirmModal.isProcessing}
      />

      {/* Floating Toast Alerts Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppWrapper />
    </AuthProvider>
  );
}

const MainAppWrapper: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-700 tracking-wide">
          Memulai PUTREK FILE Storage...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <DashboardContent />;
}
