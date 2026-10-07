import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, KeyRound, User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('LUDIRO');
  const [password, setPassword] = useState<string>('LUDIRO');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap isi username dan password admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Login gagal.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan saat login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAdminPreset = (adminName: 'LUDIRO' | 'PUTRI') => {
    setUsername(adminName);
    setPassword(adminName);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 sm:p-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-4">
            <HardDrive className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            PUTREK FILE
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Storage Cloud Pribadi Terenkripsi · Kapasitas 1,000 TB
          </p>
        </div>

        {/* Preset Selector */}
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Pilih Aksun Admin
            </span>
            <span>2 Akses Resmi</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdminPreset('LUDIRO')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                username.toUpperCase() === 'LUDIRO'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span>Admin LUDIRO</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminPreset('PUTRI')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                username.toUpperCase() === 'PUTRI'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span>Admin PUTRI</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Login Gagal</p>
              <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username Admin / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="LUDIRO atau PUTRI"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Tampilkan atau sembunyikan password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memverifikasi Otentikasi...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Masuk Ke PUTREK FILE <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Single Source of Truth: Firebase Firestore</span>
          </div>
        </div>
      </div>
    </div>
  );
};
