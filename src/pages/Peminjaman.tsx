import React, { useState, useEffect } from 'react';
import {
  Anggota,
  PinjamanUang,
  PinjamanBarang,
  PengajuanPinjaman,
  StatusPinjaman
} from '../types';
import { StorageService } from '../utils/storage';
import {
  exportPinjamanUangToExcel,
  exportPinjamanBarangToExcel,
  exportPengajuanPinjamanToExcel,
  downloadPinjamanUangTemplate,
  downloadPinjamanBarangTemplate,
  parseExcelFile,
  formatRupiah
} from '../utils/exportExcel';
import {
  exportPinjamanUangToPdf,
  exportPinjamanBarangToPdf,
  exportPengajuanPinjamanToPdf
} from '../utils/exportPdf';
import {
  Banknote,
  Package,
  Bell,
  Upload,
  Download,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Clock,
  Check,
  X,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Edit3,
  ArrowRight,
  Sparkles,
  Trash2
} from 'lucide-react';

interface PeminjamanProps {
  anggotaList: Anggota[];
  pinjamanUangList: PinjamanUang[];
  pinjamanBarangList: PinjamanBarang[];
  pengajuanList: PengajuanPinjaman[];
  initialSubTab?: 'uang' | 'barang' | 'pengajuan';
  onSubTabChange?: (tab: 'uang' | 'barang' | 'pengajuan') => void;
  onDataChanged: () => void;
  onOpenPublicForm: () => void;
}

export const Peminjaman: React.FC<PeminjamanProps> = ({
  anggotaList,
  pinjamanUangList,
  pinjamanBarangList,
  pengajuanList,
  initialSubTab = 'uang',
  onSubTabChange,
  onDataChanged,
  onOpenPublicForm
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'uang' | 'barang' | 'pengajuan'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabSwitch = (tab: 'uang' | 'barang' | 'pengajuan') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddUangModalOpen, setIsAddUangModalOpen] = useState(false);
  const [isAddBarangModalOpen, setIsAddBarangModalOpen] = useState(false);
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false);
  const [uploadTargetType, setUploadTargetType] = useState<'uang' | 'barang'>('uang');

  // Action Dropdown & Modals
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 1. Edit Sisa Tagihan Modal
  const [editSisaTarget, setEditSisaTarget] = useState<{
    type: 'uang' | 'barang';
    item: PinjamanUang | PinjamanBarang;
  } | null>(null);
  const [newSisaAmount, setNewSisaAmount] = useState<number>(0);
  const [editSisaStatus, setEditSisaStatus] = useState<StatusPinjaman>('Aktif');
  const [editSisaNote, setEditSisaNote] = useState<string>('');

  // 2. Payment Recording Modal (Bayar Cicilan)
  const [paymentTarget, setPaymentTarget] = useState<{
    type: 'uang' | 'barang';
    item: PinjamanUang | PinjamanBarang;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // 3. Konfirmasi Lunas Modal
  const [lunasConfirmTarget, setLunasConfirmTarget] = useState<{
    type: 'uang' | 'barang';
    item: PinjamanUang | PinjamanBarang;
  } | null>(null);

  // 4. Modal Persetujuan & Penolakan Pengajuan Pinjaman
  const [approvalModalTarget, setApprovalModalTarget] = useState<PengajuanPinjaman | null>(null);
  const [approvalNote, setApprovalNote] = useState('Disetujui oleh pengurus');
  const [rejectModalTarget, setRejectModalTarget] = useState<PengajuanPinjaman | null>(null);
  const [rejectReason, setRejectReason] = useState('Belum memenuhi kriteria');
  const [approvalSuccessInfo, setApprovalSuccessInfo] = useState<{
    name: string;
    type: 'uang' | 'barang';
    amount: number;
  } | null>(null);

  // Upload state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Form Fields: Add Pinjaman Uang Manual
  const [selectedAnggotaIdUang, setSelectedAnggotaIdUang] = useState(anggotaList[0]?.id || '');
  const [jumlahUang, setJumlahUang] = useState<number>(5000000);
  const [tenorUang, setTenorUang] = useState<number>(10);
  const [bungaUang, setBungaUang] = useState<number>(1.0);
  const [keteranganUang, setKeteranganUang] = useState('');

  // Form Fields: Add Pinjaman Barang Manual
  const [selectedAnggotaIdBarang, setSelectedAnggotaIdBarang] = useState(anggotaList[0]?.id || '');
  const [namaBarang, setNamaBarang] = useState('');
  const [hargaBarang, setHargaBarang] = useState<number>(3000000);
  const [tenorBarang, setTenorBarang] = useState<number>(6);
  const [keteranganBarang, setKeteranganBarang] = useState('');
  const [toastNotification, setToastNotification] = useState('');

  const handleDeletePinjamanUang = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus data pinjaman uang atas nama "${nama}"?`)) {
      StorageService.deletePinjamanUang(id);
      setToastNotification(`Data pinjaman uang "${nama}" berhasil dihapus.`);
      onDataChanged();
      setTimeout(() => setToastNotification(''), 4000);
    }
  };

  const handleDeletePinjamanBarang = (id: string, nama: string, namaBarang: string) => {
    if (window.confirm(`Yakin ingin menghapus data pinjaman barang "${namaBarang}" atas nama "${nama}"?`)) {
      StorageService.deletePinjamanBarang(id);
      setToastNotification(`Data pinjaman barang "${namaBarang}" berhasil dihapus.`);
      onDataChanged();
      setTimeout(() => setToastNotification(''), 4000);
    }
  };

  const handleDeletePengajuan = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus antrean pengajuan pinjaman atas nama "${nama}"?`)) {
      StorageService.deletePengajuan(id);
      setToastNotification(`Data pengajuan pinjaman "${nama}" berhasil dihapus.`);
      onDataChanged();
      setTimeout(() => setToastNotification(''), 4000);
    }
  };

  const pendingCount = pengajuanList.filter((p) => p.status === 'Menunggu').length;

  // 1. Submit Add Pinjaman Uang Manual
  const handleAddUang = (e: React.FormEvent) => {
    e.preventDefault();
    const anggota = anggotaList.find((a) => a.id === selectedAnggotaIdUang);
    if (!anggota) return;

    const angsuran = Math.round(jumlahUang / tenorUang + (jumlahUang * bungaUang) / 100);

    StorageService.addPinjamanUang({
      anggotaId: anggota.id,
      namaAnggota: anggota.namaLengkap,
      nomorAnggota: anggota.nomorAnggota,
      tanggalPinjam: new Date().toISOString().split('T')[0],
      jumlahPinjaman: Number(jumlahUang),
      tenorBulan: Number(tenorUang),
      bungaPersen: Number(bungaUang),
      angsuranPerBulan: angsuran,
      totalDibayar: 0,
      sisaPinjaman: Number(jumlahUang),
      status: 'Aktif',
      keterangan: keteranganUang
    });

    setIsAddUangModalOpen(false);
    onDataChanged();
  };

  // 2. Submit Add Pinjaman Barang Manual
  const handleAddBarang = (e: React.FormEvent) => {
    e.preventDefault();
    const anggota = anggotaList.find((a) => a.id === selectedAnggotaIdBarang);
    if (!anggota) return;

    const angsuran = tenorBarang > 0 ? Math.round(hargaBarang / tenorBarang) : 0;

    StorageService.addPinjamanBarang({
      anggotaId: anggota.id,
      namaAnggota: anggota.namaLengkap,
      nomorAnggota: anggota.nomorAnggota,
      tanggalPinjam: new Date().toISOString().split('T')[0],
      namaBarang,
      hargaBarang: Number(hargaBarang),
      tenorBulan: Number(tenorBarang),
      angsuranPerBulan: angsuran,
      totalDibayar: 0,
      sisaPinjaman: Number(hargaBarang),
      status: 'Aktif',
      keterangan: keteranganBarang
    });

    setIsAddBarangModalOpen(false);
    onDataChanged();
  };

  // 3. Edit Sisa Tagihan Handler
  const handleSaveEditSisa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSisaTarget) return;

    const { type, item } = editSisaTarget;
    const originalAmount = 'jumlahPinjaman' in item ? item.jumlahPinjaman : item.hargaBarang;
    const sisa = Math.max(0, Number(newSisaAmount || 0));
    const status: StatusPinjaman = sisa === 0 ? 'Lunas' : editSisaStatus;
    const calculatedDibayar = Math.max(0, originalAmount - sisa);

    const updatePayload = {
      sisaPinjaman: sisa,
      totalDibayar: calculatedDibayar,
      status: status,
      keterangan: editSisaNote
        ? item.keterangan
          ? `${item.keterangan} · [Koreksi sisa tagihan: ${editSisaNote}]`
          : `[Koreksi sisa tagihan: ${editSisaNote}]`
        : item.keterangan
    };

    if (type === 'uang') {
      StorageService.updatePinjamanUang(item.id, updatePayload);
    } else {
      StorageService.updatePinjamanBarang(item.id, updatePayload);
    }

    setEditSisaTarget(null);
    onDataChanged();
  };

  // 4. Record Payment (Bayar Cicilan)
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || paymentAmount <= 0) return;

    const { type, item } = paymentTarget;
    const payNominal = Number(paymentAmount);
    const newTotalDibayar = (item.totalDibayar || 0) + payNominal;
    const newSisa = Math.max(0, (item.sisaPinjaman || 0) - payNominal);
    const newStatus = newSisa <= 0 ? ('Lunas' as const) : ('Aktif' as const);

    if (type === 'uang') {
      StorageService.updatePinjamanUang(item.id, {
        totalDibayar: newTotalDibayar,
        sisaPinjaman: newSisa,
        status: newStatus
      });
    } else {
      StorageService.updatePinjamanBarang(item.id, {
        totalDibayar: newTotalDibayar,
        sisaPinjaman: newSisa,
        status: newStatus
      });
    }

    setPaymentTarget(null);
    setPaymentAmount(0);
    onDataChanged();
  };

  // 5. Mark As Paid Off Directly (Lunas)
  const handleSetLunas = () => {
    if (!lunasConfirmTarget) return;

    const { type, item } = lunasConfirmTarget;
    const originalAmount = 'jumlahPinjaman' in item ? item.jumlahPinjaman : item.hargaBarang;

    const updatePayload = {
      sisaPinjaman: 0,
      totalDibayar: originalAmount,
      status: 'Lunas' as const
    };

    if (type === 'uang') {
      StorageService.updatePinjamanUang(item.id, updatePayload);
    } else {
      StorageService.updatePinjamanBarang(item.id, updatePayload);
    }

    setLunasConfirmTarget(null);
    onDataChanged();
  };

  // 4. Excel Upload Parse Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    try {
      const data = await parseExcelFile(file);
      if (!data || data.length === 0) {
        setUploadError('File Excel tidak memiliki baris data.');
        return;
      }

      const validated = data.map((row) => {
        const rowName =
          row['Nama Anggota'] || row['Nama'] || row['Nama Lengkap'] || row['nama_anggota'] || '';

        const matched = anggotaList.find(
          (a) =>
            a.namaLengkap.trim().toLowerCase() === String(rowName).trim().toLowerCase() ||
            a.namaLengkap.toLowerCase().includes(String(rowName).toLowerCase().trim())
        );

        if (uploadTargetType === 'uang') {
          const nominal = Number(row['Jumlah Pinjaman'] || row['Nominal'] || 5000000);
          const tenor = Number(row['Tenor Bulan'] || row['Tenor'] || 10);
          return {
            originalName: rowName,
            isMatched: !!matched,
            matchedAnggota: matched,
            jumlahPinjaman: nominal,
            tenorBulan: tenor,
            keterangan: row['Keterangan'] || 'Pinjaman Uang Anggota'
          };
        } else {
          const barang = row['Nama Barang'] || row['Barang'] || 'Pengadaan Elektronik/Barang';
          const harga = Number(row['Harga Barang'] || row['Harga'] || 3000000);
          const tenor = Number(row['Tenor Bulan'] || row['Tenor'] || 6);
          return {
            originalName: rowName,
            isMatched: !!matched,
            matchedAnggota: matched,
            namaBarang: barang,
            hargaBarang: harga,
            tenorBulan: tenor,
            keterangan: row['Keterangan'] || '-'
          };
        }
      });

      setParsedRows(validated);
    } catch (err: any) {
      setUploadError('Gagal membaca file: ' + err.message);
    }
  };

  const handleApplyUpload = () => {
    let count = 0;
    parsedRows.forEach((row) => {
      if (row.isMatched && row.matchedAnggota) {
        if (uploadTargetType === 'uang') {
          const bunga = 1.0;
          const angsuran = Math.round(
            row.jumlahPinjaman / row.tenorBulan + (row.jumlahPinjaman * bunga) / 100
          );
          StorageService.addPinjamanUang({
            anggotaId: row.matchedAnggota.id,
            namaAnggota: row.matchedAnggota.namaLengkap,
            nomorAnggota: row.matchedAnggota.nomorAnggota,
            tanggalPinjam: new Date().toISOString().split('T')[0],
            jumlahPinjaman: row.jumlahPinjaman,
            tenorBulan: row.tenorBulan,
            bungaPersen: bunga,
            angsuranPerBulan: angsuran,
            totalDibayar: 0,
            sisaPinjaman: row.jumlahPinjaman,
            status: 'Aktif',
            keterangan: row.keterangan
          });
          count++;
        } else {
          const angsuran = row.tenorBulan > 0 ? Math.round(row.hargaBarang / row.tenorBulan) : 0;
          StorageService.addPinjamanBarang({
            anggotaId: row.matchedAnggota.id,
            namaAnggota: row.matchedAnggota.namaLengkap,
            nomorAnggota: row.matchedAnggota.nomorAnggota,
            tanggalPinjam: new Date().toISOString().split('T')[0],
            namaBarang: row.namaBarang,
            hargaBarang: row.hargaBarang,
            tenorBulan: row.tenorBulan,
            angsuranPerBulan: angsuran,
            totalDibayar: 0,
            sisaPinjaman: row.hargaBarang,
            status: 'Aktif',
            keterangan: row.keterangan
          });
          count++;
        }
      }
    });

    setUploadSuccess(`Berhasil mengunggah dan menambahkan ${count} pinjaman baru!`);
    setTimeout(() => {
      setIsUploadExcelModalOpen(false);
      setParsedRows([]);
      setUploadSuccess('');
      onDataChanged();
    }, 1200);
  };

  // Filtered queries
  const filteredPinjamanUang = pinjamanUangList.filter(
    (p) =>
      p.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomorAnggota.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPinjamanBarang = pinjamanBarangList.filter(
    (p) =>
      p.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomorAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPengajuan = pengajuanList.filter(
    (p) =>
      p.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomorAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.keperluan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification('')}
            className="p-1 hover:bg-emerald-700 rounded text-xs leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => handleSubTabSwitch('uang')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'uang'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Pinjaman Uang Anggota</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {pinjamanUangList.length}
          </span>
        </button>

        <button
          onClick={() => handleSubTabSwitch('barang')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'barang'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Pinjaman Barang Anggota</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {pinjamanBarangList.length}
          </span>
        </button>

        <button
          onClick={() => handleSubTabSwitch('pengajuan')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors relative ${
            activeSubTab === 'pengajuan'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengajuan Peminjaman</span>
          {pendingCount > 0 ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
              {pendingCount} Menunggu
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
              {pengajuanList.length}
            </span>
          )}
        </button>
      </div>

      {/* SUBTAB 1: PINJAMAN UANG ANGGOTA */}
      {activeSubTab === 'uang' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Total Pinjaman Disalurkan</div>
              <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupiah(pinjamanUangList.reduce((acc, curr) => acc + (curr.jumlahPinjaman || 0), 0))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Sisa Tagihan Pokok</div>
              <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">
                {formatRupiah(pinjamanUangList.reduce((acc, curr) => acc + (curr.sisaPinjaman || 0), 0))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Total Angsuran Masuk</div>
              <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupiah(pinjamanUangList.reduce((acc, curr) => acc + (curr.totalDibayar || 0), 0))}
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau nomor anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => downloadPinjamanUangTemplate(anggotaList)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                title="Download Template Excel Pinjaman Uang"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Template Excel</span>
              </button>

              <button
                onClick={() => {
                  setUploadTargetType('uang');
                  setParsedRows([]);
                  setUploadError('');
                  setUploadSuccess('');
                  setIsUploadExcelModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={() => exportPinjamanUangToPdf(filteredPinjamanUang)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="Download Rekap Pinjaman Uang dalam format PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Unduh PDF</span>
              </button>

              <button
                onClick={() => exportPinjamanUangToExcel(filteredPinjamanUang)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                title="Download Rekap Pinjaman Uang dalam format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={() => setIsAddUangModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pinjaman</span>
              </button>
            </div>
          </div>

          {/* Table Pinjaman Uang */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-3 text-center">No</th>
                    <th className="py-3.5 px-3">No. Anggota</th>
                    <th className="py-3.5 px-4">Nama Anggota</th>
                    <th className="py-3.5 px-3">Tgl Pinjam</th>
                    <th className="py-3.5 px-4 text-right">Jumlah Pinjaman</th>
                    <th className="py-3.5 px-3 text-center">Tenor</th>
                    <th className="py-3.5 px-4 text-right">Angsuran/Bln</th>
                    <th className="py-3.5 px-4 text-right">Sisa Pinjaman</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPinjamanUang.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Belum ada data pinjaman uang anggota.
                      </td>
                    </tr>
                  ) : (
                    filteredPinjamanUang.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-emerald-700">
                          {item.nomorAnggota}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.namaAnggota}
                          {item.keterangan && (
                            <span className="block text-[11px] font-normal text-slate-400">
                              {item.keterangan}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {item.tanggalPinjam}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatRupiah(item.jumlahPinjaman)}
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums">
                          {item.tenorBulan} Bln
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatRupiah(item.angsuranPerBulan)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-700">
                          {formatRupiah(item.sisaPinjaman)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.status === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs hover:border-emerald-500 transition-colors whitespace-nowrap"
                              >
                                <span>Pilih Aksi</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                              </button>

                              {openDropdownId === item.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setOpenDropdownId(null)}
                                  />
                                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setEditSisaTarget({ type: 'uang', item });
                                          setNewSisaAmount(item.sisaPinjaman);
                                          setEditSisaStatus(item.status);
                                          setEditSisaNote('');
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Edit Sisa Tagihan</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setPaymentTarget({ type: 'uang', item });
                                          setPaymentAmount(Math.min(item.angsuranPerBulan || 0, item.sisaPinjaman));
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                      >
                                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Bayar Cicilan</span>
                                      </button>
                                    </div>

                                    <div className="py-1">
                                      {item.status !== 'Lunas' ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setLunasConfirmTarget({ type: 'uang', item });
                                          }}
                                          className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Lunas (Melunasi)</span>
                                        </button>
                                      ) : (
                                        <div className="px-3 py-1.5 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50/50">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Status Sudah Lunas</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          handleDeletePinjamanUang(item.id, item.namaAnggota);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Hapus Pinjaman</span>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeletePinjamanUang(item.id, item.namaAnggota)}
                              title="Hapus Data Pinjaman"
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PINJAMAN BARANG ANGGOTA */}
      {activeSubTab === 'barang' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Total Nilai Pinjaman Barang</div>
              <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupiah(pinjamanBarangList.reduce((acc, curr) => acc + (curr.hargaBarang || 0), 0))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Sisa Piutang Barang</div>
              <div className="text-xl font-bold text-indigo-700 mt-1 tabular-nums">
                {formatRupiah(pinjamanBarangList.reduce((acc, curr) => acc + (curr.sisaPinjaman || 0), 0))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Total Angsuran Masuk</div>
              <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupiah(pinjamanBarangList.reduce((acc, curr) => acc + (curr.totalDibayar || 0), 0))}
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama anggota, nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => downloadPinjamanBarangTemplate(anggotaList)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                title="Download Template Excel Pinjaman Barang"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Template Excel</span>
              </button>

              <button
                onClick={() => {
                  setUploadTargetType('barang');
                  setParsedRows([]);
                  setUploadError('');
                  setUploadSuccess('');
                  setIsUploadExcelModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Excel</span>
              </button>

              <button
                onClick={() => exportPinjamanBarangToPdf(filteredPinjamanBarang)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="Download Rekap Pinjaman Barang dalam format PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Unduh PDF</span>
              </button>

              <button
                onClick={() => exportPinjamanBarangToExcel(filteredPinjamanBarang)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                title="Download Rekap Pinjaman Barang dalam format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={() => setIsAddBarangModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pinjaman Barang</span>
              </button>
            </div>
          </div>

          {/* Table Pinjaman Barang */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-3 text-center">No</th>
                    <th className="py-3.5 px-3">No. Anggota</th>
                    <th className="py-3.5 px-4">Nama Anggota</th>
                    <th className="py-3.5 px-4">Nama Barang</th>
                    <th className="py-3.5 px-4 text-right">Harga Barang</th>
                    <th className="py-3.5 px-3 text-center">Tenor</th>
                    <th className="py-3.5 px-4 text-right">Angsuran/Bln</th>
                    <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPinjamanBarang.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Belum ada data pinjaman barang anggota.
                      </td>
                    </tr>
                  ) : (
                    filteredPinjamanBarang.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-emerald-700">
                          {item.nomorAnggota}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.namaAnggota}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {item.namaBarang}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatRupiah(item.hargaBarang)}
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums">
                          {item.tenorBulan} Bln
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatRupiah(item.angsuranPerBulan)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-indigo-700">
                          {formatRupiah(item.sisaPinjaman)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.status === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs hover:border-emerald-500 transition-colors whitespace-nowrap"
                              >
                                <span>Pilih Aksi</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                              </button>

                              {openDropdownId === item.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setOpenDropdownId(null)}
                                  />
                                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setEditSisaTarget({ type: 'barang', item });
                                          setNewSisaAmount(item.sisaPinjaman);
                                          setEditSisaStatus(item.status);
                                          setEditSisaNote('');
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Edit Sisa Tagihan</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setPaymentTarget({ type: 'barang', item });
                                          setPaymentAmount(Math.min(item.angsuranPerBulan || 0, item.sisaPinjaman));
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                      >
                                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Bayar Cicilan</span>
                                      </button>
                                    </div>

                                    <div className="py-1">
                                      {item.status !== 'Lunas' ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setLunasConfirmTarget({ type: 'barang', item });
                                          }}
                                          className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Lunas (Melunasi)</span>
                                        </button>
                                      ) : (
                                        <div className="px-3 py-1.5 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50/50">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Status Sudah Lunas</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          handleDeletePinjamanBarang(item.id, item.namaAnggota, item.namaBarang);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Hapus Pinjaman</span>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeletePinjamanBarang(item.id, item.namaAnggota, item.namaBarang)}
                              title="Hapus Data Pinjaman Barang"
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PENGAJUAN PEMINJAMAN (ANTREAN NOTIFIKASI & APPROVAL ADMIN) */}
      {activeSubTab === 'pengajuan' && (
        <div className="space-y-6">
          {/* Success Banner after Approval */}
          {approvalSuccessInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs">
                    Pengajuan Pinjaman {approvalSuccessInfo.name} Berhasil Disetujui!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Data tagihan pinjaman telah otomatis dibuat dan aktif di menu{' '}
                    <strong>
                      {approvalSuccessInfo.type === 'uang' ? 'Pinjaman Uang' : 'Pinjaman Barang'}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubTabSwitch(approvalSuccessInfo.type)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Buka Tagihan {approvalSuccessInfo.type === 'uang' ? 'Pinjaman Uang' : 'Pinjaman Barang'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalSuccessInfo(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Notification Info Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                  Pusat Antrean & Notifikasi Pengajuan Peminjaman Anggota
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Setiap pengajuan pinjaman yang dikirim oleh anggota akan otomatis masuk ke antrean ini untuk disetujui atau ditolak pengurus.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenPublicForm}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors shrink-0"
            >
              + Buat Pengajuan Baru
            </button>
          </div>

          {/* Control Bar: Search & Export */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengajuan (nama, nomor anggota, keperluan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportPengajuanPinjamanToPdf(filteredPengajuan)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="Download Rekap Pengajuan Pinjaman dalam format PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Unduh PDF</span>
              </button>

              <button
                onClick={() => exportPengajuanPinjamanToExcel(filteredPengajuan)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                title="Download Rekap Pengajuan Pinjaman dalam format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Excel</span>
              </button>

              {onOpenPublicForm && (
                <button
                  type="button"
                  onClick={onOpenPublicForm}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ajukan Pinjaman Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* List of Loan Applications */}
          <div className="space-y-3">
            {filteredPengajuan.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                Tidak ada pengajuan pinjaman yang tercatat.
              </div>
            ) : (
              filteredPengajuan.map((p) => {
                const isPending = p.status === 'Menunggu';
                return (
                  <div
                    key={p.id}
                    className={`bg-white p-5 rounded-xl border transition-all ${
                      isPending
                        ? 'border-amber-300 ring-1 ring-amber-200 shadow-xs'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {p.nomorAnggota}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {p.namaAnggota}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs text-slate-500">
                            {p.tanggalPengajuan}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Menunggu'
                                ? 'bg-amber-100 text-amber-800'
                                : p.status === 'Disetujui'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Status: {p.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-slate-800">
                            Jenis Pinjaman: <span className="text-emerald-700">{p.jenisPinjaman}</span>
                          </span>
                          <span>·</span>
                          {p.jenisPinjaman === 'Uang' ? (
                            <span>
                              Jumlah Pengajuan:{' '}
                              <strong className="text-slate-900 font-mono">
                                {formatRupiah(p.jumlahUang || 0)}
                              </strong>
                            </span>
                          ) : (
                            <span>
                              Barang:{' '}
                              <strong className="text-slate-900">
                                {p.namaBarang}
                              </strong>{' '}
                              ({formatRupiah(p.estimasiHargaBarang || 0)})
                            </span>
                          )}
                          <span>·</span>
                          <span>
                            Rencana Tenor: <strong>{p.tenorBulan} Bulan</strong>
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700">Keperluan:</span> {p.keperluan}
                        </div>

                        {p.catatanAdmin && (
                          <div className="text-[11px] text-slate-500 italic">
                            Catatan Pengurus: {p.catatanAdmin}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions (Approve / Reject / Delete) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setApprovalModalTarget(p);
                                setApprovalNote('Disetujui oleh pengurus');
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span>Setujui</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalTarget(p);
                                setRejectReason('Belum memenuhi kriteria');
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Tolak</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-right text-xs">
                            <div className="text-slate-400">Selesai Diproses</div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeletePengajuan(p.id, p.namaAnggota)}
                          title="Hapus Antrean Pengajuan"
                          className="flex items-center gap-1 px-2.5 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-500 font-semibold text-xs border border-slate-200 rounded-lg transition-colors shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PINJAMAN UANG MANUAL */}
      {isAddUangModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Catat Pinjaman Uang Baru
              </h3>
              <button
                onClick={() => setIsAddUangModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUang} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Anggota Koperasi *
                </label>
                <select
                  value={selectedAnggotaIdUang}
                  onChange={(e) => setSelectedAnggotaIdUang(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {anggotaList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nomorAnggota} - {a.namaLengkap} ({a.jenisKepegawaian})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah Pinjaman (Rp) *
                </label>
                <input
                  type="number"
                  min={500000}
                  step={500000}
                  required
                  value={jumlahUang}
                  onChange={(e) => setJumlahUang(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tenor (Bulan) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={tenorUang}
                    onChange={(e) => setTenorUang(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jasa/Bunga (%/bln)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={bungaUang}
                    onChange={(e) => setBungaUang(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Keperluan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Renovasi Rumah / Pendidikan"
                  value={keteranganUang}
                  onChange={(e) => setKeteranganUang(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 flex items-center justify-between font-medium">
                <span>Estimasi Angsuran / Bulan:</span>
                <span className="font-mono font-bold text-sm">
                  {formatRupiah(Math.round(jumlahUang / tenorUang + (jumlahUang * bungaUang) / 100))}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUangModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Simpan Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PINJAMAN BARANG MANUAL */}
      {isAddBarangModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Catat Pinjaman Barang Baru
              </h3>
              <button
                onClick={() => setIsAddBarangModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBarang} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Anggota Koperasi *
                </label>
                <select
                  value={selectedAnggotaIdBarang}
                  onChange={(e) => setSelectedAnggotaIdBarang(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {anggotaList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nomorAnggota} - {a.namaLengkap}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laptop Asus 14 Inch / Kulkas 2 Pintu"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Barang (Rp) *
                  </label>
                  <input
                    type="number"
                    min={100000}
                    required
                    value={hargaBarang}
                    onChange={(e) => setHargaBarang(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tenor (Bulan) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    required
                    value={tenorBarang}
                    onChange={(e) => setTenorBarang(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Spesifikasi / nomor seri barang jika ada"
                  value={keteranganBarang}
                  onChange={(e) => setKeteranganBarang(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-900 flex items-center justify-between font-medium">
                <span>Angsuran per Bulan:</span>
                <span className="font-mono font-bold text-sm">
                  {formatRupiah(tenorBarang > 0 ? Math.round(hargaBarang / tenorBarang) : 0)}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBarangModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Simpan Pinjaman Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. MODAL EDIT SISA TAGIHAN */}
      {editSisaTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit Sisa Tagihan Pinjaman {editSisaTarget.type === 'uang' ? 'Uang' : 'Barang'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Koreksi nominal sisa tagihan pinjaman anggota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditSisaTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSisa} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">
                  {editSisaTarget.item.namaAnggota}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Nomor Anggota: <strong className="font-mono text-slate-800">{editSisaTarget.item.nomorAnggota}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Total Pokok:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah('jumlahPinjaman' in editSisaTarget.item ? editSisaTarget.item.jumlahPinjaman : editSisaTarget.item.hargaBarang)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sisa Saat Ini:</span>
                    <span className="font-mono font-bold text-rose-700">
                      {formatRupiah(editSisaTarget.item.sisaPinjaman)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Sisa Tagihan Baru (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newSisaAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewSisaAmount(val);
                    if (val === 0) {
                      setEditSisaStatus('Lunas');
                    } else if (editSisaStatus === 'Lunas') {
                      setEditSisaStatus('Aktif');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Terbaca: <strong>{formatRupiah(newSisaAmount || 0)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Pinjaman *
                </label>
                <select
                  value={editSisaStatus}
                  onChange={(e) => setEditSisaStatus(e.target.value as StatusPinjaman)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Aktif">Aktif (Masih Ada Tagihan)</option>
                  <option value="Lunas">Lunas (Tidak Ada Tagihan)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Penyesuaian (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Koreksi pembulatan / revisi sisa pokok"
                  value={editSisaNote}
                  onChange={(e) => setEditSisaNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSisaTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Sisa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL BAYAR CICILAN */}
      {paymentTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Bayar Cicilan Pinjaman {paymentTarget.type === 'uang' ? 'Uang' : 'Barang'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update pencatatan pembayaran angsuran anggota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900">
                  {paymentTarget.item.namaAnggota} ({paymentTarget.item.nomorAnggota})
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sisa Tagihan Saat Ini:</span>
                  <strong className="text-rose-700 font-mono">
                    {formatRupiah(paymentTarget.item.sisaPinjaman)}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Angsuran Normal per Bulan:</span>
                  <strong className="font-mono text-slate-800">
                    {formatRupiah(paymentTarget.item.angsuranPerBulan)}
                  </strong>
                </div>
              </div>

              {/* Quick Fill Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(Math.min(paymentTarget.item.angsuranPerBulan || 0, paymentTarget.item.sisaPinjaman))}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md transition-colors"
                >
                  Bayar 1x Angsuran
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(paymentTarget.item.sisaPinjaman)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md transition-colors"
                >
                  Bayar Lunas Sisa ({formatRupiah(paymentTarget.item.sisaPinjaman)})
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran Cicilan (Rp) *
                </label>
                <input
                  type="number"
                  min={1000}
                  max={paymentTarget.item.sisaPinjaman}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 flex items-center justify-between font-medium">
                <span>Sisa Tagihan Setelah Bayar:</span>
                <span className="font-mono font-bold text-sm">
                  {formatRupiah(Math.max(0, paymentTarget.item.sisaPinjaman - paymentAmount))}
                </span>
              </div>

              {paymentAmount >= paymentTarget.item.sisaPinjaman && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Pembayaran ini akan melunasi pinjaman sepenuhnya (Status otomatis: Lunas).</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL KONFIRMASI LUNAS LANGSUNG */}
      {lunasConfirmTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Konfirmasi Pelunasan Pinjaman
                </h3>
              </div>
              <button
                onClick={() => setLunasConfirmTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  {lunasConfirmTarget.item.namaAnggota}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Nomor Anggota: <strong className="font-mono text-slate-800">{lunasConfirmTarget.item.nomorAnggota}</strong>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Jenis Pinjaman: <strong className="capitalize">{lunasConfirmTarget.type === 'uang' ? 'Pinjaman Uang' : 'Pinjaman Barang'}</strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/80 text-[11px]">
                  <span className="text-slate-600">Sisa Tagihan Saat Ini:</span>
                  <strong className="text-rose-700 font-mono text-xs">
                    {formatRupiah(lunasConfirmTarget.item.sisaPinjaman)}
                  </strong>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menandai pinjaman ini sebagai <strong>LUNAS</strong>? Sisa tagihan akan diset menjadi <strong>Rp 0</strong> dan status pinjaman otomatis berubah menjadi <strong>Lunas</strong>.
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLunasConfirmTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSetLunas}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ya, Tandai Lunas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI PERSETUJUAN PENGAJUAN PINJAMAN */}
      {approvalModalTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Konfirmasi Persetujuan Pengajuan
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Penerbitan Otomatis ke Tagihan Pinjaman Anggota
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = StorageService.approvePengajuan(approvalModalTarget.id, approvalNote);
                if (res.success) {
                  setApprovalSuccessInfo({
                    name: approvalModalTarget.namaAnggota,
                    type: res.type || 'uang',
                    amount: res.nominal || 0
                  });
                  setApprovalModalTarget(null);
                  onDataChanged();
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              {/* Rincian Ringkas Pengajuan */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nama Anggota:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{approvalModalTarget.namaAnggota}</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded ml-1.5">
                      {approvalModalTarget.nomorAnggota}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Kategori Tagihan:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                      approvalModalTarget.jenisPinjaman === 'Uang'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {approvalModalTarget.jenisPinjaman === 'Uang' ? (
                      <Banknote className="w-3.5 h-3.5" />
                    ) : (
                      <Package className="w-3.5 h-3.5" />
                    )}
                    <span>Tagihan Pinjaman {approvalModalTarget.jenisPinjaman}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    {approvalModalTarget.jenisPinjaman === 'Uang' ? 'Jumlah Pinjaman:' : `Barang: ${approvalModalTarget.namaBarang}`}
                  </span>
                  <strong className="text-slate-900 font-mono text-sm">
                    {formatRupiah(
                      approvalModalTarget.jenisPinjaman === 'Uang'
                        ? approvalModalTarget.jumlahUang || 0
                        : approvalModalTarget.estimasiHargaBarang || 0
                    )}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Rencana Tenor Angsuran:</span>
                  <span className="font-semibold text-slate-800">{approvalModalTarget.tenorBulan} Bulan</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Keperluan:</span>
                  <span className="font-medium text-slate-800 italic line-clamp-1">"{approvalModalTarget.keperluan}"</span>
                </div>
              </div>

              {/* Informative Auto-Entry Box */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Otomatis Masuk Tagihan:</strong> Setelah Anda menyetujui pengajuan ini, sistem akan otomatis mencatat pinjaman baru dengan status <strong>Aktif</strong> pada menu <strong>Pinjaman {approvalModalTarget.jenisPinjaman}</strong> anggota.
                </div>
              </div>

              {/* Catatan Admin Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Persetujuan Pengurus (Opsional)
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Misal: Disetujui oleh pengurus koperasi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui & Terbitkan Tagihan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL PENOLAKAN PENGAJUAN PINJAMAN */}
      {rejectModalTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-600 text-white rounded-lg">
                  <X className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Tolak Pengajuan Pinjaman
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                StorageService.rejectPengajuan(rejectModalTarget.id, rejectReason);
                setRejectModalTarget(null);
                onDataChanged();
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900">
                  {rejectModalTarget.namaAnggota} ({rejectModalTarget.nomorAnggota})
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Pinjaman {rejectModalTarget.jenisPinjaman}: {rejectModalTarget.keperluan}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Penolakan *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Misal: Belum memenuhi syarat kredit koperasi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Tolak Pengajuan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD EXCEL PINJAMAN (UANG / BARANG) */}
      {isUploadExcelModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Upload Excel Pinjaman {uploadTargetType === 'uang' ? 'Uang' : 'Barang'} Anggota
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mencocokkan nama anggota pada berkas Excel secara otomatis dengan Data Keanggotaan.
                </p>
              </div>
              <button
                onClick={() => setIsUploadExcelModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="excelLoanUpload"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="excelLoanUpload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                  <span className="font-semibold text-slate-700 text-xs">
                    Klik untuk memilih file Excel (.xlsx / .xls)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Kolom utama: Nama Anggota,{' '}
                    {uploadTargetType === 'uang' ? 'Jumlah Pinjaman, Tenor Bulan' : 'Nama Barang, Harga Barang, Tenor Bulan'}
                  </span>
                </label>
              </div>

              {/* Preview table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>
                      Preview Validasi Nama ({parsedRows.filter((r) => r.isMatched).length} cocok dari {parsedRows.length} baris)
                    </span>
                    <span className="text-emerald-700 font-mono">
                      {parsedRows.filter((r) => r.isMatched).length}/{parsedRows.length} Valid
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Nama di Excel</th>
                          <th className="py-2 px-3">Kesesuaian Anggota</th>
                          <th className="py-2 px-3 text-right">
                            {uploadTargetType === 'uang' ? 'Jumlah Pinjaman' : 'Harga Barang'}
                          </th>
                          <th className="py-2 px-3 text-center">Tenor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row.isMatched ? 'bg-white' : 'bg-rose-50/50'}>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {row.originalName}
                            </td>
                            <td className="py-2 px-3">
                              {row.isMatched ? (
                                <span className="text-emerald-700 font-medium">
                                  ✓ Cocok: {row.matchedAnggota.nomorAnggota} ({row.matchedAnggota.namaLengkap})
                                </span>
                              ) : (
                                <span className="text-rose-600 font-medium">
                                  ✗ Tidak ditemukan di Data Keanggotaan
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {formatRupiah(uploadTargetType === 'uang' ? row.jumlahPinjaman : row.hargaBarang)}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {row.tenorBulan} Bln
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadExcelModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0 || !parsedRows.some((r) => r.isMatched)}
                  onClick={handleApplyUpload}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Terapkan Pinjaman Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
