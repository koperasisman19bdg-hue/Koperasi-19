import React, { useState, useEffect, useCallback } from 'react';
import { StorageService } from './utils/storage';
import { initDriveAuth } from './services/googleDriveService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { PengajuanPublikModal } from './components/PengajuanPublikModal';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Banknote,
  HandCoins,
  Store,
  Settings,
  Menu,
  Wifi,
  CloudOff,
  RefreshCw,
  X
} from 'lucide-react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { DataKeanggotaan } from './pages/DataKeanggotaan';
import { JurnalUmum } from './pages/JurnalUmum';
import { SimpananAnggota } from './pages/SimpananAnggota';
import { Peminjaman } from './pages/Peminjaman';
import { Pertokoan } from './pages/Pertokoan';
import { PengaturanAkunPage } from './pages/PengaturanAkunPage';
import { MembuatLaporanAIPage } from './pages/MembuatLaporanAIPage';
import { UploadLaporanPage } from './pages/UploadLaporanPage';

import {
  Anggota,
  JurnalItem,
  SimpananRecord,
  PinjamanUang,
  PinjamanBarang,
  PengajuanPinjaman,
  PembukuanTokoItem,
  PembukuanSeragamItem,
  PengaturanAkun
} from './types';

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => StorageService.isLoggedIn());

  // Settings State (Logo, Username, Password, Institution identity)
  const [pengaturan, setPengaturan] = useState<PengaturanAkun>(() => StorageService.getPengaturan());

  // Active Navigation Tab & SubTab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [peminjamanSubTab, setPeminjamanSubTab] = useState<'uang' | 'barang' | 'pengajuan'>('uang');

  // Mobile Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Public Loan Modal
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);

  // Application Data States
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalItem[]>([]);
  const [simpananList, setSimpananList] = useState<SimpananRecord[]>([]);
  const [pinjamanUangList, setPinjamanUangList] = useState<PinjamanUang[]>([]);
  const [pinjamanBarangList, setPinjamanBarangList] = useState<PinjamanBarang[]>([]);
  const [pengajuanList, setPengajuanList] = useState<PengajuanPinjaman[]>([]);
  const [tokoList, setTokoList] = useState<PembukuanTokoItem[]>([]);
  const [seragamList, setSeragamList] = useState<PembukuanSeragamItem[]>([]);

  // Reload all data from StorageService
  const loadAllData = useCallback(() => {
    setPengaturan(StorageService.getPengaturan());
    setAnggotaList(StorageService.getAnggota());
    setJurnalList(StorageService.getJurnal());
    setSimpananList(StorageService.getSimpanan());
    setPinjamanUangList(StorageService.getPinjamanUang());
    setPinjamanBarangList(StorageService.getPinjamanBarang());
    setPengajuanList(StorageService.getPengajuan());
    setTokoList(StorageService.getToko());
    setSeragamList(StorageService.getSeragam());
  }, []);

  useEffect(() => {
    loadAllData();

    // Listen to custom window events triggered when data or settings change
    const handleDataChanged = () => {
      loadAllData();
    };

    const handleAuthChanged = () => {
      setIsLoggedIn(StorageService.isLoggedIn());
    };

    const handlePengaturanChanged = () => {
      setPengaturan(StorageService.getPengaturan());
    };

    // Auto-sync when the window is refocused or tab becomes visible (especially critical on mobile)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        StorageService.forceSyncFromServer();
      }
    };

    window.addEventListener('kwb-data-changed', handleDataChanged);
    window.addEventListener('kwb-auth-changed', handleAuthChanged);
    window.addEventListener('kwb-pengaturan-changed', handlePengaturanChanged);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    const unsubscribeDrive = initDriveAuth();

    return () => {
      window.removeEventListener('kwb-data-changed', handleDataChanged);
      window.removeEventListener('kwb-auth-changed', handleAuthChanged);
      window.removeEventListener('kwb-pengaturan-changed', handlePengaturanChanged);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      if (unsubscribeDrive) unsubscribeDrive();
    };
  }, [loadAllData]);

  // Tab Name Resolution
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Ikhtisar & Dashboard Koperasi';
      case 'keanggotaan':
        return '1. Data Keanggotaan & E-KTA';
      case 'jurnal':
        return '2. Buku Kas Jurnal Umum';
      case 'simpanan':
        return '3. Tabungan Simpanan Anggota';
      case 'peminjaman':
        return '4. Peminjaman Uang & Barang';
      case 'pertokoan':
        return '5. Pembukuan Toko & Seragam';
      case 'upload_laporan':
        return '6. Upload Laporan Keuangan (Posisi Keuangan & PHU)';
      case 'laporan_ai':
        return '7. Membuat Laporan Keuangan SAK EP (AI Auto)';
      case 'pengaturan':
        return '8. Pengaturan Akun & Logo Koperasi';
      default:
        return pengaturan.namaKoperasi || 'Koperasi Warga Bahagia';
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setIsLoggedIn(false);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Kosongkan semua data transaksi dan anggota? Pengaturan akun dan profil koperasi tetap tersimpan.'
      )
    ) {
      StorageService.resetAll();
      loadAllData();
      alert('Semua data transaksi dan anggota telah dikosongkan. Pengaturan akun tetap aman tersimpan.');
    }
  };

  // If user is not logged in, show Login Screen (Username: Warga Bahagia, Password: 19 by default, or updated in settings)
  if (!isLoggedIn) {
    return (
      <LoginModal
        onSuccess={() => {
          setIsLoggedIn(true);
          loadAllData();
        }}
        onOpenPublicForm={() => setIsPublicFormOpen(true)}
      />
    );
  }

  const pendingLoans = pengajuanList.filter((p) => p.status === 'Menunggu');

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingLoansCount={pendingLoans.length}
        onLogout={handleLogout}
        onOpenPublicForm={() => setIsPublicFormOpen(true)}
        customLogoUrl={pengaturan.logoUrl}
        adminUsername={pengaturan.username}
        namaKoperasi={pengaturan.namaKoperasi}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTabName={getTabTitle(activeTab)}
          pendingLoans={pendingLoans}
          onOpenNotifications={() => {
            setActiveTab('peminjaman');
            setPeminjamanSubTab('pengajuan');
          }}
          onOpenPublicForm={() => setIsPublicFormOpen(true)}
          onResetData={handleResetData}
          onDataChanged={loadAllData}
          onNavigateToLoan={(type) => {
            setActiveTab('peminjaman');
            setPeminjamanSubTab(type);
          }}
          onLogout={handleLogout}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <Dashboard
                anggotaList={anggotaList}
                jurnalList={jurnalList}
                simpananList={simpananList}
                pinjamanUangList={pinjamanUangList}
                pinjamanBarangList={pinjamanBarangList}
                pengajuanList={pengajuanList}
                tokoList={tokoList}
                seragamList={seragamList}
                onNavigate={setActiveTab}
                onNavigateSubTab={(tab, sub) => {
                  setActiveTab(tab);
                  if (sub && (sub === 'uang' || sub === 'barang' || sub === 'pengajuan')) {
                    setPeminjamanSubTab(sub as any);
                  }
                }}
                onDataChanged={loadAllData}
                onOpenPublicForm={() => setIsPublicFormOpen(true)}
              />
            )}

            {activeTab === 'keanggotaan' && (
              <DataKeanggotaan
                anggotaList={anggotaList}
                onDataChanged={loadAllData}
              />
            )}

            {activeTab === 'jurnal' && (
              <JurnalUmum
                jurnalList={jurnalList}
                onDataChanged={loadAllData}
              />
            )}

            {activeTab === 'simpanan' && (
              <SimpananAnggota
                anggotaList={anggotaList}
                simpananList={simpananList}
                onDataChanged={loadAllData}
              />
            )}

            {activeTab === 'peminjaman' && (
              <Peminjaman
                anggotaList={anggotaList}
                pinjamanUangList={pinjamanUangList}
                pinjamanBarangList={pinjamanBarangList}
                pengajuanList={pengajuanList}
                initialSubTab={peminjamanSubTab}
                onSubTabChange={(sub) => setPeminjamanSubTab(sub)}
                onDataChanged={loadAllData}
                onOpenPublicForm={() => setIsPublicFormOpen(true)}
              />
            )}

            {activeTab === 'pertokoan' && (
              <Pertokoan
                tokoList={tokoList}
                seragamList={seragamList}
                onDataChanged={loadAllData}
              />
            )}

            {activeTab === 'upload_laporan' && (
              <UploadLaporanPage />
            )}

            {activeTab === 'laporan_ai' && (
              <MembuatLaporanAIPage
                onDataChanged={loadAllData}
              />
            )}

            {activeTab === 'pengaturan' && (
              <PengaturanAkunPage
                onPengaturanChanged={() => {
                  loadAllData();
                }}
              />
            )}
          </div>
        </main>

        {/* Mobile Quick Bottom Navigation Bar (Visible on mobile/tablet screens < lg) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-1.5 px-2 text-slate-400 select-none shadow-2xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('keanggotaan')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'keanggotaan' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Anggota</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'jurnal' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Buku Kas</span>
          </button>

          <button
            onClick={() => setActiveTab('simpanan')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'simpanan' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Simpanan</span>
          </button>

          <button
            onClick={() => setActiveTab('peminjaman')}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'peminjaman' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            {pendingLoans.length > 0 && (
              <span className="absolute top-0 right-3 w-3.5 h-3.5 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {pendingLoans.length}
              </span>
            )}
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Pinjaman</span>
          </button>

          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'pertokoan' || activeTab === 'pengaturan'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Lainnya</span>
          </button>
        </nav>
      </div>

      {/* Member Loan Application Public Dialog */}
      <PengajuanPublikModal
        anggotaList={anggotaList}
        isOpen={isPublicFormOpen}
        onClose={() => setIsPublicFormOpen(false)}
        onSubmitSuccess={() => {
          loadAllData();
        }}
      />
    </div>
  );
}

