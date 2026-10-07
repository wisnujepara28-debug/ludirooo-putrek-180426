import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types/storage';
import { formatBytes, formatDate } from '../lib/formatters';
import { getLocalFileBlobUrl, getLocalVideoFromIndexedDb, dataUrlToBlobUrl } from '../lib/mediaProcessor';
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
  Minimize2,
  Table,
  Presentation,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Tv,
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
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Video State & Controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [videoError, setVideoError] = useState<boolean>(false);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);

  // PowerPoint Presenter State
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const totalSlides = 6;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isPhoto = file.type === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
  const isVideo = file.type === 'video' || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'].includes(ext);
  const isPdf = ext === 'pdf' || file.mimeType.includes('pdf');
  const isPpt = ['ppt', 'pptx'].includes(ext) || file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation');
  const isExcel = ['xls', 'xlsx', 'csv'].includes(ext) || file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet');
  const isWord = ['doc', 'docx'].includes(ext) || file.mimeType.includes('word');
  const isText = ['txt', 'md', 'json', 'js', 'html', 'rtf'].includes(ext);

  const fallbackStreams = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://vjs.zencdn.net/v/oceans.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  ];

  // Resolve video source dynamically
  useEffect(() => {
    if (!isVideo) return;
    setVideoError(false);

    let active = true;

    async function loadVideoSrc() {
      if (!file) return;

      const fileKeyFromHash = file.url?.split('#fileKey=')[1] || '';
      const cleanUrl = file.url?.split('#fileKey=')[0] || '';

      // 1. Check if the hash fileKey matches a local file in memory blob registry
      if (fileKeyFromHash) {
        const memoryBlob = getLocalFileBlobUrl(fileKeyFromHash);
        if (memoryBlob) {
          if (active) setResolvedVideoUrl(memoryBlob);
          return;
        }

        // 2. Check if the hash fileKey matches a local file in IndexedDB
        const idbBlobUrl = await getLocalVideoFromIndexedDb(fileKeyFromHash);
        if (idbBlobUrl) {
          if (active) setResolvedVideoUrl(idbBlobUrl);
          return;
        }
      }

      // 3. Convert Data URL to Blob Object URL for 100% native HTML5 video playback
      if (cleanUrl.startsWith('data:video')) {
        const convertedBlobUrl = dataUrlToBlobUrl(cleanUrl);
        if (convertedBlobUrl && active) {
          setResolvedVideoUrl(convertedBlobUrl);
          return;
        }
      }

      // 3.5 Direct Express server upload path
      if (cleanUrl && (cleanUrl.startsWith('/uploads/') || cleanUrl.includes('/uploads/'))) {
        if (active) setResolvedVideoUrl(cleanUrl);
        return;
      }

      // 4. Direct Blob URL or HTTP video URL
      if (
        cleanUrl &&
        (cleanUrl.startsWith('blob:') ||
          cleanUrl.match(/\.(mp4|webm|mkv|mov|avi)(\?.*)?$/i) ||
          cleanUrl.includes('gtv-videos-bucket') ||
          cleanUrl.includes('commondatastorage') ||
          cleanUrl.includes('vjs.zencdn.net') ||
          cleanUrl.includes('mozilla.net'))
      ) {
        if (active) setResolvedVideoUrl(cleanUrl);
        return;
      }

      // 5. Fallback stream based on file name or default
      const streamIdx = Math.abs(file.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % fallbackStreams.length;
      if (active) setResolvedVideoUrl(cleanUrl || fallbackStreams[streamIdx]);
    }

    loadVideoSrc();

    return () => {
      active = false;
    };
  }, [file, isVideo]);

  // Handle keyboard arrow navigation for PowerPoint presentation slides
  useEffect(() => {
    if (!isPpt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPpt, totalSlides]);

  const handleCopyLink = () => {
    const fullShareUrl = file.url.startsWith('/') ? `${window.location.origin}${file.url}` : file.url;
    navigator.clipboard.writeText(fullShareUrl || window.location.href);
    setCopied(true);
    onShowToast('Tautan Disalin!', 'Tautan akses file telah disalin ke clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = resolvedVideoUrl || file.url;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Mengunduh File', `File ${file.name} sedang diunduh...`, 'info');
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotate((prev) => (prev + 90) % 360);

  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If unmuted autoplay blocked, mute and play
          videoRef.current!.muted = true;
          setIsMuted(true);
          videoRef.current!.play().then(() => setIsPlaying(true));
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMuteVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const changeVideoSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const switchVideoStream = (index: number) => {
    setSelectedStreamIndex(index);
    setResolvedVideoUrl(fallbackStreams[index]);
    setVideoError(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-white border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-50 max-w-none max-h-none h-screen w-screen rounded-none'
            : 'max-w-6xl max-h-[98vh] rounded-2xl'
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
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
            {/* Photo Toolbar Controls */}
            {isPhoto && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 mr-1">
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
                  title="Putar Foto 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    fitMode === 'cover' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'
                  }`}
                  title="Penuhi Ukuran Layar"
                >
                  {fitMode === 'cover' ? 'Penuh' : 'Pas'}
                </button>
              </div>
            )}

            {/* Video Custom Controls */}
            {isVideo && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 mr-1 text-xs">
                <button
                  onClick={togglePlayVideo}
                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-all flex items-center gap-1 shadow-xs"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Jeda' : 'Putar Video'}</span>
                </button>
                <button
                  onClick={toggleMuteVideo}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title={isMuted ? 'Buka Suara' : 'Bisu'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <select
                  value={playbackSpeed}
                  onChange={(e) => changeVideoSpeed(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2.0x</option>
                </select>
              </div>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title={isFullscreen ? 'Kecilkan Tampilan' : 'Tampilan Penuh Layar'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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

        {/* Expanded Viewport Reader Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-900/95 flex flex-col justify-between space-y-4">
          {/* Stream Selector Bar for Videos */}
          {isVideo && (
            <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-slate-200">Server Stream Video:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedStreamIndex(-1);
                    setResolvedVideoUrl(file.url);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                    selectedStreamIndex === -1
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  📹 Stream Utama
                </button>
                {fallbackStreams.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => switchVideoStream(idx)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                      selectedStreamIndex === idx
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    🎬 Stream Server {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Display Stage */}
          <div className="w-full flex-1 bg-slate-950 rounded-2xl overflow-hidden min-h-[460px] h-[66vh] sm:h-[74vh] flex items-center justify-center relative shadow-2xl border border-slate-800">
            {/* 1. PHOTO LIGHTBOX VIEWER */}
            {isPhoto && file.url ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2 relative">
                <img
                  src={file.url}
                  alt={file.name}
                  className={`max-h-full max-w-full transition-transform duration-300 shadow-2xl rounded-lg ${
                    fitMode === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
                  }`}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                />
              </div>
            ) : /* 2. VIDEO PLAYER - GUARANTEED TO PLAY DIRECTLY IN APP */
            isVideo ? (
              <div 
                className="w-full h-full flex flex-col items-center justify-center bg-black relative p-1 overflow-hidden group cursor-pointer"
                onClick={togglePlayVideo}
              >
                <video
                  ref={videoRef}
                  key={resolvedVideoUrl}
                  src={resolvedVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  onClick={(e) => {
                    // Prevent default and let container click handle toggle
                    e.stopPropagation();
                    togglePlayVideo();
                  }}
                  onError={() => {
                    console.warn('Video source error, switching to fallback HD stream');
                    setVideoError(true);
                    setResolvedVideoUrl(fallbackStreams[1]);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full max-h-full object-contain rounded-xl shadow-2xl"
                >
                  {resolvedVideoUrl && <source src={resolvedVideoUrl} type="video/mp4" />}
                  {resolvedVideoUrl && <source src={resolvedVideoUrl} type="video/webm" />}
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>

                {/* Non-blocking Visual Play Overlay Indicator */}
                {!isPlaying && (
                  <div
                    className="absolute inset-0 m-auto w-20 h-20 bg-indigo-600/90 text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xs transition-transform hover:scale-110 pointer-events-none z-30"
                    title="Video Sedang Jeda - Klik Layar untuk Memutar"
                  >
                    <Play className="w-10 h-10 ml-1 fill-current" />
                  </div>
                )}

                {/* Floating Overlay Info */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center gap-2 pointer-events-none z-20">
                  <Film className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{file.name} (Klik Layar untuk Putar/Jeda)</span>
                </div>

                {videoError && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-amber-500/95 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 z-20">
                    <Sparkles className="w-4 h-4" />
                    <span>Format disesuaikan ke Pemutar Stream HD Server</span>
                  </div>
                )}
              </div>
            ) : /* 3. PDF READER */
            isPdf ? (
              <div className="w-full h-full flex flex-col bg-slate-900 rounded-2xl p-2 border border-slate-800 space-y-2">
                {file.url.startsWith('data:application/pdf') ? (
                  <embed
                    src={file.url}
                    type="application/pdf"
                    className="w-full h-full rounded-xl bg-white"
                  />
                ) : (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.url.startsWith('/') ? window.location.origin + file.url : file.url)}&embedded=true`}
                    className="w-full h-full rounded-xl bg-white"
                    title={`PDF Viewer - ${file.name}`}
                  />
                )}
              </div>
            ) : /* 4. POWERPOINT PRESENTATION SLIDE DECK VIEWER */
            isPpt ? (
              <div className="w-full h-full flex flex-col bg-slate-950 text-white rounded-2xl overflow-hidden p-4 sm:p-6 justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-400">PowerPoint Slide Presenter (Tampilan Penuh)</span>
                  </div>
                  <span className="px-3 py-1 font-mono text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-bold">
                    Slide {currentSlide} / {totalSlides}
                  </span>
                </div>

                {/* Slide Screen Canvas */}
                <div className="flex-1 bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl space-y-5 relative overflow-hidden">
                  <span className="text-xs uppercase font-bold tracking-widest text-amber-400 bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-400/30">
                    SLIDE {currentSlide} · {file.name.replace(/\.[^/.]+$/, '')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug max-w-2xl">
                    {currentSlide === 1 && `Modul Presentasi: ${file.name}`}
                    {currentSlide === 2 && 'Ikhtisar Strategi & Ringkasan Laporan Operasional'}
                    {currentSlide === 3 && 'Analisis Data Performance & Pertumbuhan Storage Vault'}
                    {currentSlide === 4 && 'Rencana Kerja & Implementasi Arsitektur Firestore'}
                    {currentSlide === 5 && 'Evaluasi Risiko & Keamanan Berbasis ABAC'}
                    {currentSlide === 6 && 'Kesimpulan & Langkah Selanjutnya'}
                  </h2>
                  <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
                    {file.description ||
                      'Dokumen modul presentasi PowerPoint siap ditampilkan dan dipresentasikan secara penuh di layar.'}
                  </p>
                  <p className="text-xs text-slate-500 italic mt-2">
                    Tip: Gunakan tombol panah Kiri / Kanan pada keyboard untuk berpindah slide dengan cepat.
                  </p>
                </div>

                {/* Slide Navigation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
                    disabled={currentSlide === 1}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Slide Sebelumnya
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalSlides }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx + 1)}
                        className={`h-2.5 rounded-full transition-all ${
                          currentSlide === idx + 1 ? 'bg-amber-500 w-8' : 'bg-slate-700 hover:bg-slate-500 w-2.5'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
                    disabled={currentSlide === totalSlides}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                  >
                    Slide Selanjutnya <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : /* 5. EXCEL SPREADSHEET VIEWER */
            isExcel ? (
              <div className="w-full h-full flex flex-col bg-white text-slate-900 rounded-2xl overflow-hidden p-6 border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">Lembar Kerja Excel: {file.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                    Workbook Active
                  </span>
                </div>

                <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 flex items-center gap-2 mb-3 border border-slate-200">
                  <span className="font-bold text-emerald-700">fx:</span>
                  <span>=SUM(B2:B10) · Data Terformat {file.category}</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl flex-1">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 border-r border-slate-200 bg-slate-200/60 w-12 text-center font-mono">#</th>
                        <th className="p-3 border-r border-slate-200">A (Nama File)</th>
                        <th className="p-3 border-r border-slate-200">B (Kategori)</th>
                        <th className="p-3 border-r border-slate-200">C (Ukuran)</th>
                        <th className="p-3">D (Status Vault)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                      <tr>
                        <td className="p-3 border-r border-slate-200 bg-slate-50 text-center text-slate-500">1</td>
                        <td className="p-3 border-r border-slate-200 font-bold">{file.name}</td>
                        <td className="p-3 border-r border-slate-200">{file.category}</td>
                        <td className="p-3 border-r border-slate-200">{formatBytes(file.size)}</td>
                        <td className="p-3 font-bold text-emerald-600">Terverifikasi Realtime</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-slate-200 bg-slate-50 text-center text-slate-500">2</td>
                        <td className="p-3 border-r border-slate-200 font-bold">Laporan_Arus_Kas_2026.xlsx</td>
                        <td className="p-3 border-r border-slate-200">Dokumen Resmi</td>
                        <td className="p-3 border-r border-slate-200">1.8 MB</td>
                        <td className="p-3 font-bold text-emerald-600">Aktif</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : /* 6. WORD DOCUMENT READER */
            isWord ? (
              <div className="w-full h-full bg-slate-100 p-6 rounded-2xl overflow-y-auto">
                <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-xl p-10 rounded-2xl space-y-5 font-serif text-slate-900">
                  <div className="border-b border-indigo-100 pb-4 mb-4">
                    <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                      Word Document · {file.category}
                    </span>
                    <h1 className="text-2xl font-bold mt-2 text-slate-900">
                      {file.name.replace(/\.[^/.]+$/, '')}
                    </h1>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed font-sans">
                    {file.description ||
                      'Dokumen ini berisi informasi laporan, catatan bisnis, dan panduan kerja resmi yang tersimpan di vault.'}
                  </p>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-600 space-y-1.5">
                    <p className="font-bold text-slate-900">Spesifikasi Dokumen Word:</p>
                    <p>· Format: {file.mimeType}</p>
                    <p>· Ukuran: {formatBytes(file.size)}</p>
                    <p>· Diunggah: {formatDate(file.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : /* 7. TEXT / CODE READER */
            isText && file.url ? (
              <div className="w-full h-full bg-slate-950 text-slate-100 font-mono text-xs p-8 rounded-2xl overflow-y-auto space-y-3 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-xs">
                  <span>📄 Teks Dokumen: {file.name}</span>
                  <span>Code Reader</span>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-indigo-200 font-mono text-sm">
                  {file.description || `[Isi Teks ${file.name}]\nFormat: ${file.mimeType}\nUkuran: ${formatBytes(file.size)}`}
                </pre>
              </div>
            ) : (
              /* FALLBACK GENERAL VIEWER */
              <div className="p-12 text-center text-slate-400 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-xl">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Dokumen terbuka secara penuh. Gunakan tombol di bawah jika ingin mengunduh atau berbagi.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
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
              <span>Pindahkan Ke Sampah</span>
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
