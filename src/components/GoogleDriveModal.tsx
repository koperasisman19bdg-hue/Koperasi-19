import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  LogOut,
  UploadCloud,
  DownloadCloud,
  X,
  FileSpreadsheet,
  Smartphone,
  Laptop,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  getDriveSyncStatus,
  signInWithGoogleDrive,
  signOutFromGoogleDrive,
  syncWithGoogleDrive,
  pushDatabaseToGoogleDrive,
  pullDatabaseFromGoogleDrive,
  DriveSyncStatus,
  DRIVE_DATABASE_FILENAME
} from '../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<DriveSyncStatus>(() => getDriveSyncStatus());
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusChange = (e: any) => {
      if (e.detail) {
        setStatus(e.detail);
      } else {
        setStatus(getDriveSyncStatus());
      }
    };

    window.addEventListener('kwb-drive-status-changed', handleStatusChange);
    return () => {
      window.removeEventListener('kwb-drive-status-changed', handleStatusChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await signInWithGoogleDrive();
      setActionSuccess('Berhasil terhubung ke Google Drive! Berkas database telah disinkronkan.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal masuk ke Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memutuskan sambungan akun Google Drive? Data lokal aplikasi tetap aman.')) {
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      await signOutFromGoogleDrive();
      setActionSuccess('Akun Google Drive berhasil diputuskan.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal memutuskan akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPush = async () => {
    if (!window.confirm('Simpan dan perbarui data saat ini ke Google Drive? Berkas database tunggal di Google Drive akan diperbarui dengan data terbaru.')) {
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      const ok = await pushDatabaseToGoogleDrive(true);
      if (ok) {
        setActionSuccess('Data aplikasi berhasil disimpan ke Google Drive!');
      } else {
        setActionError('Gagal menyimpan data ke Google Drive.');
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPull = async () => {
    if (!window.confirm('Unduh data terbaru dari Google Drive? Data pada perangkat ini akan disinkronkan sesuai data di Google Drive.')) {
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      const ok = await pullDatabaseFromGoogleDrive();
      if (ok) {
        setActionSuccess('Data aplikasi berhasil disinkronkan dari Google Drive!');
      } else {
        setActionError('Gagal mengunduh data dari Google Drive.');
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal mengunduh data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Database Tunggal Google Drive</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                  Multi-Perangkat
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Sinkronisasi terpusat data koperasi antara laptop, PC, dan smartphone (HP)
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {status.isConnected && status.user ? (
            /* Connected View */
            <div className="space-y-4">
              {/* Account Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {status.user.photoURL ? (
                    <img
                      src={status.user.photoURL}
                      alt={status.user.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-emerald-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {status.user.email?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800">
                        {status.user.displayName || 'Akun Google'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terhubung
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{status.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>

              {/* Database File Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-600" />
                    Berkas Database di Google Drive:
                  </span>
                  {status.fileId && (
                    <a
                      href={`https://drive.google.com/file/d/${status.fileId}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Buka di Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Nama Berkas:</span>
                    <span className="font-mono font-medium text-slate-800">{DRIVE_DATABASE_FILENAME}</span>
                  </div>
                  {status.fileId && (
                    <div className="flex justify-between text-slate-600">
                      <span>ID Berkas:</span>
                      <span className="font-mono text-slate-500 text-[11px] truncate max-w-[240px]">
                        {status.fileId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Sinkronisasi Terakhir:</span>
                    <span className="font-medium text-emerald-700">
                      {status.lastSyncedAt ? `${status.lastSyncedAt} WIB` : 'Baru saja'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleManualPush}
                    disabled={isLoading || status.isSyncing}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Kirim & Simpan ke Drive</span>
                  </button>
                  <button
                    onClick={handleManualPull}
                    disabled={isLoading || status.isSyncing}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Ambil Terbaru dari Drive</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Disconnected View -> Official Sign in with Google Button */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Cloud className="w-8 h-8" />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="text-base font-bold text-slate-800">
                  Hubungkan dengan Akun Google
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Gunakan Google Drive sebagai pusat penyimpanan tunggal database koperasi Anda agar semua perangkat (laptop dan HP) dapat melihat dan menginput data bersama secara real-time.
                </p>
              </div>

              {/* Official Google Sign-In Button (per SKILL.md styling) */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <span>{isLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Guide Section: How Multi-Device works with Google Drive */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
            <span className="font-semibold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Cara Kerja Sinkronisasi Multi-Perangkat (Laptop & HP):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600">
              <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-start gap-2">
                <Laptop className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-800">Di Laptop / Komputer:</span>
                  <p className="text-[11px] mt-0.5">Input transaksi, simpanan, atau jurnal otomatis terkirim dan disimpan ke file database di Google Drive.</p>
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-800">Di Smartphone (HP):</span>
                  <p className="text-[11px] mt-0.5">Buka aplikasi dan login dengan akun Google yang sama untuk langsung melihat dan mengedit data secara real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
