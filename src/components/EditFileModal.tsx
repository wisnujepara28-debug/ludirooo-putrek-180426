import React, { useState, useEffect } from 'react';
import { FileItem } from '../types/storage';
import { validateFileInput } from '../lib/formatters';
import { Edit3, X, AlertCircle, CheckCircle2, Tag } from 'lucide-react';

interface EditFileModalProps {
  file: FileItem | null;
  onClose: () => void;
  onSave: (
    fileId: string,
    updates: { name: string; category: string; tags: string[]; description: string }
  ) => Promise<void>;
}

export const EditFileModal: React.FC<EditFileModalProps> = ({ file, onClose, onSave }) => {
  if (!file) return null;

  const [name, setName] = useState<string>(file.name);
  const [category, setCategory] = useState<string>(file.category);
  const [tagsInput, setTagsInput] = useState<string>(file.tags.join(', '));
  const [description, setDescription] = useState<string>(file.description);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (file) {
      setName(file.name);
      setCategory(file.category);
      setTagsInput(file.tags.join(', '));
      setDescription(file.description);
      setValidationError(null);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const valResult = validateFileInput({
      name,
      category,
      description,
    });

    if (!valResult.isValid) {
      setValidationError(valResult.error || 'Validasi pembaruan gagal.');
      return;
    }

    const tagsList = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSaving(true);
    try {
      await onSave(file.id, {
        name: name.trim(),
        category: category.trim() || 'Lainnya',
        tags: tagsList,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal memperbarui file.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Metadata File</h3>
              <p className="text-xs text-slate-500">
                Pembaruan Langsung Ke Firestore Database
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
              <p className="font-bold">Kesalahan Validasi</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama File <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Kerja">Kerja</option>
              <option value="Dokumen Resmi">Dokumen Resmi</option>
              <option value="Media">Media</option>
              <option value="Pribadi">Pribadi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Tag (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Kerja, Laporan, 2026"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Catatan
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Catatan tambahan mengenai isi file..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
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
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
