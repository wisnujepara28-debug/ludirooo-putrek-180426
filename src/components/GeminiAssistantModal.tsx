import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FileItem } from '../types/storage';
import { Sparkles, X, Send, Bot, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  files,
}) => {
  if (!isOpen) return null;

  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeFiles = files.filter((f) => !f.inTrash);

  const handleAskAI = async (queryText?: string) => {
    const userQuery = queryText || prompt;
    if (!userQuery.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      const filesContext = activeFiles
        .map(
          (f, idx) =>
            `${idx + 1}. Nama: ${f.name} | Tipe: ${f.type} | Kategori: ${f.category} | Tag: ${f.tags.join(', ')} | Size: ${f.size} B | Deskripsi: ${f.description || '-'}`
        )
        .join('\n');

      const systemPrompt = `Anda adalah Asisten Cerdas AwanData Vault Storage. 
Daftar file aktif di database user saat ini adalah:
${filesContext}

Tugas Anda: Berikan jawaban yang ramah, profesional, dan ringkas dalam bahasa Indonesia sesuai pertanyaan pengguna tentang file, dokumen, atau pengorganisasian storage vault mereka.`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nPertanyaan Pengguna: ${userQuery}` }] },
        ],
      });

      setResponse(aiResponse.text || 'Tidak dapat menghasilkan tanggapan dari Gemini.');
    } catch (err) {
      console.error('Gemini API Error:', err);
      setResponse(
        'Maaf, terjadi kendala saat terhubung dengan layanan Gemini AI. Pastikan API key dikonfigurasi di Secrets.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Rangkum kategori file dan jumlah dokumen penting di vault saya',
    'Sarankan tag pengelompokan yang lebih rapi untuk foto dan video',
    'Mana file terbesar yang tersimpan saat ini?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Vault Assistant</h3>
              <p className="text-xs text-slate-500">
                Analisis Cerdas File & Rekomendasi Pengorganisasian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup AI Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Quick Prompts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Contoh Pertanyaan Cepat:
            </span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleAskAI(p);
                  }}
                  className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition-all text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Output */}
          {isLoading && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Gemini AI sedang menganalisis file di vault Anda...
              </p>
            </div>
          )}

          {response && !isLoading && (
            <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>Hasil Analisis Gemini AI:</span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Footer Input */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              placeholder="Tanyakan sesuatu tentang file atau dokumen di vault Anda..."
              className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleAskAI()}
              disabled={isLoading || !prompt.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
