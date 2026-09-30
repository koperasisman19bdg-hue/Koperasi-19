import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../utils/storage';
import { PengaturanAkun } from '../types';
import { exportContohKopSuratPdf } from '../utils/exportPdf';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import {
  Settings,
  Shield,
  User,
  Lock,
  Building,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  FileText,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Download,
  Database,
  Printer,
  Globe,
  Palette,
  Server,
  Wifi,
  RefreshCw,
  Copy,
  CheckCircle2,
  Radio,
  Smartphone,
  Laptop,
  Link2,
  Cloud,
  ExternalLink,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import {
  getDriveSyncStatus,
  signInWithGoogleDrive,
  signOutFromGoogleDrive,
  pushDatabaseToGoogleDrive,
  pullDatabaseFromGoogleDrive,
  connectWithAccessToken,
  DriveSyncStatus,
  DRIVE_DATABASE_FILENAME
} from '../services/googleDriveService';

interface PengaturanAkunPageProps {
  onPengaturanChanged?: () => void;
}

export const PengaturanAkunPage: React.FC<PengaturanAkunPageProps> = ({ onPengaturanChanged }) => {
  const [pengaturan, setPengaturan] = useState<PengaturanAkun>(() => StorageService.getPengaturan());
  const [activeSubTab, setActiveSubTab] = useState<'logo_identitas' | 'kop_surat' | 'pejabat' | 'admin' | 'data' | 'server_sync' | 'google_drive'>('logo_identitas');

  // Google Drive state
  const [driveStatus, setDriveStatus] = useState<DriveSyncStatus>(() => getDriveSyncStatus());
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [copiedDriveDomain, setCopiedDriveDomain] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showManualTokenForm, setShowManualTokenForm] = useState(false);

  // Server health test state
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverTestResult, setServerTestResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customServerInput, setCustomServerInput] = useState(() => StorageService.getCustomServerUrl());

  // Form states for general settings
  const [formData, setFormData] = useState<PengaturanAkun>(pengaturan);

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const current = StorageService.getPengaturan();
      setPengaturan(current);
      setFormData(current);
    };

    handleUpdate();

    window.addEventListener('kwb-pengaturan-changed', handleUpdate);
    const handleDriveUpdate = (e: any) => {
      if (e.detail) {
        setDriveStatus(e.detail);
      } else {
        setDriveStatus(getDriveSyncStatus());
      }
    };
    window.addEventListener('kwb-drive-status-changed', handleDriveUpdate);

    return () => {
      window.removeEventListener('kwb-pengaturan-changed', handleUpdate);
      window.removeEventListener('kwb-drive-status-changed', handleDriveUpdate);
    };
  }, []);

  const handleInputChange = (field: keyof PengaturanAkun, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Logo Kiri / Logo Utama Upload (Base64 data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas harus berupa gambar (PNG, JPG, JPEG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        logoUrl: base64
      }));
      setSuccessMessage('Logo Kiri / Utama berhasil dipilih! Klik "Simpan Perubahan" untuk menerapkan.');
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo Kanan Kop Surat Upload
  const handleRightLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas harus berupa gambar (PNG, JPG, JPEG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        logoKananUrl: base64,
        tampilkanLogoKananKop: true
      }));
      setSuccessMessage('Logo Kanan Kop Surat berhasil dipilih! Klik "Simpan Perubahan" untuk menerapkan.');
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  // Reset to default official Lambang Koperasi Indonesia
  const handleResetToDefaultLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '' // Empty string will fallback to default lambang_koperasi.jpg
    }));
    setSuccessMessage('Logo dikembalikan ke Lambang Koperasi Indonesia Resmi! Klik "Simpan Perubahan" untuk menerapkan.');
    setErrorMessage('');
  };

  // Reset Logo Kanan
  const handleResetRightLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoKananUrl: ''
    }));
    setSuccessMessage('Logo Kanan disetel ke default Lambang Koperasi.');
    setErrorMessage('');
  };

  // Save General & Identity Settings
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!formData.username.trim()) {
      setErrorMessage('Username tidak boleh kosong!');
      return;
    }

    if (!formData.namaKoperasi.trim()) {
      setErrorMessage('Nama Koperasi tidak boleh kosong!');
      return;
    }

    const updated: PengaturanAkun = {
      ...formData,
      terakhirDiperbarui: new Date().toISOString().split('T')[0]
    };

    StorageService.savePengaturan(updated);
    setPengaturan(updated);
    setSuccessMessage('Pengaturan berhasil disimpan dan langsung diterapkan ke seluruh dokumen cetak!');
    if (onPengaturanChanged) onPengaturanChanged();

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Change Password Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (oldPassword !== pengaturan.password) {
      setErrorMessage('Password lama yang Anda masukkan tidak sesuai!');
      return;
    }

    if (newPassword.length < 2) {
      setErrorMessage('Password baru minimal terdiri dari 2 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password baru tidak cocok!');
      return;
    }

    const updated: PengaturanAkun = {
      ...pengaturan,
      password: newPassword,
      terakhirDiperbarui: new Date().toISOString().split('T')[0]
    };

    StorageService.savePengaturan(updated);
    setPengaturan(updated);
    setFormData(updated);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('Password administrator berhasil diubah! Gunakan password baru untuk sesi login berikutnya.');
    if (onPengaturanChanged) onPengaturanChanged();

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Backup Data to JSON
  const handleExportDataJSON = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      appName: 'Koperasi Warga Bahagia',
      pengaturan: StorageService.getPengaturan(),
      anggota: StorageService.getAnggota(),
      jurnal: StorageService.getJurnal(),
      simpanan: StorageService.getSimpanan(),
      pinjamanUang: StorageService.getPinjamanUang(),
      pinjamanBarang: StorageService.getPinjamanBarang(),
      pengajuan: StorageService.getPengajuan(),
      toko: StorageService.getToko(),
      seragam: StorageService.getSeragam()
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Koperasi_Warga_Bahagia_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentPreviewLogo = formData.logoUrl || defaultLogoImg;

  // Helper color map for Kop Preview
  const getDividerColorClass = () => {
    switch (formData.warnaGarisKop) {
      case 'navy':
        return 'border-blue-900 text-blue-900';
      case 'slate':
        return 'border-slate-700 text-slate-800';
      case 'gold':
        return 'border-amber-700 text-amber-800';
      case 'emerald':
      default:
        return 'border-emerald-900 text-emerald-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Pengaturan Koperasi, Akun & Kop Surat
              </h1>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Sistem Pengurus
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Kelola logo resmi, format kop surat untuk semua dokumen download/cetak PDF, pejabat penandatangan laporan, akun administrator, serta pencadangan database.
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <button
          onClick={() => handleSaveSettings()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('logo_identitas')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'logo_identitas'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Logo & Identitas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kop_surat')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'kop_surat'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Printer className="w-4 h-4 text-emerald-600" />
          <span>2. Pengaturan Kop Surat (Semua Dokumen)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pejabat')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'pejabat'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Pejabat Penandatangan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('admin')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'admin'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>4. Akun & Password</span>
        </button>

        <button
          onClick={() => setActiveSubTab('data')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'data'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>5. Cadangan & Reset</span>
        </button>

        <button
          onClick={() => setActiveSubTab('server_sync')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'server_sync'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-emerald-700 hover:text-emerald-900 hover:border-emerald-300 bg-emerald-50/50'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>6. Integrasi Server & Vercel (Multi-User)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('google_drive')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'google_drive'
              ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-blue-700 hover:text-blue-900 hover:border-blue-300 bg-blue-50/50'
          }`}
        >
          <Cloud className="w-4 h-4 text-blue-600" />
          <span>7. Database Google Drive (Multi-Perangkat)</span>
        </button>
      </div>

      {/* Tab 1: Logo & Identitas Lembaga */}
      {activeSubTab === 'logo_identitas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo Management Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Logo Resmi Koperasi
            </h3>

            {/* Logo Preview */}
            <div className="relative group w-44 h-44 rounded-2xl border-2 border-dashed border-slate-300 p-2 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors">
              <img
                src={currentPreviewLogo}
                alt="Logo Koperasi"
                className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Format: <strong>PNG, JPG, WebP</strong> (Maks. 3 MB). Logo ini diterapkan pada Sidebar, Header, Form Login, E-KTA, dan Kop Surat Dokumen.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            <div className="flex flex-col w-full gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Foto Logo Baru</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefaultLogo}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Gunakan Lambang Koperasi Klasik</span>
              </button>
            </div>
          </div>

          {/* Form Identitas Koperasi */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Identitas & Informasi Koperasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Koperasi *
                </label>
                <input
                  type="text"
                  value={formData.namaKoperasi}
                  onChange={(e) => handleInputChange('namaKoperasi', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Badan Hukum / Nomor Izin *
                </label>
                <input
                  type="text"
                  value={formData.badanHukum}
                  onChange={(e) => handleInputChange('badanHukum', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Kantor *
                </label>
                <textarea
                  rows={2}
                  value={formData.alamatKoperasi}
                  onChange={(e) => handleInputChange('alamatKoperasi', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon Kantor
                </label>
                <input
                  type="text"
                  value={formData.teleponKoperasi}
                  onChange={(e) => handleInputChange('teleponKoperasi', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi Koperasi
                </label>
                <input
                  type="email"
                  value={formData.emailKoperasi || formData.emailAdmin}
                  onChange={(e) => {
                    handleInputChange('emailKoperasi', e.target.value);
                    handleInputChange('emailAdmin', e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Identitas Koperasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pengaturan Kop Surat (Semua Dokumen) */}
      {activeSubTab === 'kop_surat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Kop Configuration Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Konfigurasi Kop Surat Resmi Dokumen
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kop surat ini otomatis digunakan pada seluruh hasil unduhan berkas (Jurnal Kas, E-KTA, Pinjaman, Simpanan, Pertokoan, dan Laporan Arus Kas Bulanan).
                </p>
              </div>

              <div className="space-y-4">
                {/* 0. Pengaturan Logo Kop Surat (Kiri & Kanan) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      Pengaturan Logo Kop Surat (Kiri & Kanan)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">PNG/JPG maks. 3MB</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logo Kiri */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Logo Sisi Kiri</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.tampilkanLogoKiriKop !== false}
                            onChange={(e) => handleInputChange('tampilkanLogoKiriKop', e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Aktif</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={formData.logoUrl || defaultLogoImg}
                            alt="Logo Kiri"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1 w-full">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full text-left px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>Ganti Logo Kiri</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Logo Kanan */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Logo Sisi Kanan</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.tampilkanLogoKananKop !== false}
                            onChange={(e) => handleInputChange('tampilkanLogoKananKop', e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Aktif</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={formData.logoKananUrl || formData.logoUrl || defaultLogoImg}
                            alt="Logo Kanan"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1 w-full">
                          <button
                            type="button"
                            onClick={() => rightFileInputRef.current?.click()}
                            className="w-full text-left px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 border border-emerald-200"
                          >
                            <Upload className="w-3 h-3 text-emerald-600" />
                            <span>Unggah Logo Kanan</span>
                          </button>
                          {formData.logoKananUrl && (
                            <button
                              type="button"
                              onClick={handleResetRightLogo}
                              className="w-full text-[10px] text-slate-500 hover:text-slate-800 text-center cursor-pointer"
                            >
                              Reset ke Default
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={rightFileInputRef}
                    onChange={handleRightLogoUpload}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />
                </div>

                {/* 1. Instansi Induk */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instansi / Lembaga Induk Pengayom (Baris Atas Kop)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: PEMERINTAH DAERAH PROVINSI JAWA BARAT&#10;DINAS PENDIDIKAN - SMA NEGERI 19 BANDUNG"
                    value={formData.instansiInduk || ''}
                    onChange={(e) => handleInputChange('instansiInduk', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan baris baru (Enter) untuk memisahkan tingkatan lembaga pemerintah / sekolah.
                  </p>
                </div>

                {/* 2. Nama Koperasi (Judul Utama Kop) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Organisasi Koperasi (Judul Utama) *
                  </label>
                  <input
                    type="text"
                    value={formData.namaKoperasi}
                    onChange={(e) => handleInputChange('namaKoperasi', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900"
                  />
                </div>

                {/* 3. Badan Hukum */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Badan Hukum / Akta Pendirian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Badan Hukum KPRI No. 19/BH/KWK/1998 · Tgl 19 Mei 1998"
                    value={formData.badanHukum}
                    onChange={(e) => handleInputChange('badanHukum', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Alamat Kantor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap Kantor Koperasi
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamatKoperasi}
                    onChange={(e) => handleInputChange('alamatKoperasi', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 5. Kontak, Email & Website */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      Telepon / WA
                    </label>
                    <input
                      type="text"
                      placeholder="(022) 2501919"
                      value={formData.teleponKoperasi || ''}
                      onChange={(e) => handleInputChange('teleponKoperasi', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      Email Resmi
                    </label>
                    <input
                      type="email"
                      placeholder="koperasi@sman19bdg.sch.id"
                      value={formData.emailKoperasi || formData.emailAdmin || ''}
                      onChange={(e) => handleInputChange('emailKoperasi', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      Website / Portal
                    </label>
                    <input
                      type="text"
                      placeholder="sman19bdg.sch.id"
                      value={formData.websiteKoperasi || ''}
                      onChange={(e) => handleInputChange('websiteKoperasi', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 6. Warna Garis Pembatas Kop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    Warna Aksen Garis Ganda Pembatas Kop
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'emerald', label: 'Hijau Emerald', bg: 'bg-emerald-800', border: 'border-emerald-800' },
                      { id: 'navy', label: 'Biru Dongker', bg: 'bg-blue-900', border: 'border-blue-900' },
                      { id: 'slate', label: 'Abu Formal', bg: 'bg-slate-700', border: 'border-slate-700' },
                      { id: 'gold', label: 'Emas Elegan', bg: 'bg-amber-700', border: 'border-amber-700' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInputChange('warnaGarisKop', item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          formData.warnaGarisKop === item.id || (!formData.warnaGarisKop && item.id === 'emerald')
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${item.bg}`} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Catatan Kaki (Footer Dokumen) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teks Catatan Kaki Dokumen (Footer Otomatis)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dokumen ini diterbitkan secara sah dan resmi oleh Sistem Informasi Manajemen Koperasi Pegawai SMAN 19 Bandung."
                    value={formData.catatanKakiKop || ''}
                    onChange={(e) => handleInputChange('catatanKakiKop', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={exportContohKopSuratPdf}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Uji Cetak Contoh PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Kop Surat</span>
                </button>
              </div>
            </div>

            {/* Right: Live Realistic Preview Box (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Pratinjau Langsung Kop Surat (Live Preview)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Sesuai Output PDF
                  </span>
                </div>

                {/* Simulated Paper Document */}
                <div className="p-4 bg-white border border-slate-300/80 rounded-lg shadow-2xs font-sans text-center space-y-1">
                  {/* Header Row with Left Logo, Center Texts, Right Logo */}
                  <div className="flex items-center justify-between gap-2 pb-1">
                    {/* Left Logo */}
                    {formData.tampilkanLogoKiriKop !== false ? (
                      <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                        <img
                          src={formData.logoUrl || defaultLogoImg}
                          alt="Logo Kiri"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-11 shrink-0" />
                    )}

                    {/* Center Letterhead Texts */}
                    <div className="flex-1 space-y-0.5">
                      {/* Instansi Induk */}
                      {formData.instansiInduk && (
                        <div className="text-[9.5px] font-bold tracking-wider text-slate-600 uppercase whitespace-pre-line leading-tight">
                          {formData.instansiInduk}
                        </div>
                      )}

                      {/* Nama Koperasi */}
                      <div className={`text-xs font-extrabold uppercase tracking-wide ${getDividerColorClass()}`}>
                        {formData.namaKoperasi || 'KOPERASI WARGA BAHAGIA'}
                      </div>

                      {/* Badan Hukum */}
                      <div className="text-[8.5px] text-slate-600 font-medium leading-tight">
                        {formData.badanHukum || 'Badan Hukum Koperasi Pegawai'}
                      </div>

                      {/* Alamat & Kontak */}
                      <div className="text-[7.5px] text-slate-500 leading-tight">
                        {[
                          formData.alamatKoperasi,
                          formData.teleponKoperasi ? `Telp: ${formData.teleponKoperasi}` : '',
                          formData.emailKoperasi || formData.emailAdmin ? `Email: ${formData.emailKoperasi || formData.emailAdmin}` : '',
                          formData.websiteKoperasi ? `Web: ${formData.websiteKoperasi}` : ''
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>

                    {/* Right Logo */}
                    {formData.tampilkanLogoKananKop !== false ? (
                      <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                        <img
                          src={formData.logoKananUrl || formData.logoUrl || defaultLogoImg}
                          alt="Logo Kanan"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-11 shrink-0" />
                    )}
                  </div>

                  {/* Double Divider Lines */}
                  <div className="pt-1">
                    <div className={`border-b-2 ${getDividerColorClass()}`} />
                    <div className={`border-b mt-0.5 ${getDividerColorClass()}`} />
                  </div>

                  {/* Document Title Preview */}
                  <div className="pt-3 pb-1">
                    <div className="text-[11px] font-bold text-slate-900 underline uppercase">
                      SURAT KETERANGAN / LAPORAN RESMI
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">
                      Nomor: 001/KWB/DOC/{new Date().getFullYear()} · Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Simulated Content Body */}
                  <div className="py-2 text-[8px] text-slate-500 text-left bg-slate-50/70 p-2.5 rounded border border-slate-100 space-y-1">
                    <p>Format kop di atas akan langsung tercantum pada seluruh ekspor data:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      <li>Buku Kas Jurnal Umum & Laporan Bulanan</li>
                      <li>Kartu Tanda Anggota (E-KTA) Digital</li>
                      <li>Surat Akad Pinjaman & Pengajuan</li>
                      <li>Buku Kas Toko & Seragam Sekolah</li>
                    </ul>
                  </div>

                  {/* Signatures Preview */}
                  <div className="grid grid-cols-2 gap-2 text-left pt-2 text-[8px] text-slate-700">
                    <div>
                      <div>Mengetahui,</div>
                      <div className="font-semibold text-slate-800">Ketua Koperasi</div>
                      <div className="h-6" />
                      <div className="font-bold underline text-slate-900">{formData.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.'}</div>
                      {formData.nipKetua && <div className="text-[7px] text-slate-500">NIP. {formData.nipKetua}</div>}
                    </div>
                    <div>
                      <div>Menyetujui,</div>
                      <div className="font-semibold text-slate-800">Bendahara Koperasi</div>
                      <div className="h-6" />
                      <div className="font-bold underline text-slate-900">{formData.namaBendahara || 'Hj. Siti Rohmah, S.Pd.'}</div>
                      {formData.nipBendahara && <div className="text-[7px] text-slate-500">NIP. {formData.nipBendahara}</div>}
                    </div>
                  </div>

                  {/* Footer Note */}
                  {formData.catatanKakiKop && (
                    <div className="pt-2 text-[7px] text-slate-400 italic border-t border-slate-100">
                      {formData.catatanKakiKop}
                    </div>
                  )}
                </div>
              </div>

              {/* Tips Banner */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Petunjuk Format Kop Surat</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Perubahan pada halaman ini akan langsung disinkronkan ke seluruh modul aplikasi dan berlaku saat pengurus mengunduh laporan PDF di modul mana pun.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pejabat Penandatangan Laporan */}
      {activeSubTab === 'pejabat' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pejabat Pengesah Dokumen Laporan Koperasi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Nama-nama dan NIP berikut akan otomatis tercantum pada bagian tanda tangan pengesahan berkas PDF di seluruh modul.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Ketua */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. Ketua Koperasi</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={formData.namaKetua}
                  onChange={(e) => handleInputChange('namaKetua', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  NIP / NUPTK / No. Anggota
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19680512 199403 1 004"
                  value={formData.nipKetua || ''}
                  onChange={(e) => handleInputChange('nipKetua', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>
            </div>

            {/* 2. Bendahara */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>2. Bendahara Koperasi</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={formData.namaBendahara}
                  onChange={(e) => handleInputChange('namaBendahara', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  NIP / NUPTK / No. Anggota
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19740920 199802 2 001"
                  value={formData.nipBendahara || ''}
                  onChange={(e) => handleInputChange('nipBendahara', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>
            </div>

            {/* 3. Sekretaris */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>3. Sekretaris Koperasi</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  placeholder="Dra. Hj. Neneng Suryani, M.M.Pd."
                  value={formData.namaSekretaris || ''}
                  onChange={(e) => handleInputChange('namaSekretaris', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  NIP / NUPTK / No. Anggota
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19710315 199601 2 002"
                  value={formData.nipSekretaris || ''}
                  onChange={(e) => handleInputChange('nipSekretaris', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pejabat Penandatangan</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Kredensial & Profil Admin */}
      {activeSubTab === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Username & Info Profil Admin */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Profil & Username Administrator
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Login Administrator *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <span className="font-mono font-semibold">Warga Bahagia</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Admin / Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={formData.namaAdmin}
                  onChange={(e) => handleInputChange('namaAdmin', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. HP / WhatsApp Pengurus
                </label>
                <input
                  type="text"
                  value={formData.noHpAdmin}
                  onChange={(e) => handleInputChange('noHpAdmin', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Username & Profil</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Ubah Password Admin */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ganti Password Login Administrator
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Lama *
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    placeholder="Masukkan password saat ini (Default: 19)"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Masukkan password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Ketik ulang password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Perbarui Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Cadangan Data & Reset */}
      {activeSubTab === 'data' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pencadangan (Backup) & Pemulihan Sistem
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simpan seluruh database lokal (keanggotaan, jurnal, simpanan, peminjaman, toko, dan pengaturan) ke dalam satu file JSON untuk keamanan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Cadangkan Data (Export JSON)</span>
              </h4>
              <p className="text-[11px] text-slate-600">
                Unduh salinan lengkap seluruh catatan transaksi dan database ke perangkat komputer Anda.
              </p>
              <button
                type="button"
                onClick={handleExportDataJSON}
                className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Cadangan JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <h4 className="font-bold text-xs text-rose-800 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset ke Setelan Awal Pabrik</span>
              </h4>
              <p className="text-[11px] text-rose-600">
                Mengembalikan pengaturan logo, akun (Username: Warga Bahagia, Password: 19), dan data simulasi awal.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin me-reset seluruh pengaturan dan data ke default?')) {
                    StorageService.resetAll();
                    setPengaturan(StorageService.getPengaturan());
                    setFormData(StorageService.getPengaturan());
                    setSuccessMessage('Semua data dan pengaturan telah berhasil di-reset!');
                    if (onPengaturanChanged) onPengaturanChanged();
                  }
                }}
                className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Integrasi Server Terpusat & Multi-User Akses Vercel */}
      {activeSubTab === 'server_sync' && (
        <div className="space-y-6">
          {/* Main Status & Overview Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Server className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Integrasi Server Tunggal & Akses Multi-User Vercel
                    </h3>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Aktif & Terhubung Realtime
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Semua pengguna yang membuka tautan Vercel, HP, maupun Laptop akan secara otomatis terhubung ke satu server database terpusat yang sama.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingServer(true);
                    setServerTestResult(null);
                    const res = await StorageService.testServerConnection();
                    setServerTestResult(res);
                    setIsTestingServer(false);
                  }}
                  disabled={isTestingServer}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Wifi className={`w-4 h-4 ${isTestingServer ? 'animate-spin' : ''}`} />
                  <span>{isTestingServer ? 'Menguji Server...' : 'Uji Koneksi Server (Test Ping)'}</span>
                </button>
              </div>
            </div>

            {/* Test Result Display */}
            {serverTestResult && (
              <div className={`p-3.5 rounded-xl text-xs border ${
                serverTestResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}>
                {serverTestResult.success ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Server Terkoneksi Lancar!</strong> Respon: {serverTestResult.data?.latencyMs}ms · Klien Terhubung: {serverTestResult.data?.clientsConnected ?? 1}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300/80 font-mono">
                      Waktu Server: {new Date(serverTestResult.data?.serverTime || Date.now()).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Gagal menghubungi server: {serverTestResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grid Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: How it works & Multi-User sync */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cara Kerja Input Multi-User & Vercel
                </h4>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Akses Tanpa Batas Device:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Siapapun pengurus atau anggota yang membuka aplikasi melalui tautan Vercel, HP Android/iPhone, iPad, maupun Laptop otomatis tersambung ke database terpusat.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <RefreshCw className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Sinkronisasi Realtime Otomatis:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Setiap ada anggota baru, jurnal baru, setoran simpanan, atau pinjaman yang diinput di device mana saja, sistem akan langsung mengirim pembaruan via <em>Server-Sent Events (SSE)</em> ke seluruh device lain seketika tanpa perlu refresh halaman.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Proteksi Anti-Hilang Data:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Database disimpan di server secara aman dengan cadangan ganda (atomic backup) dan penyimpanan cache lokal (offline resilience) sehingga data Anda selalu utuh.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Server URL & Manual Control */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Link2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Alamat Server Database Terpusat
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Server Produksi Aktif (Shared Backend):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={StorageService.getCentralServerUrl()}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(StorageService.getCentralServerUrl());
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 3000);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      title="Salin Link Server"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tautan ini dikonfigurasi secara otomatis untuk semua akses deployment Vercel.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Aksi Sinkronisasi Manual:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setSuccessMessage('Sedang menyelaraskan data dengan server...');
                        const ok = await StorageService.forceSyncFromServer();
                        if (ok) {
                          setSuccessMessage('Berhasil menyinkronkan data terbaru dari server!');
                          if (onPengaturanChanged) onPengaturanChanged();
                        } else {
                          setErrorMessage('Gagal menyinkronkan data. Pastikan koneksi internet stabil.');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tarik Data Terbaru Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Database Tunggal Google Drive (Multi-Perangkat) */}
      {activeSubTab === 'google_drive' && (
        <div className="space-y-6">
          {/* Main Status & Overview Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Cloud className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Database Tunggal Google Drive (Multi-Perangkat)
                    </h3>
                    {driveStatus.isConnected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Terhubung & Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                        Belum Terhubung
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Menjadikan Google Drive Anda sebagai tempat penyimpanan database tunggal terpusat. Setiap perubahan data yang diinput oleh admin di laptop atau HP langsung tersimpan dan dapat dilihat secara real-time oleh perangkat lainnya.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {driveStatus.isConnected ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Putuskan akun Google Drive? Data lokal aplikasi tetap tersimpan.')) return;
                      setIsDriveLoading(true);
                      try {
                        await signOutFromGoogleDrive();
                        setSuccessMessage('Akun Google Drive berhasil diputuskan.');
                      } catch (e: any) {
                        setErrorMessage(e.message || 'Gagal memutuskan akun.');
                      } finally {
                        setIsDriveLoading(false);
                      }
                    }}
                    disabled={isDriveLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>Putuskan Akun</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDriveLoading(true);
                      try {
                        await signInWithGoogleDrive();
                        setSuccessMessage('Berhasil menghubungkan ke Google Drive!');
                      } catch (e: any) {
                        setErrorMessage(e.message || 'Gagal menghubungkan Google Drive.');
                      } finally {
                        setIsDriveLoading(false);
                      }
                    }}
                    disabled={isDriveLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>{isDriveLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Warning / Resolution Card if Firebase auth/unauthorized-domain occurs */}
          {driveStatus.isUnauthorizedDomain && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Otorisasi Domain Diperlukan untuk Login Pop-Up Google (auth/unauthorized-domain)
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Firebase Authentication memerlukan domain container preview ini didaftarkan di Firebase Console agar otorisasi pop-up Google dapat berjalan.
                  </p>
                </div>
              </div>

              {/* Domain Copy Box */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Domain Container Anda:</span>
                  <span className="font-mono text-xs font-bold text-slate-800 select-all">
                    {driveStatus.unauthorizedHostname || window.location.hostname}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const domain = driveStatus.unauthorizedHostname || window.location.hostname;
                    navigator.clipboard.writeText(domain);
                    setCopiedDriveDomain(true);
                    setTimeout(() => setCopiedDriveDomain(false), 3000);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedDriveDomain ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedDriveDomain ? 'Tersalin!' : 'Salin Domain'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <span className="font-bold block">Langkah 1 Menit Menambahkan Domain:</span>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 text-[11px]">
                  <li>Klik tombol <strong>"Buka Firebase Console"</strong> di bawah.</li>
                  <li>Pada tab <strong>Authorized domains</strong>, klik tombol <strong>"Add domain"</strong>.</li>
                  <li>Tempel (paste) nama domain yang sudah disalin di atas, lalu klik <strong>"Save"</strong>.</li>
                  <li>Kembali ke aplikasi ini dan klik <strong>"Coba Hubungkan Lagi"</strong>.</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={driveStatus.firebaseConsoleUrl || `https://console.firebase.google.com/project/gen-lang-client-0907905260/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Buka Firebase Console (Authorized Domains)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    setIsDriveLoading(true);
                    try {
                      await signInWithGoogleDrive();
                      setSuccessMessage('Berhasil terhubung ke Google Drive!');
                    } catch (e: any) {
                      setErrorMessage(e.message || 'Gagal menghubungkan Google Drive.');
                    } finally {
                      setIsDriveLoading(false);
                    }
                  }}
                  disabled={isDriveLoading}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDriveLoading ? 'animate-spin' : ''}`} />
                  <span>Coba Hubungkan Lagi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualTokenForm(!showManualTokenForm)}
                  className="text-xs text-amber-800 hover:text-amber-950 underline font-medium cursor-pointer ml-auto"
                >
                  {showManualTokenForm ? 'Tutup Input Token' : 'Atau Input Access Token Manual'}
                </button>
              </div>

              {showManualTokenForm && (
                <div className="p-3 bg-white rounded-xl border border-amber-200 mt-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Masukkan Access Token Google Drive (Bypass Instan):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={manualTokenInput}
                      onChange={(e) => setManualTokenInput(e.target.value)}
                      placeholder="ya29.a0..."
                      className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!manualTokenInput.trim()) return;
                        setIsDriveLoading(true);
                        try {
                          await connectWithAccessToken(manualTokenInput);
                          setSuccessMessage('Berhasil terhubung ke Google Drive dengan Access Token!');
                          setShowManualTokenForm(false);
                          setManualTokenInput('');
                        } catch (e: any) {
                          setErrorMessage(e.message || 'Gagal memverifikasi token.');
                        } finally {
                          setIsDriveLoading(false);
                        }
                      }}
                      disabled={isDriveLoading || !manualTokenInput.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Hubungkan Token
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Google Drive Database File Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Informasi Berkas Database Google Drive
                  </h4>
                </div>
                {driveStatus.fileId && (
                  <a
                    href={`https://drive.google.com/file/d/${driveStatus.fileId}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:underline"
                  >
                    <span>Buka File di Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {driveStatus.isConnected && driveStatus.user ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Akun Google:</span>
                      <span className="font-semibold text-slate-800">{driveStatus.user.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Nama Berkas:</span>
                      <span className="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {DRIVE_DATABASE_FILENAME}
                      </span>
                    </div>
                    {driveStatus.fileId && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>ID Berkas di Drive:</span>
                        <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                          {driveStatus.fileId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Sinkronisasi Terakhir:</span>
                      <span className="font-semibold text-emerald-700">
                        {driveStatus.lastSyncedAt ? `${driveStatus.lastSyncedAt} WIB` : 'Aktif'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Aksi Sinkronisasi Manual:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Simpan dan perbarui data saat ini ke berkas database Google Drive?')) return;
                          setIsDriveLoading(true);
                          try {
                            const ok = await pushDatabaseToGoogleDrive(true);
                            if (ok) {
                              setSuccessMessage('Data berhasil disimpan ke Google Drive!');
                            } else {
                              setErrorMessage('Gagal menyimpan ke Google Drive.');
                            }
                          } catch (e: any) {
                            setErrorMessage(e.message || 'Gagal menyimpan.');
                          } finally {
                            setIsDriveLoading(false);
                          }
                        }}
                        disabled={isDriveLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Kirim ke Drive Sekarang</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('Unduh data terbaru dari Google Drive? Data lokal akan diperbarui sesuai Google Drive.')) return;
                          setIsDriveLoading(true);
                          try {
                            const ok = await pullDatabaseFromGoogleDrive();
                            if (ok) {
                              setSuccessMessage('Data terbaru berhasil diunduh dari Google Drive!');
                              if (onPengaturanChanged) onPengaturanChanged();
                            } else {
                              setErrorMessage('Gagal mengunduh data dari Google Drive.');
                            }
                          } catch (e: any) {
                            setErrorMessage(e.message || 'Gagal mengunduh.');
                          } finally {
                            setIsDriveLoading(false);
                          }
                        }}
                        disabled={isDriveLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        <span>Tarik dari Drive Sekarang</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3 text-xs text-slate-500">
                  <Cloud className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>
                    Silakan klik tombol <strong>"Masuk dengan Akun Google"</strong> di atas untuk mengaktifkan Google Drive sebagai database tunggal aplikasi ini.
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Multi-Device Sync Guide */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Panduan Multi-Perangkat (Laptop & Smartphone HP)
                </h4>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Laptop className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">1. Akses dari Komputer / Laptop Pengurus</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Buka aplikasi di browser laptop, hubungkan ke Google Drive yang sama. Setiap input data anggota, kas masuk/keluar, dan transaksi langsung tersimpan ke Google Drive.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">2. Akses dari Smartphone (HP) Pengurus</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Buka aplikasi di browser HP, masuk dengan Akun Google yang sama. Data yang diinput dari laptop langsung terbaca dan tersinkronisasi otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">3. Pembaruan Latar Belakang (Auto-Sync)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sistem memeriksa berkas di Google Drive setiap 15 detik serta setiap kali layar HP dibuka atau tab laptop kembali aktif, sehingga data selalu mutakhir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
