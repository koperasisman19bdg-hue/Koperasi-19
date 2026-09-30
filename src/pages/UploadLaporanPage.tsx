import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Scale,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Layers,
  BarChart3,
  DollarSign,
  TrendingUp,
  FileText,
  Printer
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { UploadedPosisiKeuanganData, UploadedPHUData, AkunBarisLaporan, DistribusiSHULPJItem } from '../types';
import {
  downloadTemplatePosisiKeuangan,
  downloadTemplatePHU,
  exportUploadedPosisiKeuanganExcel,
  exportUploadedPHUExcel,
  parseExcelPosisiKeuangan,
  parseExcelPHU
} from '../utils/excelTemplateService';
import {
  exportUploadedPosisiKeuanganPdf,
  exportUploadedPHUPdf
} from '../utils/exportUploadedPdf';

export const UploadLaporanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posisikeuangan' | 'phu'>('posisikeuangan');

  const pConfig = StorageService.getPengaturan();
  const namaKoperasiConfig = (pConfig.namaKoperasi || 'KOPERASI KONSUMEN WARGA BAHAGIA SMA NEGERI 19 BANDUNG').toUpperCase();

  // Posisi Keuangan State
  const [posisiData, setPosisiData] = useState<UploadedPosisiKeuanganData>(() =>
    StorageService.getUploadedPosisiKeuangan()
  );

  // PHU State
  const [phuData, setPhuData] = useState<UploadedPHUData>(() =>
    StorageService.getUploadedPHU()
  );

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // File input refs
  const fileInputPosisiRef = useRef<HTMLInputElement>(null);
  const fileInputPhuRef = useRef<HTMLInputElement>(null);

  // Listen for storage events
  useEffect(() => {
    const handlePosisiUpdate = () => {
      setPosisiData(StorageService.getUploadedPosisiKeuangan());
    };
    const handlePhuUpdate = () => {
      setPhuData(StorageService.getUploadedPHU());
    };

    window.addEventListener('kwb-uploaded-posisi-changed', handlePosisiUpdate);
    window.addEventListener('kwb-uploaded-phu-changed', handlePhuUpdate);
    window.addEventListener('kwb-data-changed', handlePosisiUpdate);
    window.addEventListener('kwb-data-changed', handlePhuUpdate);

    return () => {
      window.removeEventListener('kwb-uploaded-posisi-changed', handlePosisiUpdate);
      window.removeEventListener('kwb-uploaded-phu-changed', handlePhuUpdate);
      window.removeEventListener('kwb-data-changed', handlePosisiUpdate);
      window.removeEventListener('kwb-data-changed', handlePhuUpdate);
    };
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // -------------------------------------------------------------
  // POSISI KEUANGAN CALCULATIONS
  // -------------------------------------------------------------
  const sumItems = (items: AkunBarisLaporan[], field: 'nilaiBerjalan' | 'nilaiLalu') =>
    items.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);

  const jmlAsetLancarB = sumItems(posisiData.asetLancar, 'nilaiBerjalan');
  const jmlAsetLancarL = sumItems(posisiData.asetLancar, 'nilaiLalu');

  const jmlPenyertaanB = sumItems(posisiData.penyertaan, 'nilaiBerjalan');
  const jmlPenyertaanL = sumItems(posisiData.penyertaan, 'nilaiLalu');

  const jmlAsetTetapB = sumItems(posisiData.asetTetap, 'nilaiBerjalan');
  const jmlAsetTetapL = sumItems(posisiData.asetTetap, 'nilaiLalu');

  const totalAsetB = jmlAsetLancarB + jmlPenyertaanB + jmlAsetTetapB;
  const totalAsetL = jmlAsetLancarL + jmlPenyertaanL + jmlAsetTetapL;

  const jmlLiabilitasB = sumItems(posisiData.liabilitas, 'nilaiBerjalan');
  const jmlLiabilitasL = sumItems(posisiData.liabilitas, 'nilaiLalu');

  const jmlEkuitasB = sumItems(posisiData.ekuitas, 'nilaiBerjalan');
  const jmlEkuitasL = sumItems(posisiData.ekuitas, 'nilaiLalu');

  const shuB = Number(posisiData.shuTahunBerjalan?.nilaiBerjalan) || 0;
  const shuL = Number(posisiData.shuTahunBerjalan?.nilaiLalu) || 0;

  const totalLiabEkuitasB = jmlLiabilitasB + jmlEkuitasB + shuB;
  const totalLiabEkuitasL = jmlLiabilitasL + jmlEkuitasL + shuL;

  const selisihPosisiB = totalAsetB - totalLiabEkuitasB;
  const selisihPosisiL = totalAsetL - totalLiabEkuitasL;
  const isBalanceB = Math.abs(selisihPosisiB) < 1;
  const isBalanceL = Math.abs(selisihPosisiL) < 1;

  // -------------------------------------------------------------
  // PHU CALCULATIONS
  // -------------------------------------------------------------
  const totalPendapatanB = sumItems(phuData.pendapatan, 'nilaiBerjalan');
  const totalPendapatanL = sumItems(phuData.pendapatan, 'nilaiLalu');

  const totalBebanB = sumItems(phuData.beban, 'nilaiBerjalan');
  const totalBebanL = sumItems(phuData.beban, 'nilaiLalu');

  const shuPhuB = totalPendapatanB - totalBebanB;
  const shuPhuL = totalPendapatanL - totalBebanL;

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Handle cell edit for Posisi Keuangan
  const handleEditPosisi = (
    section: 'asetLancar' | 'penyertaan' | 'asetTetap' | 'liabilitas' | 'ekuitas',
    idx: number,
    field: 'namaAkun' | 'nilaiBerjalan' | 'nilaiLalu',
    val: string
  ) => {
    const next = { ...posisiData };
    const arr = [...next[section]];
    if (field === 'namaAkun') {
      arr[idx] = { ...arr[idx], [field]: val };
    } else {
      const num = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
      arr[idx] = { ...arr[idx], [field]: num };
    }
    next[section] = arr;
    setPosisiData(next);
  };

  // Handle cell edit for PHU (Pendapatan & Beban)
  const handleEditPHU = (
    section: 'pendapatan' | 'beban',
    idx: number,
    field: 'namaAkun' | 'nilaiBerjalan' | 'nilaiLalu',
    val: string
  ) => {
    const next = { ...phuData };
    const arr = [...next[section]];
    if (field === 'namaAkun') {
      arr[idx] = { ...arr[idx], [field]: val };
    } else {
      const num = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
      arr[idx] = { ...arr[idx], [field]: num };
    }
    next[section] = arr;

    // Auto-recalculate SHU and sync Distribusi SHU nominals
    const newPendB = sumItems(next.pendapatan, 'nilaiBerjalan');
    const newPendL = sumItems(next.pendapatan, 'nilaiLalu');
    const newBebB = sumItems(next.beban, 'nilaiBerjalan');
    const newBebL = sumItems(next.beban, 'nilaiLalu');
    const newShuB = newPendB - newBebB;
    const newShuL = newPendL - newBebL;

    if (next.distribusiSHU && next.distribusiSHU.length > 0) {
      next.distribusiSHU = next.distribusiSHU.map(d => ({
        ...d,
        nilaiBerjalan: Math.round(newShuB * ((Number(d.persentase) || 0) / 100)),
        nilaiLalu: Math.round(newShuL * ((Number(d.persentase) || 0) / 100))
      }));
    }

    setPhuData(next);
  };

  // Handle edit Distribusi SHU (Auto Formula: SHU * %)
  const handleEditDistribusi = (
    idx: number,
    field: 'namaPos' | 'persentase' | 'nilaiBerjalan' | 'nilaiLalu',
    val: string
  ) => {
    const next = { ...phuData };
    const arr = [...next.distribusiSHU];

    const currentShuB = sumItems(next.pendapatan, 'nilaiBerjalan') - sumItems(next.beban, 'nilaiBerjalan');
    const currentShuL = sumItems(next.pendapatan, 'nilaiLalu') - sumItems(next.beban, 'nilaiLalu');

    if (field === 'namaPos') {
      arr[idx] = { ...arr[idx], [field]: val };
    } else if (field === 'persentase') {
      const pct = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
      arr[idx] = {
        ...arr[idx],
        persentase: pct,
        nilaiBerjalan: Math.round(currentShuB * (pct / 100)),
        nilaiLalu: Math.round(currentShuL * (pct / 100))
      };
    } else {
      const num = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
      arr[idx] = { ...arr[idx], [field]: num };
      // Auto update % if nominal edited directly
      if (field === 'nilaiBerjalan' && currentShuB > 0) {
        arr[idx].persentase = parseFloat(((num / currentShuB) * 100).toFixed(2));
      } else if (field === 'nilaiLalu' && currentShuL > 0) {
        arr[idx].persentase = parseFloat(((num / currentShuL) * 100).toFixed(2));
      }
    }

    next.distribusiSHU = arr;
    setPhuData(next);
  };

  // Save changes
  const handleSavePosisi = () => {
    StorageService.saveUploadedPosisiKeuangan(posisiData);
    showNotification('Laporan Posisi Keuangan (Neraca) berhasil disimpan dan disinkronkan!');
  };

  const handleSavePHU = () => {
    StorageService.saveUploadedPHU(phuData);
    showNotification('Perhitungan Hasil Usaha (PHU) berhasil disimpan dan disinkronkan!');
  };

  // Reset to original LPJ
  const handleResetPosisi = () => {
    if (window.confirm('Kembalikan Laporan Posisi Keuangan ke angka resmi baku LPJ Koperasi Warga Bahagia?')) {
      StorageService.resetUploadedPosisiKeuangan();
      setPosisiData(StorageService.getUploadedPosisiKeuangan());
      showNotification('Laporan Posisi Keuangan dikembalikan ke data resmi LPJ.');
    }
  };

  const handleResetPHU = () => {
    if (window.confirm('Kembalikan PHU ke angka resmi baku LPJ Koperasi Warga Bahagia?')) {
      StorageService.resetUploadedPHU();
      setPhuData(StorageService.getUploadedPHU());
      showNotification('PHU dikembalikan ke data resmi LPJ.');
    }
  };

  // Handle Excel upload for Posisi Keuangan
  const handleUploadExcelPosisi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await parseExcelPosisiKeuangan(file, posisiData);
      if (res.success && res.data) {
        setPosisiData(res.data);
        StorageService.saveUploadedPosisiKeuangan(res.data);
        showNotification(`Berkas "${file.name}" berhasil diunggah! Seluruh pos Posisi Keuangan telah diperbarui.`);
      } else {
        showNotification(res.error || 'Gagal memproses berkas Excel.', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Terjadi kesalahan saat membaca berkas.', true);
    } finally {
      setIsUploading(false);
      if (fileInputPosisiRef.current) fileInputPosisiRef.current.value = '';
    }
  };

  // Handle Excel upload for PHU
  const handleUploadExcelPHU = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await parseExcelPHU(file, phuData);
      if (res.success && res.data) {
        setPhuData(res.data);
        StorageService.saveUploadedPHU(res.data);
        showNotification(`Berkas "${file.name}" berhasil diunggah! Seluruh pos PHU & Distribusi SHU telah diperbarui.`);
      } else {
        showNotification(res.error || 'Gagal memproses berkas Excel.', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Terjadi kesalahan saat membaca berkas.', true);
    } finally {
      setIsUploading(false);
      if (fileInputPhuRef.current) fileInputPhuRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 select-text pb-12">
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold text-sm">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 text-xs font-bold px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Fitur Baru ke-6</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Upload Laporan Keuangan LPJ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kelola Laporan Posisi Keuangan (Neraca 2 Sisi) & Perhitungan Hasil Usaha (PHU / Laba Rugi) sesuai format resmi LPJ RAT Koperasi Warga Bahagia.
            </p>
          </div>

          {/* Quick Tab Selector */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setActiveTab('posisikeuangan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'posisikeuangan'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1. Posisi Keuangan (Neraca)</span>
            </button>
            <button
              onClick={() => setActiveTab('phu')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'phu'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>2. PHU (Laba Rugi)</span>
            </button>
          </div>
        </div>

        {/* Action Bar: Download PDF, Download Excel, Download Template, Upload, Save, Reset */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'posisikeuangan' ? (
              <>
                <button
                  type="button"
                  onClick={() => exportUploadedPosisiKeuanganPdf(posisiData)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-xs border border-rose-500"
                  title="Unduh Laporan Posisi Keuangan (Neraca) format PDF resmi dengan Kop & Tanda Tangan"
                >
                  <Printer className="w-4 h-4 text-rose-100" />
                  <span>Unduh PDF Hasil</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportUploadedPosisiKeuanganExcel(posisiData)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all cursor-pointer border border-emerald-300"
                  title="Unduh Buku Kerja Excel Laporan Posisi Keuangan (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Unduh Excel Hasil</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadTemplatePosisiKeuangan()}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-300"
                  title="Unduh Format Template Excel Kosong Baku LPJ untuk diisi"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Unduh Template Excel</span>
                </button>
                <input
                  type="file"
                  ref={fileInputPosisiRef}
                  onChange={handleUploadExcelPosisi}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputPosisiRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Unggah berkas Excel untuk memperbarui Laporan Posisi Keuangan secara otomatis"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isUploading ? 'Memproses...' : 'Upload Excel'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => exportUploadedPHUPdf(phuData)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-xs border border-rose-500"
                  title="Unduh Laporan PHU & Distribusi SHU format PDF resmi dengan Kop & Tanda Tangan"
                >
                  <Printer className="w-4 h-4 text-rose-100" />
                  <span>Unduh PDF Hasil</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportUploadedPHUExcel(phuData)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-cyan-100 hover:bg-cyan-200 rounded-xl transition-all cursor-pointer border border-cyan-300"
                  title="Unduh Buku Kerja Excel Perhitungan Hasil Usaha PHU (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-cyan-700" />
                  <span>Unduh Excel Hasil</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadTemplatePHU()}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-300"
                  title="Unduh Format Template Excel Kosong Baku LPJ PHU untuk diisi"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Unduh Template Excel</span>
                </button>
                <input
                  type="file"
                  ref={fileInputPhuRef}
                  onChange={handleUploadExcelPHU}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputPhuRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Unggah berkas Excel untuk memperbarui PHU secara otomatis"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isUploading ? 'Memproses...' : 'Upload Excel'}</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeTab === 'posisikeuangan' ? handleResetPosisi : handleResetPHU}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Kembalikan data ke angka LPJ resmi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke LPJ</span>
            </button>
            <button
              onClick={activeTab === 'posisikeuangan' ? handleSavePosisi : handleSavePHU}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LAPORAN POSISI KEUANGAN (NERACA 2 SISI)             */}
      {/* ========================================================= */}
      {activeTab === 'posisikeuangan' && (
        <div className="space-y-6">
          {/* Audit Balance Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Aset (Aktiva) {posisiData.tahunBerjalan}
              </div>
              <div className="text-xl font-black text-slate-900">
                {formatRp(totalAsetB)}
              </div>
              <div className="text-[11px] text-slate-500">
                Lancar ({formatRp(jmlAsetLancarB)}) + Sertaan ({formatRp(jmlPenyertaanB)}) + Tetap ({formatRp(jmlAsetTetapB)})
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Liabilitas & Ekuitas (Pasiva) {posisiData.tahunBerjalan}
              </div>
              <div className="text-xl font-black text-slate-900">
                {formatRp(totalLiabEkuitasB)}
              </div>
              <div className="text-[11px] text-slate-500">
                Liabilitas ({formatRp(jmlLiabilitasB)}) + Ekuitas ({formatRp(jmlEkuitasB)}) + SHU ({formatRp(shuB)})
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
                isBalanceB
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Status Keseimbangan (Audit)</span>
                {isBalanceB ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px]">
                    100% BALANCE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">
                    SELISIH
                  </span>
                )}
              </div>
              <div className="text-lg font-black flex items-center gap-2">
                {isBalanceB ? (
                  <>
                    <Scale className="w-5 h-5 text-emerald-600" />
                    <span>Seimbang Sempurna (Rp 0)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Selisih: {formatRp(selisihPosisiB)}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] opacity-80">
                Pembanding {posisiData.tahunLalu}: Aset {formatRp(totalAsetL)} = Pasiva {formatRp(totalLiabEkuitasL)} ({isBalanceL ? 'Cocok' : 'Ada Selisih'})
              </div>
            </div>
          </div>

          {/* Tabel Dua Sisi Format Buku LPJ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  LAPORAN POSISI KEUANGAN TAHUN USAHA {posisiData.tahunBerjalan}
                </h2>
                <p className="text-xs text-slate-300">
                  {namaKoperasiConfig} (Komparatif {posisiData.tahunBerjalan} & {posisiData.tahunLalu})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportUploadedPosisiKeuanganPdf(posisiData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Unduh Laporan Posisi Keuangan (Neraca) format PDF resmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportUploadedPosisiKeuanganExcel(posisiData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Unduh Buku Kerja Excel Laporan Posisi Keuangan (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                {/* Master Header */}
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-2 text-center w-8 border-r border-slate-200">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Aset (Aktiva)</th>
                    <th className="py-2.5 px-3 text-right w-32 border-r border-slate-200">{posisiData.tahunBerjalan}</th>
                    <th className="py-2.5 px-3 text-right w-32 border-r-2 border-slate-400">{posisiData.tahunLalu}</th>
                    <th className="py-2.5 px-2 text-center w-8 border-r border-slate-200">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Liabilitas & Ekuitas (Pasiva)</th>
                    <th className="py-2.5 px-3 text-right w-32 border-r border-slate-200">{posisiData.tahunBerjalan}</th>
                    <th className="py-2.5 px-3 text-right w-32">{posisiData.tahunLalu}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {/* Row Section Header: A. Aset Lancar vs A. Liabilitas */}
                  <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                    <td className="py-2 px-2 text-center border-r border-slate-200">A</td>
                    <td className="py-2 px-3 border-r border-slate-200">Aset Lancar</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right border-r-2 border-slate-400"></td>
                    <td className="py-2 px-2 text-center border-r border-slate-200">A</td>
                    <td className="py-2 px-3 border-r border-slate-200">Liabilitas</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right"></td>
                  </tr>

                  {/* Section A Items side-by-side */}
                  {Array.from({
                    length: Math.max(posisiData.asetLancar.length, posisiData.liabilitas.length)
                  }).map((_, idx) => {
                    const l = posisiData.asetLancar[idx];
                    const r = posisiData.liabilitas[idx];
                    return (
                      <tr key={`sec-a-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* Left Side: Aset Lancar */}
                        <td className="py-1.5 px-2 text-center text-slate-400 border-r border-slate-200">
                          {l?.no || ''}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-200">
                          {l ? (
                            <input
                              type="text"
                              value={l.namaAkun}
                              onChange={(e) => handleEditPosisi('asetLancar', idx, 'namaAkun', e.target.value)}
                              className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200">
                          {l ? (
                            <input
                              type="text"
                              value={l.nilaiBerjalan.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('asetLancar', idx, 'nilaiBerjalan', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right border-r-2 border-slate-400 text-slate-600">
                          {l ? (
                            <input
                              type="text"
                              value={l.nilaiLalu.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('asetLancar', idx, 'nilaiLalu', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : null}
                        </td>

                        {/* Right Side: Liabilitas */}
                        <td className="py-1.5 px-2 text-center text-slate-400 border-r border-slate-200">
                          {r?.no || ''}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-200">
                          {r ? (
                            <input
                              type="text"
                              value={r.namaAkun}
                              onChange={(e) => handleEditPosisi('liabilitas', idx, 'namaAkun', e.target.value)}
                              className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200">
                          {r ? (
                            <input
                              type="text"
                              value={r.nilaiBerjalan.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('liabilitas', idx, 'nilaiBerjalan', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right text-slate-600">
                          {r ? (
                            <input
                              type="text"
                              value={r.nilaiLalu.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('liabilitas', idx, 'nilaiLalu', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Subtotal Section A */}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-y border-slate-200">
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200">Jumlah Aset lancar</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-emerald-800">
                      {jmlAsetLancarB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right border-r-2 border-slate-400 text-slate-700">
                      {jmlAsetLancarL.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200">Jumlah Liabilitas</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-rose-800">
                      {jmlLiabilitasB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {jmlLiabilitasL.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* Row Section Header: B. Penyertaan vs B. Ekuitas */}
                  <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                    <td className="py-2 px-2 text-center border-r border-slate-200">B</td>
                    <td className="py-2 px-3 border-r border-slate-200">Penyertaan</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right border-r-2 border-slate-400"></td>
                    <td className="py-2 px-2 text-center border-r border-slate-200">B</td>
                    <td className="py-2 px-3 border-r border-slate-200">Ekuitas</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right"></td>
                  </tr>

                  {/* Section B Items */}
                  {Array.from({
                    length: Math.max(posisiData.penyertaan.length, posisiData.ekuitas.length)
                  }).map((_, idx) => {
                    const l = posisiData.penyertaan[idx];
                    const r = posisiData.ekuitas[idx];
                    return (
                      <tr key={`sec-b-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* Left Side: Penyertaan */}
                        <td className="py-1.5 px-2 text-center text-slate-400 border-r border-slate-200">
                          {l?.no || ''}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-200">
                          {l ? (
                            <input
                              type="text"
                              value={l.namaAkun}
                              onChange={(e) => handleEditPosisi('penyertaan', idx, 'namaAkun', e.target.value)}
                              className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200">
                          {l ? (
                            <input
                              type="text"
                              value={l.nilaiBerjalan.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('penyertaan', idx, 'nilaiBerjalan', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right border-r-2 border-slate-400 text-slate-600">
                          {l ? (
                            <input
                              type="text"
                              value={l.nilaiLalu.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('penyertaan', idx, 'nilaiLalu', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : null}
                        </td>

                        {/* Right Side: Ekuitas */}
                        <td className="py-1.5 px-2 text-center text-slate-400 border-r border-slate-200">
                          {r?.no || ''}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-200">
                          {r ? (
                            <input
                              type="text"
                              value={r.namaAkun}
                              onChange={(e) => handleEditPosisi('ekuitas', idx, 'namaAkun', e.target.value)}
                              className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right border-r border-slate-200">
                          {r ? (
                            <input
                              type="text"
                              value={r.nilaiBerjalan.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('ekuitas', idx, 'nilaiBerjalan', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                            />
                          ) : null}
                        </td>
                        <td className="py-1.5 px-3 text-right text-slate-600">
                          {r ? (
                            <input
                              type="text"
                              value={r.nilaiLalu.toLocaleString('id-ID')}
                              onChange={(e) => handleEditPosisi('ekuitas', idx, 'nilaiLalu', e.target.value)}
                              className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Subtotal Section B */}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-y border-slate-200">
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200">Jumlah Penyertaan</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-emerald-800">
                      {jmlPenyertaanB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right border-r-2 border-slate-400 text-slate-700">
                      {jmlPenyertaanL.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200">Jumlah Ekuitas</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-emerald-800">
                      {jmlEkuitasB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {jmlEkuitasL.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* Row Section C: C. Aset Tetap vs SHU Tahun Berjalan */}
                  <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                    <td className="py-2 px-2 text-center border-r border-slate-200">C</td>
                    <td className="py-2 px-3 border-r border-slate-200">Aset Tetap</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right border-r-2 border-slate-400"></td>
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200 font-extrabold text-amber-900">
                      SHU Tahun Berjalan
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 font-black text-amber-800">
                      <input
                        type="text"
                        value={posisiData.shuTahunBerjalan?.nilaiBerjalan.toLocaleString('id-ID')}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value.replace(/[^\d.-]/g, '')) || 0;
                          setPosisiData({
                            ...posisiData,
                            shuTahunBerjalan: { ...posisiData.shuTahunBerjalan, nilaiBerjalan: num }
                          });
                        }}
                        className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-amber-500 font-black"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 font-bold">
                      <input
                        type="text"
                        value={posisiData.shuTahunBerjalan?.nilaiLalu.toLocaleString('id-ID')}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value.replace(/[^\d.-]/g, '')) || 0;
                          setPosisiData({
                            ...posisiData,
                            shuTahunBerjalan: { ...posisiData.shuTahunBerjalan, nilaiLalu: num }
                          });
                        }}
                        className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-amber-500 font-bold"
                      />
                    </td>
                  </tr>

                  {/* Section C Items */}
                  {posisiData.asetTetap.map((l, idx) => (
                    <tr key={`sec-c-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-2 text-center text-slate-400 border-r border-slate-200">
                        {l.no}
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-200">
                        <input
                          type="text"
                          value={l.namaAkun}
                          onChange={(e) => handleEditPosisi('asetTetap', idx, 'namaAkun', e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right border-r border-slate-200">
                        <input
                          type="text"
                          value={l.nilaiBerjalan.toLocaleString('id-ID')}
                          onChange={(e) => handleEditPosisi('asetTetap', idx, 'nilaiBerjalan', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right border-r-2 border-slate-400 text-slate-600">
                        <input
                          type="text"
                          value={l.nilaiLalu.toLocaleString('id-ID')}
                          onChange={(e) => handleEditPosisi('asetTetap', idx, 'nilaiLalu', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200"></td>
                      <td className="py-1.5 px-3 border-r border-slate-200"></td>
                      <td className="py-1.5 px-3 text-right border-r border-slate-200"></td>
                      <td className="py-1.5 px-3 text-right"></td>
                    </tr>
                  ))}

                  {/* Subtotal Section C */}
                  <tr className="bg-slate-100/80 font-bold text-slate-900 border-y border-slate-200">
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200">Jumlah Aset Tetap</td>
                    <td className="py-2 px-3 text-right border-r border-slate-200 text-emerald-800">
                      {jmlAsetTetapB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right border-r-2 border-slate-400 text-slate-700">
                      {jmlAsetTetapL.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-3 text-right"></td>
                  </tr>

                  {/* TOTAL AKHIR: TOTAL ASET VS TOTAL LIABILITAS & EKUITAS */}
                  <tr className="bg-slate-900 text-white font-black text-xs sm:text-sm">
                    <td className="py-3 px-2 text-center border-r border-slate-700"></td>
                    <td className="py-3 px-3 uppercase tracking-wider border-r border-slate-700">
                      TOTAL ASET
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 border-r border-slate-700">
                      {totalAsetB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 border-r-2 border-slate-500">
                      {totalAsetL.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-700"></td>
                    <td className="py-3 px-3 uppercase tracking-wider border-r border-slate-700">
                      TOTAL LIABILITAS & EKUITAS
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 border-r border-slate-700">
                      {totalLiabEkuitasB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {totalLiabEkuitasL.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PERHITUNGAN HASIL USAHA (PHU / LABA RUGI)           */}
      {/* ========================================================= */}
      {activeTab === 'phu' && (
        <div className="space-y-6">
          {/* PHU Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Pendapatan ({phuData.tahunBerjalan})
              </div>
              <div className="text-xl font-black text-emerald-700">
                {formatRp(totalPendapatanB)}
              </div>
              <div className="text-[11px] text-slate-500">
                Pembanding {phuData.tahunLalu}: {formatRp(totalPendapatanL)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Beban Operasional ({phuData.tahunBerjalan})
              </div>
              <div className="text-xl font-black text-rose-700">
                {formatRp(totalBebanB)}
              </div>
              <div className="text-[11px] text-slate-500">
                Pembanding {phuData.tahunLalu}: {formatRp(totalBebanL)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xs space-y-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                <span>SHU Tahun Berjalan</span>
                <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  SURPLUS LPJ
                </span>
              </div>
              <div className="text-2xl font-black">
                {formatRp(shuPhuB)}
              </div>
              <div className="text-[11px] font-medium text-slate-900">
                Tahun Pembanding {phuData.tahunLalu}: {formatRp(shuPhuL)}
              </div>
            </div>
          </div>

          {/* Tabel PHU Sesuai Format Gambar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  PERHITUNGAN HASIL USAHA (PHU)
                </h2>
                <p className="text-xs text-slate-300">
                  PER 31 DESEMBER {phuData.tahunLalu} DAN {phuData.tahunBerjalan} · {namaKoperasiConfig}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportUploadedPHUPdf(phuData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Unduh PHU & Distribusi SHU format PDF resmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Unduh PDF PHU</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportUploadedPHUExcel(phuData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Unduh Buku Kerja Excel PHU (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Excel PHU</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">No</th>
                    <th className="py-2.5 px-4 border-r border-slate-200">Uraian Akun PHU</th>
                    <th className="py-2.5 px-4 text-right w-44 border-r border-slate-200">{phuData.tahunBerjalan}</th>
                    <th className="py-2.5 px-4 text-right w-44">{phuData.tahunLalu}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {/* I. PENDAPATAN */}
                  <tr className="bg-emerald-50/80 font-bold text-emerald-950">
                    <td className="py-2 px-3 text-center border-r border-slate-200">I</td>
                    <td className="py-2 px-4 border-r border-slate-200">PENDAPATAN</td>
                    <td className="py-2 px-4 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-4 text-right"></td>
                  </tr>

                  {phuData.pendapatan.map((p, idx) => (
                    <tr key={`pend-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">
                        {p.no}
                      </td>
                      <td className="py-1.5 px-4 border-r border-slate-200">
                        <input
                          type="text"
                          value={p.namaAkun}
                          onChange={(e) => handleEditPHU('pendapatan', idx, 'namaAkun', e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500 font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-4 text-right border-r border-slate-200">
                        <input
                          type="text"
                          value={p.nilaiBerjalan.toLocaleString('id-ID')}
                          onChange={(e) => handleEditPHU('pendapatan', idx, 'nilaiBerjalan', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500 font-semibold"
                        />
                      </td>
                      <td className="py-1.5 px-4 text-right text-slate-600">
                        <input
                          type="text"
                          value={p.nilaiLalu.toLocaleString('id-ID')}
                          onChange={(e) => handleEditPHU('pendapatan', idx, 'nilaiLalu', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal Pendapatan */}
                  <tr className="bg-slate-100/90 font-bold text-slate-900 border-y border-slate-200">
                    <td className="py-2.5 px-3 text-center border-r border-slate-200"></td>
                    <td className="py-2.5 px-4 border-r border-slate-200 uppercase tracking-wide">Jumlah Pendapatan</td>
                    <td className="py-2.5 px-4 text-right border-r border-slate-200 text-emerald-700 font-black">
                      {totalPendapatanB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 font-bold">
                      {totalPendapatanL.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* II. BEBAN ADMINISTRASI DAN BEBAN UMUM */}
                  <tr className="bg-rose-50/80 font-bold text-rose-950">
                    <td className="py-2 px-3 text-center border-r border-slate-200">II</td>
                    <td className="py-2 px-4 border-r border-slate-200">BEBAN ADMINISTRASI DAN BEBAN UMUM</td>
                    <td className="py-2 px-4 text-right border-r border-slate-200"></td>
                    <td className="py-2 px-4 text-right"></td>
                  </tr>

                  {phuData.beban.map((b, idx) => (
                    <tr key={`beban-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200">
                        {b.no}
                      </td>
                      <td className="py-1.5 px-4 border-r border-slate-200">
                        <input
                          type="text"
                          value={b.namaAkun}
                          onChange={(e) => handleEditPHU('beban', idx, 'namaAkun', e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500 font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-4 text-right border-r border-slate-200">
                        <input
                          type="text"
                          value={b.nilaiBerjalan.toLocaleString('id-ID')}
                          onChange={(e) => handleEditPHU('beban', idx, 'nilaiBerjalan', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500 font-semibold"
                        />
                      </td>
                      <td className="py-1.5 px-4 text-right text-slate-600">
                        <input
                          type="text"
                          value={b.nilaiLalu.toLocaleString('id-ID')}
                          onChange={(e) => handleEditPHU('beban', idx, 'nilaiLalu', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal Beban */}
                  <tr className="bg-slate-100/90 font-bold text-slate-900 border-y border-slate-200">
                    <td className="py-2.5 px-3 text-center border-r border-slate-200"></td>
                    <td className="py-2.5 px-4 border-r border-slate-200 uppercase tracking-wide">Jumlah Beban-beban</td>
                    <td className="py-2.5 px-4 text-right border-r border-slate-200 text-rose-700 font-black">
                      {totalBebanB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 font-bold">
                      {totalBebanL.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* SHU TAHUN BERJALAN */}
                  <tr className="bg-amber-100 text-amber-950 font-black text-sm border-y-2 border-amber-300">
                    <td className="py-3 px-3 text-center border-r border-amber-200">★</td>
                    <td className="py-3 px-4 border-r border-amber-200 uppercase tracking-wider">
                      SHU TAHUN BERJALAN
                    </td>
                    <td className="py-3 px-4 text-right border-r border-amber-200 text-emerald-900 font-black text-base">
                      {shuPhuB.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900 font-bold text-base">
                      {shuPhuL.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* DISTRIBUSI SHU SECTION */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="py-2.5 px-3 text-center border-r border-slate-700 text-[11px] text-amber-300">
                      %
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-700 uppercase tracking-wider text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>DISTRIBUSI SHU KOPERASI</span>
                        <span className="text-[10px] text-amber-300 font-normal">Formula: SHU Berjalan × % Distribusi</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right border-r border-slate-700 text-[11px] text-slate-300">
                      {phuData.tahunBerjalan}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[11px] text-slate-300">
                      {phuData.tahunLalu}
                    </td>
                  </tr>

                  {phuData.distribusiSHU.map((d, idx) => (
                    <tr key={`dist-${idx}`} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-1.5 px-2 text-center border-r border-slate-200 bg-amber-50/60">
                        <div className="flex items-center justify-center gap-0.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={d.persentase}
                            onChange={(e) => handleEditDistribusi(idx, 'persentase', e.target.value)}
                            className="w-14 text-center bg-white border border-amber-300 focus:border-amber-500 rounded px-1 py-0.5 outline-hidden focus:ring-1 focus:ring-amber-500 font-black text-amber-950 text-xs shadow-2xs"
                            title="Ubah persentase alokasi untuk menghitung nominal otomatis"
                          />
                          <span className="text-amber-900 font-black text-xs">%</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-4 border-r border-slate-200 font-medium">
                        <input
                          type="text"
                          value={d.namaPos}
                          onChange={(e) => handleEditDistribusi(idx, 'namaPos', e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500 font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-4 text-right border-r border-slate-200">
                        <input
                          type="text"
                          value={d.nilaiBerjalan.toLocaleString('id-ID')}
                          onChange={(e) => handleEditDistribusi(idx, 'nilaiBerjalan', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500 font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-1.5 px-4 text-right text-slate-600">
                        <input
                          type="text"
                          value={d.nilaiLalu.toLocaleString('id-ID')}
                          onChange={(e) => handleEditDistribusi(idx, 'nilaiLalu', e.target.value)}
                          className="w-full text-right bg-transparent hover:bg-slate-100 focus:bg-white rounded px-2 py-0.5 outline-hidden focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal Distribusi SHU */}
                  {(() => {
                    const sumPersen = phuData.distribusiSHU.reduce((acc, c) => acc + (Number(c.persentase) || 0), 0);
                    const sumDistB = phuData.distribusiSHU.reduce((acc, c) => acc + (Number(c.nilaiBerjalan) || 0), 0);
                    const sumDistL = phuData.distribusiSHU.reduce((acc, c) => acc + (Number(c.nilaiLalu) || 0), 0);
                    return (
                      <tr className="bg-amber-100/80 font-black text-amber-950 border-t-2 border-amber-300 text-xs">
                        <td className="py-2.5 px-2 text-center border-r border-amber-200 font-black">
                          {sumPersen}%
                        </td>
                        <td className="py-2.5 px-4 border-r border-amber-200 uppercase tracking-wide">
                          TOTAL ALOKASI DISTRIBUSI SHU
                        </td>
                        <td className="py-2.5 px-4 text-right border-r border-amber-200 text-emerald-900 font-black">
                          {sumDistB.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-900 font-bold">
                          {sumDistL.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
