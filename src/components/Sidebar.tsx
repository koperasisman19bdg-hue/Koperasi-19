import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Banknote,
  HandCoins,
  Store,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ShieldCheck,
  Settings,
  UploadCloud,
  X,
  Smartphone
} from 'lucide-react';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import { DeviceIntegrationModal } from './DeviceIntegrationModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingLoansCount: number;
  onLogout: () => void;
  onOpenPublicForm: () => void;
  customLogoUrl?: string;
  adminUsername?: string;
  namaKoperasi?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingLoansCount,
  onLogout,
  onOpenPublicForm,
  customLogoUrl,
  adminUsername = 'Warga Bahagia',
  namaKoperasi = 'Koperasi Warga Bahagia',
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const currentLogo = customLogoUrl || defaultLogoImg;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Ikhtisar / Beranda',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'keanggotaan',
      label: '1. Data Keanggotaan',
      icon: Users,
      badge: null
    },
    {
      id: 'jurnal',
      label: '2. Jurnal Umum',
      icon: BookOpen,
      badge: null
    },
    {
      id: 'simpanan',
      label: '3. Simpanan Anggota',
      icon: Banknote,
      badge: null
    },
    {
      id: 'peminjaman',
      label: '4. Peminjaman',
      icon: HandCoins,
      badge: pendingLoansCount > 0 ? `${pendingLoansCount} Baru` : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'pertokoan',
      label: '5. Pertokoan & Seragam',
      icon: Store,
      badge: null
    },
    {
      id: 'upload_laporan',
      label: '6. Upload Laporan Keuangan',
      icon: UploadCloud,
      badge: 'Baru',
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold'
    },
    {
      id: 'laporan_ai',
      label: '7. Membuat Laporan (AI)',
      icon: Sparkles,
      badge: 'Otomatis',
      badgeColor: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold'
    },
    {
      id: 'pengaturan',
      label: '8. Pengaturan Akun',
      icon: Settings,
      badge: null
    }
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="w-72 bg-slate-900 text-slate-200 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand & Logo Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-white p-1 ring-2 ring-emerald-500/40 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={currentLogo}
              alt="Logo Koperasi Warga Bahagia"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-white text-sm leading-tight tracking-tight truncate">
              {namaKoperasi}
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium truncate mt-0.5">
              Sistem Informasi KPRI
            </p>
          </div>
        </div>

        {/* Close button on mobile drawer */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Pengurus Koperasi
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        {/* Device PWA Button in Sidebar */}
        <div className="pt-2 px-1">
          <button
            type="button"
            onClick={() => {
              setIsDeviceModalOpen(true);
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 text-emerald-300 hover:text-white hover:border-emerald-400 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="text-left min-w-0">
                <div className="text-xs font-bold leading-tight truncate">Akses Laptop & HP</div>
                <div className="text-[10px] text-slate-400 leading-tight">Pasang Aplikasi (PWA)</div>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
              Instal
            </span>
          </button>
        </div>
      </nav>

      {/* Admin User Info & Logout Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => handleSelectTab('pengaturan')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
            title="Klik untuk membuka Pengaturan Akun"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-emerald-500/50">
              WB
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                <span>{adminUsername}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">Administrator Koperasi</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Keluar / Log out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Laptop Sidebar (Sticky) */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* 2. Mobile & Tablet Slide-over Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Modal Akses Laptop & HP */}
      <DeviceIntegrationModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </>
  );
};

