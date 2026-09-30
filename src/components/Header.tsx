import React, { useState, useEffect } from 'react';
import {
  Bell,
  RefreshCw,
  PlusCircle,
  CheckCircle,
  Clock,
  Check,
  X,
  ArrowRight,
  Banknote,
  ShoppingBag,
  LogOut,
  Menu,
  Wifi,
  WifiOff,
  CloudOff,
  Cloud,
  Users,
  Sparkles,
  Radio
} from 'lucide-react';
import { PengajuanPinjaman } from '../types';
import { StorageService } from '../utils/storage';
import { getDriveSyncStatus, DriveSyncStatus } from '../services/googleDriveService';
import { GoogleDriveModal } from './GoogleDriveModal';

interface HeaderProps {
  currentTabName: string;
  pendingLoans: PengajuanPinjaman[];
  onOpenNotifications: () => void;
  onOpenPublicForm?: () => void;
  onResetData?: () => void;
  onDataChanged?: () => void;
  onNavigateToLoan?: (type: 'uang' | 'barang') => void;
  onLogout?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  pendingLoans,
  onOpenNotifications,
  onOpenPublicForm,
  onResetData,
  onDataChanged,
  onNavigateToLoan,
  onLogout,
  onToggleMobileSidebar
}) => {
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<{
    text: string;
    type: 'uang' | 'barang';
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [networkInfo, setNetworkInfo] = useState(() => StorageService.getNetworkStatus());
  const [onlineUsers, setOnlineUsers] = useState<number>(() => StorageService.getOnlineUsersCount());
  const [driveStatus, setDriveStatus] = useState<DriveSyncStatus>(() => getDriveSyncStatus());
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  
  // Realtime floating notification when other operators input/edit data
  const [remoteUpdateToast, setRemoteUpdateToast] = useState<{
    entityName: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const handleDriveChange = (e: any) => {
      if (e.detail) {
        setDriveStatus(e.detail);
      } else {
        setDriveStatus(getDriveSyncStatus());
      }
    };
    const handleNetworkChange = () => {
      const net = StorageService.getNetworkStatus();
      setNetworkInfo(net);
      if (net.onlineUsers) {
        setOnlineUsers(net.onlineUsers);
      }
    };

    const handlePresenceChange = (e: any) => {
      if (e.detail && typeof e.detail.onlineUsers === 'number') {
        setOnlineUsers(e.detail.onlineUsers);
      }
    };

    const handleRemoteChange = (e: any) => {
      if (e.detail && e.detail.entityName) {
        setRemoteUpdateToast({
          entityName: e.detail.entityName,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });

        // Auto dismiss after 3.5 seconds
        setTimeout(() => {
          setRemoteUpdateToast(prev => prev && prev.entityName === e.detail.entityName ? null : prev);
        }, 3500);
      }
    };

    window.addEventListener('kwb-network-status-changed', handleNetworkChange);
    window.addEventListener('kwb-presence-changed', handlePresenceChange);
    window.addEventListener('kwb-remote-change', handleRemoteChange);
    window.addEventListener('kwb-drive-status-changed', handleDriveChange);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    const interval = setInterval(handleNetworkChange, 3000);

    return () => {
      window.removeEventListener('kwb-network-status-changed', handleNetworkChange);
      window.removeEventListener('kwb-presence-changed', handlePresenceChange);
      window.removeEventListener('kwb-remote-change', handleRemoteChange);
      window.removeEventListener('kwb-drive-status-changed', handleDriveChange);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    await StorageService.flushSyncQueue();
    const success = await StorageService.forceSyncFromServer();
    setIsSyncing(false);
    setNetworkInfo(StorageService.getNetworkStatus());

    if (success) {
      setSyncStatus('success');
      if (onDataChanged) {
        onDataChanged();
      }
      setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const pengaturan = StorageService.getPengaturan();
  const unreadCount = pendingLoans.filter(p => !p.dibaca).length;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatRupiah = (num: number = 0) =>
    'Rp ' + Number(num || 0).toLocaleString('id-ID');

  const handleApprove = (loan: PengajuanPinjaman, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = StorageService.approvePengajuan(loan.id, 'Disetujui dari notifikasi pengurus');
    if (result.success) {
      const typeLabel = result.type === 'uang' ? 'Pinjaman Uang' : 'Pinjaman Barang';
      setActionSuccessMessage({
        text: `✓ Pengajuan ${loan.namaAnggota} telah disetujui & otomatis masuk ke tagihan ${typeLabel}!`,
        type: result.type || 'uang'
      });
      if (onDataChanged) {
        onDataChanged();
      }
      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    }
  };

  const handleReject = (loan: PengajuanPinjaman, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.rejectPengajuan(loan.id, 'Belum memenuhi syarat verifikasi');
    if (onDataChanged) {
      onDataChanged();
    }
  };

  return (
    <header className="h-16 px-3 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Zone 1: Hamburger Menu on Mobile + Current Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 tracking-tight truncate">
            {currentTabName}
          </h2>
          <p className="md:hidden text-[10px] text-emerald-700 font-medium truncate">
            {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}
          </p>
        </div>

        <span className="hidden md:inline-block text-xs text-slate-400">·</span>
        <span className="hidden md:inline-block text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}
        </span>
      </div>

      {/* Zone 2: Date & Cooperative info (Desktop/Laptop) */}
      <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>{todayStr}</span>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Remote Live Update Floating Toast Notification */}
        {remoteUpdateToast && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-top duration-300">
            <Radio className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            <span>⚡ {remoteUpdateToast.entityName} diperbarui secara realtime</span>
            <span className="text-[10px] text-emerald-200 font-mono">({remoteUpdateToast.timestamp})</span>
          </div>
        )}

        {/* Live Collaborators / Presence Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 font-medium"
          title={`Sistem Terintegrasi Realtime: ${onlineUsers} pengguna / perangkat sedang aktif terhubung`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="text-[11px] font-bold text-emerald-800">
            {onlineUsers} <span className="hidden lg:inline font-semibold">Online</span>
          </span>
        </div>

        {/* Google Drive Master Database Button */}
        <button
          onClick={() => setIsDriveModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            driveStatus.isConnected
              ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              : 'bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50 border-slate-200'
          }`}
          title={
            driveStatus.isConnected
              ? `Google Drive Aktif (${driveStatus.user?.email || 'Terhubung'}) · Klik untuk mengelola`
              : 'Hubungkan ke Google Drive untuk sinkronisasi multi-perangkat'
          }
        >
          <Cloud className={`w-3.5 h-3.5 ${driveStatus.isConnected ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="text-[11px] sm:text-xs flex items-center gap-1">
            <span className="hidden sm:inline">Google Drive</span>
            {driveStatus.isConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            ) : (
              <span className="text-[10px] text-blue-600 font-normal hidden md:inline">(Sambungkan)</span>
            )}
          </span>
        </button>

        {/* Real-time Cloud Sync Button */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer disabled:opacity-75 ${
            isSyncing
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : networkInfo.status === 'offline'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : syncStatus === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : syncStatus === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          title={`Sistem Realtime: Latensi ${networkInfo.latencyMs}ms · Kompresi & Caching Aktif`}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          ) : networkInfo.status === 'offline' ? (
            <CloudOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <RefreshCw className="w-3 h-3 text-emerald-600 shrink-0" />
            </div>
          )}

          <span className="text-[11px] sm:text-xs">
            {isSyncing ? (
              'Menyinkronkan...'
            ) : networkInfo.status === 'offline' ? (
              <span className="font-bold text-rose-700">Offline</span>
            ) : syncStatus === 'success' ? (
              'Data Sinkron ✓'
            ) : syncStatus === 'error' ? (
              'Coba Sinkron Ulang'
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="hidden md:inline font-medium">Sinkron</span>
                <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">({networkInfo.latencyMs}ms)</span>
              </span>
            )}
          </span>
        </button>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationPopup(!showNotificationPopup);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Notifikasi Pengajuan Peminjaman"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {showNotificationPopup && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotificationPopup(false)}
              />
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-40 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] flex flex-col">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Notifikasi Pengajuan Pinjaman
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                    {pendingLoans.length} Menunggu
                  </span>
                </div>

                {/* Success alert message if approved */}
                {actionSuccessMessage && (
                  <div className="mx-3 my-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in shrink-0">
                    <p className="font-semibold text-[11px]">{actionSuccessMessage.text}</p>
                    {onNavigateToLoan && (
                      <button
                        onClick={() => {
                          setShowNotificationPopup(false);
                          onNavigateToLoan(actionSuccessMessage.type);
                        }}
                        className="mt-1 font-bold text-[11px] underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Lihat Tagihan Sekarang</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-80">
                  {pendingLoans.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                      <p className="font-semibold text-slate-700">Tidak ada pengajuan pinjaman baru</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Semua pengajuan pinjaman uang dan barang telah diproses.
                      </p>
                    </div>
                  ) : (
                    pendingLoans.map((loan) => {
                      const isUang = loan.jenisPinjaman === 'Uang' || (loan.jenisPinjaman as string)?.toLowerCase() === 'uang';
                      const nominal = isUang ? (loan.jumlahUang || 0) : (loan.estimasiHargaBarang || 0);

                      return (
                        <div
                          key={loan.id}
                          className="p-3.5 hover:bg-slate-50 transition-colors text-xs"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">
                                  {loan.namaAnggota}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {loan.nomorAnggota}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Diajukan: {loan.tanggalPengajuan}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                                isUang
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isUang ? (
                                <Banknote className="w-3 h-3" />
                              ) : (
                                <ShoppingBag className="w-3 h-3" />
                              )}
                              <span>{isUang ? 'Pinjaman Uang' : 'Pinjaman Barang'}</span>
                            </span>
                          </div>

                          <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200/80 mb-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">
                                {isUang ? 'Nominal Pinjaman:' : `Barang: ${loan.namaBarang || '-'}`}
                              </span>
                              <strong className="text-slate-800 font-mono">
                                {formatRupiah(nominal)}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>Tenor Angsuran:</span>
                              <span className="font-medium text-slate-700">{loan.tenorBulan} Bulan</span>
                            </div>
                            {loan.keperluan && (
                              <p className="text-[10px] text-slate-600 italic line-clamp-1 border-t border-slate-100 pt-1 mt-1">
                                "{loan.keperluan}"
                              </p>
                            )}
                          </div>

                          {/* Quick Action: Setujui otomatis masuk tagihan */}
                          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                            <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Otomatis masuk tagihan jika disetujui</span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={(e) => handleReject(loan, e)}
                                title="Tolak pengajuan"
                                className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Tolak</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleApprove(loan, e)}
                                title={`Setujui dan masukkan otomatis ke tagihan ${isUang ? 'Pinjaman Uang' : 'Pinjaman Barang'}`}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationPopup(false);
                      onOpenNotifications();
                    }}
                    className="w-full text-center py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Buka Semua Antrean Pengajuan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Keluar / Kembali ke Halaman Login"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>

      {/* Google Drive Master Database Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
      />
    </header>
  );
};


