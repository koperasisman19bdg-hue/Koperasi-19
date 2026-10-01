import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  Wifi,
  CloudCheck,
  ShieldCheck,
  ExternalLink,
  X,
  Layers,
  ArrowRight,
  Monitor
} from 'lucide-react';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import { StorageService } from '../utils/storage';

interface DeviceIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceIntegrationModal: React.FC<DeviceIntegrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Detect environment
    const ua = navigator.userAgent || '';
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(ua);
    const isDesktopDevice = !isIosDevice && !isAndroidDevice;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isDesktopDevice);

    // Check if already in standalone display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error triggering PWA install:', err);
    }
  };

  if (!isOpen) return null;

  const pengaturan = StorageService.getPengaturan();
  const currentLogo = pengaturan.logoUrl || defaultLogoImg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-emerald-400/40">
              <img
                src={currentLogo}
                alt="Logo Koperasi"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                  PWA Multi-Device
                </span>
                <span className="text-[10px] text-emerald-200">Terintegrasi 100%</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Akses Fleksibel di Laptop & HP
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-700 text-xs">
          {/* Status Badge */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Aplikasi Sudah Terpasang (Standalone)</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Aplikasi sedang berjalan mandiri di perangkat Anda tanpa bilah peramban, memberikan pengalaman seperti aplikasi bawaan (native).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Pasang ke Layar Utama</h4>
                  <p className="text-[11px] text-slate-500">
                    Buka instan tanpa mengetik URL, hemat kuota, dan responsif.
                  </p>
                </div>
              </div>

              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Pasang Sekarang</span>
                </button>
              )}
            </div>
          )}

          {/* Panduan Instalasi Sesuai Perangkat */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Panduan Akses Cepat di Berbagai Perangkat:</span>
            </h4>

            {/* 1. Akses di HP Android */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>1. Smartphone Android (Google Chrome / Samsung Internet)</span>
                </div>
                {isAndroid && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Perangkat Anda</span>}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
                <li>Buka aplikasi di peramban Chrome pada HP Anda.</li>
                <li>Ketuk ikon titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.</li>
                <li>Pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Pasang Aplikasi"</strong>.</li>
                <li>Ikon Koperasi Warga Bahagia akan muncul di menu HP Anda dan dapat diakses dengan 1 ketukan!</li>
              </ol>
            </div>

            {/* 2. Akses di HP iPhone / iPad */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Share className="w-4 h-4 text-blue-600" />
                  <span>2. iPhone & iPad (Apple Safari)</span>
                </div>
                {isIOS && <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Perangkat Anda</span>}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
                <li>Buka aplikasi menggunakan peramban <strong>Safari</strong> di iPhone/iPad.</li>
                <li>Ketuk tombol <strong>Bagikan</strong> (ikon kotak dengan panah ke atas di bilah bawah).</li>
                <li>Gulir ke bawah dan ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                <li>Aplikasi akan terpasang di homescreen iOS Anda dengan tampilan layar penuh tanpa URL bar.</li>
              </ol>
            </div>

            {/* 3. Akses di Laptop / Komputer Desktop */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Laptop className="w-4 h-4 text-teal-600" />
                  <span>3. Laptop / Komputer Desktop (Chrome, Edge, Mac/Windows)</span>
                </div>
                {isDesktop && <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Perangkat Anda</span>}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
                <li>Di peramban Chrome atau Edge pada laptop, perhatikan bilah alamat (address bar) di sebelah kanan.</li>
                <li>Klik ikon <strong>Pasang (Install / ⊕)</strong> yang berada di sebelah ikon bintang penanda.</li>
                <li>Atau klik titik tiga menu browser &gt; <strong>"Pasang Koperasi Warga Bahagia"</strong>.</li>
                <li>Aplikasi langsung dapat dibuka dari Taskbar Windows, Desktop, atau Launchpad Mac!</li>
              </ol>
            </div>
          </div>

          {/* Fitur Integrasi Realtime Multi-Perangkat */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Sinkronisasi Otomatis Antar Perangkat:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Seluruh data transaksi, simpanan, pinjaman, jurnal umum, serta laporan keuangan tersinkronisasi otomatis via server. Input data di laptop saat rapat, lalu pantau langsung dari HP di mana saja secara <strong>real-time</strong>!
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-teal-300 shrink-0" />
                <span className="text-[10px] text-slate-200">Laptop: Rekap & Cetak PDF</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="text-[10px] text-slate-200">HP: Input Cepat & Cek Saldo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
