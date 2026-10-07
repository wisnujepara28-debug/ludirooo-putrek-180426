import React, { useState } from 'react';
import { FileItem } from '../types/storage';
import { formatBytes, formatDate } from '../lib/formatters';
import {
  X,
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
  Film,
  Calendar,
  HardDrive,
  Tag,
  Folder,
  Check,
  Star,
  Trash2,
  Edit2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Table,
  Presentation,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onEdit: (file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
  onMoveToTrash: (file: FileItem) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onEdit,
  onToggleFavorite,
  onMoveToTrash,
  onShowToast,
}) => {
  if (!file) return null;

  const [copied, setCopied] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotate] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Slide Deck Presenter state for PPT/PPTX
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const totalSlides = 5;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isPhoto = file.type === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
  const isVideo = file.type === 'video' || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
  const isPdf = ext === 'pdf' || file.mimeType.includes('pdf');
  const isPpt = ['ppt', 'pptx'].includes(ext) || file.mimeType.includes('powerpoint');
  const isExcel = ['xls', 'xlsx', 'csv'].includes(ext) || file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet');
  const isWord = ['doc', 'docx'].includes(ext) || file.mimeType.includes('word');
  const isText = ['txt', 'md', 'json', 'js', 'html', 'rtf'].includes(ext);

  // Checks if URL points to an image
  const isImageUrl = file.url.startsWith('data:image') || file.url.includes('unsplash.com') || file.url.match(/\.(jpg|jpeg|png|webp|gif|svg)/i);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(file.url || window.location.href);
    setCopied(true);
    onShowToast('Tautan Disalin!', 'Tautan akses file telah disalin ke clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Mengunduh File', `File ${file.name} sedang diunduh...`, 'info');
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotate((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all ${
          isFullscreen ? 'fixed inset-2 z-50 max-w-none max-h-none h-[calc(100vh-16px)]' : 'max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              {isPhoto ? (
                <ImageIcon className="w-5 h-5 text-emerald-600" />
              ) : isVideo ? (
                <Film className="w-5 h-5 text-amber-600" />
              ) : isPpt ? (
                <Presentation className="w-5 h-5 text-amber-600" />
              ) : isExcel ? (
                <Table className="w-5 h-5 text-emerald-600" />
              ) : (
                <FileText className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-indigo-600">{file.category}</span>
                <span>·</span>
                <span className="font-mono">{formatBytes(file.size)}</span>
                <span>·</span>
                <span className="uppercase text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                  {ext || file.type}
                </span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Image Toolbar Controls */}
            {isPhoto && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 mr-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-600 px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="Putar Foto 90 Derajat"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title={isFullscreen ? 'Kecilkan Tampilan' : 'Layar Penuh'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleFavorite(file)}
              className={`p-2 rounded-xl border transition-colors ${
                file.isFavorite
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Favorit"
            >
              <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tutup preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewport Reader */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Direct File Viewers */}
          <div className="w-full bg-slate-950 rounded-2xl overflow-hidden min-h-[340px] max-h-[580px] flex items-center justify-center relative shadow-inner">
            {/* 1. PHOTO LIGHTBOX VIEWER */}
            {isPhoto && file.url ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-h-[500px] w-auto object-contain transition-transform duration-200 shadow-2xl rounded-lg"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                />
              </div>
            ) : /* 2. VIDEO PLAYER */
            isVideo && file.url ? (
              <div className="w-full h-full flex items-center justify-center bg-black p-1">
                {file.url.startsWith('data:image') || isImageUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={file.url} alt={file.name} className="max-h-[500px] w-auto object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-center p-4">
                      <div>
                        <Film className="w-12 h-12 mx-auto mb-2 text-amber-400" />
                        <p className="text-sm font-bold">{file.name}</p>
                        <p className="text-xs text-slate-300 mt-1">Pratinjau Video Aktif</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video
                    src={file.url}
                    controls
                    autoPlay
                    playsInline
                    controlsList="nodownload"
                    className="max-h-[500px] w-full rounded-xl"
                  >
                    Browser Anda tidak mendukung pemutar video HTML5.
                  </video>
                )}
              </div>
            ) : /* 3. PDF READER */
            isPdf ? (
              <div className="w-full h-full flex flex-col bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 overflow-y-auto">
                {file.url.startsWith('data:application/pdf') ? (
                  <embed
                    src={file.url}
                    type="application/pdf"
                    className="w-full h-[500px] rounded-xl bg-white"
                  />
                ) : isImageUrl ? (
                  <div className="p-4 bg-white rounded-xl shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 text-xs text-slate-700">
                      <span className="font-bold flex items-center gap-1.5 text-rose-600">
                        <FileText className="w-4 h-4" /> Dokumen PDF: {file.name}
                      </span>
                      <span>Halaman 1 / 1</span>
                    </div>
                    <img src={file.url} alt={file.name} className="max-h-[400px] w-auto mx-auto object-contain rounded border" />
                  </div>
                ) : (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`}
                    className="w-full h-[500px] rounded-xl bg-white"
                    title={`PDF Viewer - ${file.name}`}
                  />
                )}
              </div>
            ) : /* 4. POWERPOINT PRESENTATION SLIDE DECK VIEWER */
            isPpt ? (
              <div className="w-full h-full flex flex-col bg-slate-900 text-white rounded-2xl overflow-hidden p-4 sm:p-6 justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-400">PowerPoint Slide Presenter</span>
                  </div>
                  <span className="px-2.5 py-0.5 font-mono text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-bold">
                    Slide {currentSlide} / {totalSlides}
                  </span>
                </div>

                {/* Slide Screen Canvas */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xl space-y-4 my-2 overflow-hidden relative">
                  {isImageUrl ? (
                    <div className="relative w-full max-h-[360px] overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30 mb-2">
                          SLIDE {currentSlide} · {file.name.replace(/\.[^/.]+$/, '')}
                        </span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight max-w-lg">
                          {currentSlide === 1 && `Modul Presentasi: ${file.name}`}
                          {currentSlide === 2 && 'Ikhtisar Strategi & Ringkasan Laporan'}
                          {currentSlide === 3 && 'Analisis Data & Pertumbuhan Kinerja'}
                          {currentSlide === 4 && 'Rencana Operasional & Rincian Vault'}
                          {currentSlide === 5 && 'Kesimpulan & Langkah Selanjutnya'}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
                        SLIDE {currentSlide} · {file.name.replace(/\.[^/.]+$/, '')}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight max-w-lg">
                        {currentSlide === 1 && `Modul Presentasi: ${file.name}`}
                        {currentSlide === 2 && 'Ikhtisar Strategi & Ringkasan Laporan'}
                        {currentSlide === 3 && 'Analisis Data & Pertumbuhan Kinerja'}
                        {currentSlide === 4 && 'Rencana Operasional & Rincian Vault'}
                        {currentSlide === 5 && 'Kesimpulan & Langkah Selanjutnya'}
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                        {file.description ||
                          'Dokumen modul presentasi PowerPoint siap ditampilkan dan dipresentasikan langsung di layar.'}
                      </p>
                    </>
                  )}
                </div>

                {/* Slide Navigation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
                    disabled={currentSlide === 1}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Slide Sebelumnya
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSlides }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx + 1)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentSlide === idx + 1 ? 'bg-amber-500 w-6' : 'bg-slate-700 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
                    disabled={currentSlide === totalSlides}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center gap-1 shadow-md"
                  >
                    Slide Selanjutnya <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : /* 5. EXCEL SPREADSHEET VIEWER */
            isExcel ? (
              <div className="w-full h-full flex flex-col bg-white text-slate-900 rounded-2xl overflow-hidden p-4 sm:p-6 border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">Lembar Kerja Excel: {file.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                    Workbook Active
                  </span>
                </div>

                <div className="p-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 flex items-center gap-2 mb-3 border border-slate-200">
                  <span className="font-bold text-emerald-700">fx:</span>
                  <span>=SUM(B2:B10) · Data Terformat {file.category}</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 border-r border-slate-200 bg-slate-200/60 w-10 text-center font-mono">#</th>
                        <th className="p-2 border-r border-slate-200">A (Nama File)</th>
                        <th className="p-2 border-r border-slate-200">B (Kategori)</th>
                        <th className="p-2 border-r border-slate-200">C (Ukuran)</th>
                        <th className="p-2">D (Status)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                      <tr>
                        <td className="p-2 border-r border-slate-200 bg-slate-50 text-center text-slate-500">1</td>
                        <td className="p-2 border-r border-slate-200 font-bold">{file.name}</td>
                        <td className="p-2 border-r border-slate-200">{file.category}</td>
                        <td className="p-2 border-r border-slate-200">{formatBytes(file.size)}</td>
                        <td className="p-2 font-bold text-emerald-600">Terverifikasi</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-200 bg-slate-50 text-center text-slate-500">2</td>
                        <td className="p-2 border-r border-slate-200 font-bold">Laporan_Arus_Kas_2026.xlsx</td>
                        <td className="p-2 border-r border-slate-200">Dokumen Resmi</td>
                        <td className="p-2 border-r border-slate-200">1.8 MB</td>
                        <td className="p-2 font-bold text-emerald-600">Nominal Nominal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : /* 6. WORD DOCUMENT READER */
            isWord ? (
              <div className="w-full h-full bg-slate-100 p-4 sm:p-6 rounded-2xl overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-md p-8 rounded-2xl space-y-4 font-serif text-slate-900">
                  <div className="border-b border-indigo-100 pb-3 mb-4">
                    <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Word Document · {file.category}
                    </span>
                    <h2 className="text-xl font-bold mt-2 text-slate-900">
                      {file.name.replace(/\.[^/.]+$/, '')}
                    </h2>
                  </div>

                  {isImageUrl && (
                    <img src={file.url} alt={file.name} className="max-h-[300px] w-auto mx-auto rounded-lg shadow-sm mb-4" />
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {file.description ||
                      'Dokumen ini berisi informasi laporan, catatan bisnis, dan panduan kerja resmi yang tersimpan di vault.'}
                  </p>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">Spesifikasi Dokumen Word:</p>
                    <p>· Mime Type: {file.mimeType}</p>
                    <p>· Ukuran File: {formatBytes(file.size)}</p>
                    <p>· Tanggal Dibuat: {formatDate(file.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : /* 7. TEXT / CODE READER */
            isText && file.url ? (
              <div className="w-full h-full bg-slate-900 text-slate-100 font-mono text-xs p-6 rounded-2xl overflow-y-auto space-y-2 border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>📄 Teks Dokumen: {file.name}</span>
                  <span>Code Reader</span>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-indigo-200">
                  {file.description || `[Isi Teks ${file.name}]\nFormat: ${file.mimeType}\nUkuran: ${formatBytes(file.size)}`}
                </pre>
              </div>
            ) : (
              /* FALLBACK GENERAL VIEWER */
              <div className="p-8 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Dokumen terbuka. Gunakan tombol unduh di bawah jika ingin mengunduh salinan.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Informasi & Spesifikasi File
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-slate-400" /> Kategori
                  </span>
                  <span className="font-semibold text-slate-900">{file.category}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Ukuran File
                  </span>
                  <span className="font-mono text-slate-900">{formatBytes(file.size)} ({file.size.toLocaleString()} B)</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Diunggah
                  </span>
                  <span className="font-mono text-slate-900">{formatDate(file.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> MIME Format
                  </span>
                  <span className="font-mono text-slate-900 text-[11px]">{file.mimeType}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Catatan Deskripsi & Tag
              </h4>

              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 min-h-[60px]">
                {file.description || 'Tidak ada catatan deskripsi tambahan.'}
              </p>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Tag Terdaftar:
                </span>
                <div className="flex flex-wrap gap-1">
                  {file.tags.length > 0 ? (
                    file.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Tanpa tag</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(file);
              }}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Metadata</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onMoveToTrash(file);
              }}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus File</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin!' : 'Bagikan Link'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
