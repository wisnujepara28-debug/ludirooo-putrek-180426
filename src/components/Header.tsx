import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ViewMode } from '../types/storage';
import { UserPresence } from '../lib/presenceService';
import {
  Search,
  Upload,
  LayoutGrid,
  List,
  HardDrive,
  LogOut,
  PieChart,
  Sparkles,
  Menu,
  X,
  Plus,
  Users,
  Wifi,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenUpload: () => void;
  onOpenStorageMeter: () => void;
  onOpenAiAssistant: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  onlineUsers: UserPresence[];
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenUpload,
  onOpenStorageMeter,
  onOpenAiAssistant,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onlineUsers,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showOnlineUsersTooltip, setShowOnlineUsersTooltip] = useState<boolean>(false);

  const onlineCount = Math.max(onlineUsers.length, 1);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Zone 1: Mobile Toggle & Brand & Live Online Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu sidebar"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <a href="#" className="text-base font-bold text-slate-900 tracking-tight block leading-none">
                PUTREK FILE
              </a>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block mt-0.5">
                1000 TB Storage Vault
              </span>
            </div>
          </div>

          {/* Realtime Live Online Badge */}
          <div className="relative hidden md:block ml-2">
            <button
              onMouseEnter={() => setShowOnlineUsersTooltip(true)}
              onMouseLeave={() => setShowOnlineUsersTooltip(false)}
              onClick={() => setShowOnlineUsersTooltip(!showOnlineUsersTooltip)}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{onlineCount} Online Realtime</span>
            </button>

            {/* Online Users List Tooltip */}
            {showOnlineUsersTooltip && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 text-white rounded-2xl p-3 shadow-xl z-50 text-xs space-y-2 border border-slate-800 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-slate-300 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Pengguna Online Terhubung
                  </span>
                  <span className="text-emerald-400">{onlineCount}</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {onlineUsers.length > 0 ? (
                    onlineUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-1 text-[11px]">
                        <span className="font-semibold text-slate-200">{u.displayName}</span>
                        <span className="text-[9px] text-emerald-400 font-mono">Aktif Live</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between py-1 text-[11px]">
                      <span className="font-semibold text-slate-200">{user?.displayName}</span>
                      <span className="text-[9px] text-emerald-400 font-mono">Aktif Live</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Search Bar */}
        <div className="flex-1 max-w-xl mx-2 hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file, dokumen, foto, video, atau tag..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Zone 3: Actions & Admin Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Helper Button */}
          <button
            onClick={onOpenAiAssistant}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5"
            title="Asisten AI Analisis File"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">AI Vault</span>
          </button>

          {/* Storage Meter Analytics Button */}
          <button
            onClick={onOpenStorageMeter}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Kapasitas & Statistik Storage"
          >
            <PieChart className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">1000 TB</span>
          </button>

          {/* View Mode Switcher */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Grid"
              aria-label="Tampilan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan List"
              aria-label="Tampilan List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Primary CTA */}
          <button
            onClick={onOpenUpload}
            className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah File</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              aria-label="Menu akun admin"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 py-2 z-50 text-xs">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user?.displayName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                      Admin Terverifikasi
                    </span>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                      Realtime Live Sync
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenStorageMeter();
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <PieChart className="w-4 h-4 text-slate-400" />
                    <span>Statistik Storage (1000 TB)</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Keluar dari Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="mt-3 sm:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari file, dokumen, foto, video..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </header>
  );
};
