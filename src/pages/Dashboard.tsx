import React, { useState, useEffect } from 'react';
import {
  Anggota,
  JurnalItem,
  SimpananRecord,
  PinjamanUang,
  PinjamanBarang,
  PengajuanPinjaman,
  PembukuanTokoItem,
  PembukuanSeragamItem
} from '../types';
import { formatRupiah } from '../utils/exportExcel';
import { exportRingkasanKeuanganBulananPdf, NAMA_BULAN } from '../utils/exportPdf';
import {
  Users,
  BookOpen,
  Banknote,
  HandCoins,
  Store,
  Shirt,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CheckCircle,
  PlusCircle,
  CreditCard,
  Settings,
  Check,
  ArrowRight,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Layers,
  ShieldCheck,
  FileText,
  Printer,
  Download,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import { StorageService } from '../utils/storage';

interface DashboardProps {
  anggotaList: Anggota[];
  jurnalList: JurnalItem[];
  simpananList: SimpananRecord[];
  pinjamanUangList: PinjamanUang[];
  pinjamanBarangList: PinjamanBarang[];
  pengajuanList: PengajuanPinjaman[];
  tokoList: PembukuanTokoItem[];
  seragamList: PembukuanSeragamItem[];
  onNavigate: (tab: string) => void;
  onNavigateSubTab?: (tab: string, subTab?: string) => void;
  onDataChanged?: () => void;
  onOpenPublicForm: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  anggotaList,
  jurnalList,
  simpananList,
  pinjamanUangList,
  pinjamanBarangList,
  pengajuanList,
  tokoList,
  seragamList,
  onNavigate,
  onNavigateSubTab,
  onDataChanged,
  onOpenPublicForm
}) => {
  const [dashboardSuccessAlert, setDashboardSuccessAlert] = useState<{
    text: string;
    type: 'uang' | 'barang';
  } | null>(null);

  // Monthly Financial Summary Report PDF states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear() || 2026);

  // Real-time synchronization on data change events
  useEffect(() => {
    const handleDataChanged = () => {
      onDataChanged?.();
    };
    window.addEventListener('koperasi-data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('koperasi-data-changed', handleDataChanged);
    };
  }, [onDataChanged]);

  const pengaturan = StorageService.getPengaturan();
  const currentLogo = pengaturan.logoUrl || defaultLogoImg;

  // Function to download Monthly PDF Report
  const handleDownloadReport = () => {
    exportRingkasanKeuanganBulananPdf({
      bulan: selectedBulan,
      tahun: selectedTahun,
      jurnalList,
      simpananList,
      pinjamanUangList,
      pinjamanBarangList,
      tokoList,
      seragamList,
      anggotaList
    });
    setIsReportModalOpen(false);
  };

  // Filtered preview calculations for the modal
  const previewJurnal = jurnalList.filter((item) => {
    if (!item.tanggal) return false;
    const parts = item.tanggal.split('-');
    if (parts.length < 3) return true;
    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10);
    if (itemYear !== selectedTahun) return false;
    if (selectedBulan > 0 && itemMonth !== selectedBulan) return false;
    return true;
  });

  const previewKasMasuk = previewJurnal.reduce((acc, curr) => acc + (Number(curr.debet) || 0), 0);
  const previewKasKeluar = previewJurnal.reduce((acc, curr) => acc + (Number(curr.kredit) || 0), 0);
  const previewNetCashFlow = previewKasMasuk - previewKasKeluar;

  // Financial metrics
  const kasJurnalUmum = jurnalList.length > 0 ? jurnalList[jurnalList.length - 1].saldoAkhir : 0;
  const kasToko = tokoList.length > 0 ? tokoList[tokoList.length - 1].saldoAkhir : 0;
  const kasSeragam = seragamList.length > 0 ? seragamList[seragamList.length - 1].saldoAkhir : 0;

  // Real-time Simpanan Metrics Breakdown
  const totalPokok = simpananList.reduce((acc, curr) => acc + (curr.simpananPokok || 0), 0);
  const totalWajib = simpananList.reduce((acc, curr) => acc + (curr.simpananWajib || 0), 0);
  const totalSukarela = simpananList.reduce((acc, curr) => acc + (curr.simpananSukarela || 0), 0);
  const totalSimpanan = totalPokok + totalWajib + totalSukarela;

  const totalAnggotaMenabung = simpananList.filter(
    (s) => (s.simpananPokok || 0) + (s.simpananWajib || 0) + (s.simpananSukarela || 0) > 0
  ).length;

  const persenAnggotaMenabung =
    anggotaList.length > 0 ? Math.round((totalAnggotaMenabung / anggotaList.length) * 100) : 0;

  const rataRataSimpanan =
    simpananList.length > 0 ? Math.round(totalSimpanan / simpananList.length) : 0;

  const persenPokok =
    totalSimpanan > 0 ? Number(((totalPokok / totalSimpanan) * 100).toFixed(1)) : 0;
  const persenWajib =
    totalSimpanan > 0 ? Number(((totalWajib / totalSimpanan) * 100).toFixed(1)) : 0;
  const persenSukarela =
    totalSimpanan > 0 ? Number(((totalSukarela / totalSimpanan) * 100).toFixed(1)) : 0;

  const topPenyimpan = [...simpananList]
    .map((s) => ({
      ...s,
      total: (s.simpananPokok || 0) + (s.simpananWajib || 0) + (s.simpananSukarela || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // Pinjaman Metrics
  const totalPlafonPinjamanUang = pinjamanUangList.reduce(
    (acc, curr) => acc + (curr.jumlahPinjaman || 0),
    0
  );
  const totalTerbayarPinjamanUang = pinjamanUangList.reduce(
    (acc, curr) => acc + (curr.totalDibayar || 0),
    0
  );
  const totalSisaPinjamanUang = pinjamanUangList.reduce(
    (acc, curr) => acc + (curr.sisaPinjaman || 0),
    0
  );

  const totalPlafonPinjamanBarang = pinjamanBarangList.reduce(
    (acc, curr) => acc + (curr.hargaBarang || 0),
    0
  );
  const totalTerbayarPinjamanBarang = pinjamanBarangList.reduce(
    (acc, curr) => acc + (curr.totalDibayar || 0),
    0
  );
  const totalSisaPinjamanBarang = pinjamanBarangList.reduce(
    (acc, curr) => acc + (curr.sisaPinjaman || 0),
    0
  );

  const totalSemuaPinjamanAktif = totalSisaPinjamanUang + totalSisaPinjamanBarang;
  const totalSemuaPlafonPinjaman = totalPlafonPinjamanUang + totalPlafonPinjamanBarang;
  const totalSemuaTerbayarPinjaman = totalTerbayarPinjamanUang + totalTerbayarPinjamanBarang;

  const pinjamanUangAktifCount = pinjamanUangList.filter((p) => p.status === 'Aktif').length;
  const pinjamanUangLunasCount = pinjamanUangList.filter((p) => p.status === 'Lunas').length;

  const pinjamanBarangAktifCount = pinjamanBarangList.filter((p) => p.status === 'Aktif').length;
  const pinjamanBarangLunasCount = pinjamanBarangList.filter((p) => p.status === 'Lunas').length;

  const pendingPengajuan = pengajuanList.filter((p) => p.status === 'Menunggu');

  // Keanggotaan Stats
  const countPNS = anggotaList.filter((a) => a.jenisKepegawaian === 'PNS').length;
  const countPPPK = anggotaList.filter((a) => a.jenisKepegawaian === 'PPPK').length;
  const countNonASN = anggotaList.filter((a) => a.jenisKepegawaian === 'Non ASN').length;
  const countPurnaBakti = anggotaList.filter((a) => a.jenisKepegawaian === 'Purna Bakti').length;

  // Chart Data 1: Komposisi Simpanan (Donut)
  const simpananPieData = [
    { name: 'Simpanan Pokok', value: totalPokok, color: '#059669' },
    { name: 'Simpanan Wajib', value: totalWajib, color: '#0d9488' },
    { name: 'Simpanan Sukarela', value: totalSukarela, color: '#d97706' }
  ].filter((d) => d.value > 0);

  // Chart Data 2: Top 5 Anggota Penabung Terbesar
  const topSaversChartData = [...simpananList]
    .map((s) => ({
      name: s.namaAnggota.split(' ')[0] || s.nomorAnggota,
      fullName: s.namaAnggota,
      noAnggota: s.nomorAnggota,
      pokok: s.simpananPokok || 0,
      wajib: s.simpananWajib || 0,
      sukarela: s.simpananSukarela || 0,
      total: (s.simpananPokok || 0) + (s.simpananWajib || 0) + (s.simpananSukarela || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Chart Data 3: Portofolio Pinjaman (Uang vs Barang)
  const loanComparisonChartData = [
    {
      kategori: 'Pinjaman Uang',
      'Plafon Total': totalPlafonPinjamanUang,
      'Sudah Dicicil': totalTerbayarPinjamanUang,
      'Sisa Pinjaman Aktif': totalSisaPinjamanUang
    },
    {
      kategori: 'Pinjaman Barang',
      'Plafon Total': totalPlafonPinjamanBarang,
      'Sudah Dicicil': totalTerbayarPinjamanBarang,
      'Sisa Pinjaman Aktif': totalSisaPinjamanBarang
    }
  ];

  // Chart Data 4: Status Pinjaman
  const loanStatusPieData = [
    { name: 'Pinj. Uang Aktif', value: pinjamanUangAktifCount, color: '#0284c7' },
    { name: 'Pinj. Barang Aktif', value: pinjamanBarangAktifCount, color: '#7c3aed' },
    {
      name: 'Pinjaman Lunas',
      value: pinjamanUangLunasCount + pinjamanBarangLunasCount,
      color: '#10b981'
    },
    { name: 'Pengajuan Menunggu', value: pendingPengajuan.length, color: '#f59e0b' }
  ].filter((d) => d.value > 0);

  // Custom Rupiah Tooltip for Recharts
  const CustomRupiahTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 backdrop-blur-sm">
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
            {label || payload[0].payload?.fullName || payload[0].name}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {typeof entry.value === 'number' && entry.value > 1000
                  ? formatRupiah(entry.value)
                  : `${entry.value} Transaksi`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={currentLogo}
                alt="Logo KWB"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                  SMAN 19 Bandung
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                Sistem Informasi Manajemen Koperasi Pegawai: Layanan Keanggotaan, Pembukuan Jurnal Umum, Tabungan Simpanan, Peminjaman Uang & Barang, serta Unit Usaha Pertokoan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Anggota */}
        <div
          onClick={() => onNavigate('keanggotaan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Aktif
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">Total Anggota Koperasi</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight tabular-nums">
            {anggotaList.length} <span className="text-xs font-normal text-slate-400">Orang</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {countPNS} PNS · {countPPPK} PPPK · {countNonASN} Non ASN
          </div>
        </div>

        {/* 2. Total Simpanan Anggota */}
        <div
          onClick={() => onNavigate('simpanan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {persenAnggotaMenabung}% Menabung
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">Total Simpanan Anggota</div>
          <div className="text-2xl font-bold text-teal-700 mt-0.5 tracking-tight tabular-nums font-mono">
            {formatRupiah(totalSimpanan)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pokok: {formatRupiah(totalPokok)}
          </div>
        </div>

        {/* 3. Total Pinjaman Aktif */}
        <div
          onClick={() => onNavigate('peminjaman')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HandCoins className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {pinjamanUangAktifCount + pinjamanBarangAktifCount} Aktif
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">Sisa Pokok Pinjaman Aktif</div>
          <div className="text-2xl font-bold text-amber-700 mt-0.5 tracking-tight tabular-nums font-mono">
            {formatRupiah(totalSemuaPinjamanAktif)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Uang: {formatRupiah(totalSisaPinjamanUang)} · Barang: {formatRupiah(totalSisaPinjamanBarang)}
          </div>
        </div>

        {/* 4. Kas Unit Toko & Seragam */}
        <div
          onClick={() => onNavigate('pertokoan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Toko & Seragam
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">Saldo Kas Unit Pertokoan</div>
          <div className="text-2xl font-bold text-indigo-700 mt-0.5 tracking-tight tabular-nums font-mono">
            {formatRupiah(kasToko + kasSeragam)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Toko: {formatRupiah(kasToko)} · Seragam: {formatRupiah(kasSeragam)}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISUALISASI DATA (RECHARTS): SIMPANAN & PINJAMAN AKTIF   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Visualisasi Ringkasan Simpanan Anggota */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Grafik Komposisi & Distribusi Simpanan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Proporsi Simpanan Pokok, Wajib, dan Sukarela Anggota
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('simpanan')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Rincian</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Donut Chart & Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-6 h-52">
                {totalSimpanan > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={simpananPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {simpananPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomRupiahTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center">
                    Belum ada data simpanan tersimpan
                  </div>
                )}
              </div>

              {/* Legend & Breakdown stats */}
              <div className="sm:col-span-6 space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-medium">Simpanan Pokok</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-800">
                      {formatRupiah(totalPokok)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">{persenPokok}%</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-600 shrink-0" />
                    <span className="text-slate-700 font-medium">Simpanan Wajib</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-teal-800">
                      {formatRupiah(totalWajib)}
                    </div>
                    <div className="text-[10px] text-teal-600 font-semibold">{persenWajib}%</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0" />
                    <span className="text-slate-700 font-medium">Simpanan Sukarela</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-amber-800">
                      {formatRupiah(totalSukarela)}
                    </div>
                    <div className="text-[10px] text-amber-600 font-semibold">{persenSukarela}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini Bar Chart for Top 5 Savers */}
            {topSaversChartData.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Top 5 Anggota Penabung Terbesar:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Akumulasi Total</span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topSaversChartData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#64748b' }}
                        tickFormatter={(val) => `${(val / 1000000).toFixed(1)}jt`}
                      />
                      <Tooltip content={<CustomRupiahTooltip />} />
                      <Bar dataKey="pokok" name="Simpanan Pokok" stackId="a" fill="#059669" />
                      <Bar dataKey="wajib" name="Simpanan Wajib" stackId="a" fill="#0d9488" />
                      <Bar
                        dataKey="sukarela"
                        name="Simpanan Sukarela"
                        stackId="a"
                        fill="#d97706"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Visualisasi Total Pinjaman Aktif & Portofolio */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Grafik Ringkasan Total Pinjaman Aktif
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbandingan Plafon, Realisasi Terbayar & Sisa Pinjaman Aktif
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('peminjaman')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Kelola</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grouped Bar Chart */}
            <div className="h-56 w-full">
              {totalSemuaPlafonPinjaman > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={loanComparisonChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="kategori" tick={{ fontSize: 11, fill: '#334155' }} />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}jt`}
                    />
                    <Tooltip content={<CustomRupiahTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="Plafon Total"
                      name="Plafon Total"
                      fill="#64748b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Sudah Dicicil"
                      name="Sudah Dicicil"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Sisa Pinjaman Aktif"
                      name="Sisa Pokok Aktif"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center">
                  Belum ada data pinjaman aktif saat ini
                </div>
              )}
            </div>

            {/* Bottom Loan Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Total Plafon Disalurkan</div>
                <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                  {formatRupiah(totalSemuaPlafonPinjaman)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Uang & Barang</div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <div className="text-[11px] text-emerald-800 font-medium">Realisasi Pengembalian</div>
                <div className="font-mono font-bold text-emerald-800 text-sm mt-0.5">
                  {formatRupiah(totalSemuaTerbayarPinjaman)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {totalSemuaPlafonPinjaman > 0
                    ? Math.round((totalSemuaTerbayarPinjaman / totalSemuaPlafonPinjaman) * 100)
                    : 0}
                  % Terbayar
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <div className="text-[11px] text-amber-800 font-medium">Sisa Pokok Aktif</div>
                <div className="font-mono font-bold text-amber-800 text-sm mt-0.5">
                  {formatRupiah(totalSemuaPinjamanAktif)}
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">
                  {pinjamanUangAktifCount + pinjamanBarangAktifCount} Rekening Aktif
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED REAL-TIME SUMMARY CARD: TOTAL SIMPANAN SELURUH ANGGOTA */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Rincian Detail Buku Simpanan Seluruh Anggota
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  Real-time Terhubung
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Akumulasi dana simpanan pokok, simpanan wajib, dan simpanan sukarela dari seluruh anggota aktif koperasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('simpanan')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Kelola Simpanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Big Hero Highlight Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-36 h-36 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between text-emerald-200/90 text-xs font-semibold">
                <span className="uppercase tracking-wider">Total Simpanan Keseluruhan</span>
                <span className="p-1.5 bg-white/10 rounded-lg text-emerald-300">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-3">
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono tabular-nums">
                  {formatRupiah(totalSimpanan)}
                </div>
                <div className="text-xs text-emerald-200 mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Akumulasi saldo riil dari {simpananList.length} data buku simpanan</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Inside Hero */}
            <div className="relative z-10 mt-6 pt-5 border-t border-emerald-800/80 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-emerald-300 text-[11px]">Anggota Menyimpan</div>
                <div className="font-bold text-white font-mono text-sm mt-0.5">
                  {totalAnggotaMenabung} <span className="text-[11px] font-normal text-emerald-200">/ {anggotaList.length} Orang</span>
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  {persenAnggotaMenabung}% Partisipasi
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-emerald-300 text-[11px]">Rata-Rata Simpanan</div>
                <div className="font-bold text-white font-mono text-sm mt-0.5">
                  {formatRupiah(rataRataSimpanan)}
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  Per Anggota Aktif
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Breakdown per Category */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Komposisi Portofolio Simpanan</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  100% Terakumulasi
                </span>
              </div>

              {/* Progress bar container */}
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                {totalSimpanan > 0 ? (
                  <>
                    <div
                      style={{ width: `${persenPokok}%` }}
                      className="bg-emerald-600 h-full transition-all duration-500"
                      title={`Simpanan Pokok: ${persenPokok}%`}
                    />
                    <div
                      style={{ width: `${persenWajib}%` }}
                      className="bg-teal-500 h-full transition-all duration-500"
                      title={`Simpanan Wajib: ${persenWajib}%`}
                    />
                    <div
                      style={{ width: `${persenSukarela}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Simpanan Sukarela: ${persenSukarela}%`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-300 h-full" />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs mt-2.5 pt-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span className="font-medium text-slate-700">Pokok ({persenPokok}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                  <span className="font-medium text-slate-700">Wajib ({persenWajib}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="font-medium text-slate-700">Sukarela ({persenSukarela}%)</span>
                </div>
              </div>
            </div>

            {/* 3 Detail Cards for Each Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Simpanan Pokok</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {persenPokok}%
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-emerald-800 font-mono mt-1 tabular-nums">
                    {formatRupiah(totalPokok)}
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800/80 mt-2">
                  Setoran awal anggota koperasi
                </p>
              </div>

              <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900">Simpanan Wajib</span>
                    <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                      {persenWajib}%
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-teal-800 font-mono mt-1 tabular-nums">
                    {formatRupiah(totalWajib)}
                  </div>
                </div>
                <p className="text-[11px] text-teal-800/80 mt-2">
                  Iuran bulanan seluruh anggota
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">Simpanan Sukarela</span>
                    <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      {persenSukarela}%
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-amber-800 font-mono mt-1 tabular-nums">
                    {formatRupiah(totalSukarela)}
                  </div>
                </div>
                <p className="text-[11px] text-amber-800/80 mt-2">
                  Tabungan fleksibel sukarela
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Bottom: Top Savers & Quick Navigation */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold">Simpanan Terbesar:</span>
            {topPenyimpan.length > 0 ? (
              topPenyimpan.map((tp, idx) => (
                <span
                  key={tp.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 shadow-2xs"
                >
                  <span className="font-bold text-emerald-700">#{idx + 1}</span>
                  <span className="font-medium text-slate-800">{tp.namaAnggota}</span>
                  <span className="font-mono font-bold text-emerald-800">{formatRupiah(tp.total)}</span>
                </span>
              ))
            ) : (
              <span className="text-slate-400">Belum ada data simpanan</span>
            )}
          </div>

          <button
            onClick={() => onNavigate('simpanan')}
            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 group text-xs shrink-0"
          >
            <span>Lihat Rincian Buku Simpanan Seluruh Anggota</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Split Section: Pending Loans Notifications & Status Keanggotaan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Loans Notifications (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Pengajuan Peminjaman Terbaru ({pendingPengajuan.length} Menunggu Persetujuan)
              </h3>
            </div>
            <button
              onClick={() =>
                onNavigateSubTab
                  ? onNavigateSubTab('peminjaman', 'pengajuan')
                  : onNavigate('peminjaman')
              }
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Buka Semua
            </button>
          </div>

          {/* Feedback banner if approved from Dashboard */}
          {dashboardSuccessAlert && (
            <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dashboardSuccessAlert.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onNavigateSubTab
                      ? onNavigateSubTab('peminjaman', dashboardSuccessAlert.type)
                      : onNavigate('peminjaman')
                  }
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                >
                  <span>Buka Tagihan</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDashboardSuccessAlert(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {pendingPengajuan.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada pengajuan pinjaman yang menunggu saat ini.
              </div>
            ) : (
              pendingPengajuan.slice(0, 3).map((p) => (
                <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {p.nomorAnggota}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {p.namaAnggota}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.tanggalPengajuan}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Meminjam <strong>{p.jenisPinjaman}</strong>:{' '}
                        {p.jenisPinjaman === 'Uang'
                          ? formatRupiah(p.jumlahUang || 0)
                          : `${p.namaBarang} (${formatRupiah(p.estimasiHargaBarang || 0)})`}{' '}
                        selama {p.tenorBulan} bulan.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">
                        "{p.keperluan}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          const res = StorageService.approvePengajuan(
                            p.id,
                            'Disetujui langsung dari Dashboard'
                          );
                          if (res.success) {
                            onDataChanged?.();
                            setDashboardSuccessAlert({
                              text: `Pengajuan ${p.namaAnggota} disetujui & otomatis masuk ke tagihan Pinjaman ${p.jenisPinjaman}!`,
                              type: res.type || (p.jenisPinjaman === 'Barang' ? 'barang' : 'uang')
                            });
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>

                      <button
                        onClick={() =>
                          onNavigateSubTab
                            ? onNavigateSubTab('peminjaman', 'pengajuan')
                            : onNavigate('peminjaman')
                        }
                        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg shadow-xs"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Keanggotaan Summary with all 4 Categories */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Status Keanggotaan
              </h3>
            </div>
            <button
              onClick={() => onNavigate('keanggotaan')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Kelola
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Anggota Terdaftar:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {anggotaList.length} Orang
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Pegawai Negeri Sipil (PNS):</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {countPNS} Orang
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Pegawai Pemerintah (PPPK):</span>
              <span className="font-semibold text-indigo-700 font-mono">
                {countPPPK} Orang
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Non ASN (Honorer/GTT/PTT):</span>
              <span className="font-semibold text-amber-700 font-mono">
                {countNonASN} Orang
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Purna Bakti (Pensiunan):</span>
              <span className="font-semibold text-purple-700 font-mono">
                {countPurnaBakti} Orang
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Setiap anggota dapat diterbitkan <strong>E-KTA</strong> (Kartu Tanda Anggota Elektronik) dengan barcode & QR validasi resmi.
            </div>

            <button
              onClick={() => onNavigate('keanggotaan')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Lihat & Cetak E-KTA Anggota</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix for All 6 Modules */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4">
          Akses Cepat Modul Koperasi
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('keanggotaan')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-left transition-all"
          >
            <Users className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="font-bold text-slate-900 text-xs">1. Keanggotaan</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Update data & E-KTA</p>
          </button>

          <button
            onClick={() => onNavigate('jurnal')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-left transition-all"
          >
            <BookOpen className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="font-bold text-slate-900 text-xs">2. Jurnal Umum</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Form kas, PDF & Excel</p>
          </button>

          <button
            onClick={() => onNavigate('simpanan')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 text-left transition-all"
          >
            <Banknote className="w-5 h-5 text-teal-600 mb-2" />
            <div className="font-bold text-slate-900 text-xs">3. Simpanan</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Pokok, Wajib, Sukarela</p>
          </button>

          <button
            onClick={() => onNavigate('peminjaman')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/20 text-left transition-all"
          >
            <HandCoins className="w-5 h-5 text-amber-600 mb-2" />
            <div className="font-bold text-slate-900 text-xs">4. Peminjaman</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Uang, Barang, Notif</p>
          </button>

          <button
            onClick={() => onNavigate('pertokoan')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all"
          >
            <Store className="w-5 h-5 text-indigo-600 mb-2" />
            <div className="font-bold text-slate-900 text-xs">5. Pertokoan</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Kas Toko & Seragam</p>
          </button>

          <button
            onClick={() => onNavigate('pengaturan')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-500 hover:bg-slate-50 text-left transition-all"
          >
            <Settings className="w-5 h-5 text-slate-700 mb-2" />
            <div className="font-bold text-slate-900 text-xs">6. Pengaturan</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Logo, Akun & Sandi</p>
          </button>
        </div>
      </div>

      {/* Modal: Cetak Laporan Ringkasan Keuangan Bulanan & Arus Kas PDF */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cetak Laporan Ringkasan Keuangan (PDF)
                </h3>
                <p className="text-xs text-slate-500">
                  Buat rekapitulasi arus kas dan kesehatan keuangan koperasi untuk laporan pengurus
                </p>
              </div>
            </div>

            {/* Filter Periode */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih Bulan
                </label>
                <select
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  {NAMA_BULAN.map((nama, idx) => (
                    <option key={idx} value={idx}>
                      {nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih Tahun
                </label>
                <select
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-6 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pratinjau Arus Kas Periode: {selectedBulan > 0 ? NAMA_BULAN[selectedBulan] : 'Semua Bulan'} {selectedTahun}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Kas Masuk (Debit)</div>
                  <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">
                    {formatRupiah(previewKasMasuk)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Kas Keluar (Kredit)</div>
                  <div className="text-xs font-bold text-rose-600 font-mono mt-0.5">
                    {formatRupiah(previewKasKeluar)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Surplus / Defisit</div>
                  <div className={`text-xs font-bold font-mono mt-0.5 ${previewNetCashFlow >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                    {formatRupiah(previewNetCashFlow)}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Ditemukan: <strong className="text-slate-800">{previewJurnal.length} Transaksi Jurnal</strong></span>
                <span>Total Anggota: <strong className="text-slate-800">{anggotaList.length} Orang</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Laporan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
