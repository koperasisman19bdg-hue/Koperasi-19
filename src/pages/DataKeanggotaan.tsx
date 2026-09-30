import React, { useState, useRef } from 'react';
import {
  Anggota,
  JenisKepegawaian,
  JenisKelamin
} from '../types';
import { StorageService } from '../utils/storage';
import { EKTAView } from '../components/EKTAView';
import {
  downloadAnggotaTemplate,
  parseExcelFile
} from '../utils/exportExcel';
import { exportAnggotaToPdf } from '../utils/exportPdf';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Upload,
  User,
  Filter,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Download,
  AlertCircle,
  FileCheck,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataKeanggotaanProps {
  anggotaList: Anggota[];
  onDataChanged: () => void;
}

interface ParsedAnggotaRow {
  nomorAnggota: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  tempatTanggalLahir: string;
  alamatLengkap: string;
  tahunMasuk: number;
  jenisKepegawaian: JenisKepegawaian;
  noHp?: string;
  jabatan?: string;
  isValid: boolean;
  validationMessage?: string;
}

export const DataKeanggotaan: React.FC<DataKeanggotaanProps> = ({
  anggotaList,
  onDataChanged
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKepegawaian, setFilterKepegawaian] = useState<'Semua' | 'PNS' | 'PPPK' | 'Non ASN' | 'Purna Bakti'>('Semua');
  const [selectedEktaAnggota, setSelectedEktaAnggota] = useState<Anggota | null>(null);

  // Form Modal state (Single Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState<Anggota | null>(null);
  const [deleteRelatedData, setDeleteRelatedData] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [nomorAnggota, setNomorAnggota] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('Laki-laki');
  const [tempatTanggalLahir, setTempatTanggalLahir] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [tahunMasuk, setTahunMasuk] = useState<number>(new Date().getFullYear());
  const [jenisKepegawaian, setJenisKepegawaian] = useState<JenisKepegawaian>('PNS');
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [noHp, setNoHp] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('');

  // Bulk Upload Excel state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedAnggotaRow[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success Toast Banner
  const [toastNotification, setToastNotification] = useState('');

  const openAddModal = () => {
    setEditingAnggota(null);
    setFormError('');
    const nextNum = anggotaList.length + 1;
    setNomorAnggota(`KWB-${String(nextNum).padStart(3, '0')}`);
    setNamaLengkap('');
    setJenisKelamin('Laki-laki');
    setTempatTanggalLahir('Bandung, 01 Januari 1985');
    setAlamatLengkap('');
    setTahunMasuk(new Date().getFullYear());
    setJenisKepegawaian('PNS');
    setFotoUrl('');
    setNoHp('');
    setJabatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: Anggota) => {
    setEditingAnggota(a);
    setFormError('');
    setNomorAnggota(a.nomorAnggota);
    setNamaLengkap(a.namaLengkap);
    setJenisKelamin(a.jenisKelamin);
    setTempatTanggalLahir(a.tempatTanggalLahir);
    setAlamatLengkap(a.alamatLengkap);
    setTahunMasuk(a.tahunMasuk);
    setJenisKepegawaian(a.jenisKepegawaian);
    setFotoUrl(a.fotoUrl || '');
    setNoHp(a.noHp || '');
    setJabatan(a.jabatan || '');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim() || !nomorAnggota.trim()) {
      setFormError('Nomor Anggota dan Nama Lengkap wajib diisi!');
      return;
    }

    setFormError('');
    if (editingAnggota) {
      StorageService.updateAnggota(editingAnggota.id, {
        nomorAnggota: nomorAnggota.trim(),
        namaLengkap: namaLengkap.trim(),
        jenisKelamin,
        tempatTanggalLahir: tempatTanggalLahir.trim(),
        alamatLengkap: alamatLengkap.trim(),
        tahunMasuk: Number(tahunMasuk),
        jenisKepegawaian,
        fotoUrl: fotoUrl || editingAnggota.fotoUrl,
        noHp: noHp.trim(),
        jabatan: jabatan.trim()
      });
      setToastNotification(`Data anggota "${namaLengkap.trim()}" berhasil diperbarui.`);
    } else {
      StorageService.addAnggota({
        nomorAnggota: nomorAnggota.trim(),
        namaLengkap: namaLengkap.trim(),
        jenisKelamin,
        tempatTanggalLahir: tempatTanggalLahir.trim(),
        alamatLengkap: alamatLengkap.trim(),
        tahunMasuk: Number(tahunMasuk),
        jenisKepegawaian,
        fotoUrl: fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        noHp: noHp.trim(),
        jabatan: jabatan.trim()
      });
      setToastNotification(`Anggota baru "${namaLengkap.trim()}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    onDataChanged();
    setTimeout(() => setToastNotification(''), 4000);
  };

  const handleDeleteClick = (a: Anggota) => {
    setDeleteTarget(a);
    setDeleteRelatedData(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const targetName = deleteTarget.namaLengkap;
      StorageService.deleteAnggota(deleteTarget.id, deleteRelatedData);
      setToastNotification(`Keanggotaan "${targetName}" berhasil dihapus.`);
      setDeleteTarget(null);
      onDataChanged();
      setTimeout(() => setToastNotification(''), 4000);
    } catch (err: any) {
      alert('Gagal menghapus data anggota: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Unduh Data Anggota Saat Ini ke Excel
  const handleExportExcel = () => {
    const rows = anggotaList.map((a, i) => ({
      'No': i + 1,
      'No. Anggota': a.nomorAnggota,
      'Nama Lengkap': a.namaLengkap,
      'Jenis Kelamin': a.jenisKelamin,
      'Tempat Tanggal Lahir': a.tempatTanggalLahir,
      'Alamat Lengkap': a.alamatLengkap,
      'Tahun Masuk Anggota': a.tahunMasuk,
      'Jenis Kepegawaian': a.jenisKepegawaian,
      'No. HP': a.noHp || '-',
      'Jabatan': a.jabatan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 30 },
      { wch: 15 },
      { wch: 28 },
      { wch: 40 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota');
    XLSX.writeFile(wb, 'Data_Keanggotaan_Koperasi_Warga_Bahagia.xlsx');
  };

  // Unduh Template Excel Resmi yang Diminta Pengguna
  const handleDownloadTemplate = () => {
    downloadAnggotaTemplate();
  };

  // Handle Pemilihan & Pembacaan Berkas Excel untuk Import
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadError('');
    setUploadSuccess('');
    setParsedRows([]);

    try {
      const rawData = await parseExcelFile(file);
      if (!rawData || rawData.length === 0) {
        setUploadError('File Excel tidak memiliki data atau baris kosong.');
        return;
      }

      // Determine highest existing sequential number for auto-generating nomor anggota
      let maxNum = 0;
      anggotaList.forEach((a) => {
        const match = a.nomorAnggota.match(/KWB-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });

      let autoCounter = maxNum + 1;

      const processed: ParsedAnggotaRow[] = rawData.map((row: any, idx: number) => {
        // Match Nama Lengkap
        const rawNama =
          row['Nama Lengkap'] ||
          row['Nama'] ||
          row['Nama Anggota'] ||
          row['nama_lengkap'] ||
          '';

        const namaLengkap = String(rawNama).trim();

        // Match Jenis Kelamin
        const rawJK =
          row['Jenis Kelamin'] ||
          row['JK'] ||
          row['Gender'] ||
          row['L/P'] ||
          row['jenis_kelamin'] ||
          '';

        let jenisKelamin: JenisKelamin = 'Laki-laki';
        const strJK = String(rawJK).toLowerCase().trim();
        if (strJK.startsWith('p') || strJK.includes('perempuan') || strJK === 'wanita') {
          jenisKelamin = 'Perempuan';
        } else {
          jenisKelamin = 'Laki-laki';
        }

        // Match Tempat Tanggal Lahir
        const rawTTL =
          row['Tempat Tanggal Lahir'] ||
          row['Tempat & Tanggal Lahir'] ||
          row['TTL'] ||
          row['tempat_tanggal_lahir'] ||
          '';

        const tempatTanggalLahir = String(rawTTL).trim() || '-';

        // Match Alamat Lengkap
        const rawAlamat =
          row['Alamat Lengkap'] ||
          row['Alamat'] ||
          row['alamat_lengkap'] ||
          row['Domisili'] ||
          '';

        const alamatLengkap = String(rawAlamat).trim() || '-';

        // Match Tahun Masuk Anggota
        const rawTahun =
          row['Tahun Masuk Anggota'] ||
          row['Tahun Masuk'] ||
          row['Tahun'] ||
          row['tahun_masuk'] ||
          new Date().getFullYear();

        const numTahun = Number(rawTahun);
        const tahunMasuk = !isNaN(numTahun) && numTahun > 1950 && numTahun < 2050 ? numTahun : new Date().getFullYear();

        // Match Jenis Kepegawaian (PNS, PPPK, Non ASN, Purna Bakti)
        const rawKepegawaian =
          row['Jenis Kepegawaian'] ||
          row['Kepegawaian'] ||
          row['Status Kepegawaian'] ||
          row['jenis_kepegawaian'] ||
          '';

        let jenisKepegawaian: JenisKepegawaian = 'PNS';
        const strKep = String(rawKepegawaian).toLowerCase().trim();
        if (
          strKep.includes('non') ||
          strKep.includes('honorer') ||
          strKep.includes('gtt') ||
          strKep.includes('ptt') ||
          strKep.includes('ptik') ||
          strKep.includes('sukwan')
        ) {
          jenisKepegawaian = 'Non ASN';
        } else if (
          strKep.includes('purna') ||
          strKep.includes('bakti') ||
          strKep.includes('pensiun') ||
          strKep.includes('werdatama')
        ) {
          jenisKepegawaian = 'Purna Bakti';
        } else if (
          strKep.includes('pppk') ||
          strKep.includes('p3k') ||
          strKep.includes('kontrak') ||
          strKep.includes('p3')
        ) {
          jenisKepegawaian = 'PPPK';
        } else {
          jenisKepegawaian = 'PNS';
        }

        // Match Nomor Anggota (Optional, auto-generate if empty or placeholder)
        const rawNo =
          row['Nomor Anggota'] ||
          row['No. Anggota'] ||
          row['No Anggota'] ||
          '';

        let nomorAnggota = String(rawNo).trim();
        if (!nomorAnggota || nomorAnggota.toLowerCase().includes('opsional') || nomorAnggota.toLowerCase().includes('kosongkan')) {
          nomorAnggota = `KWB-${String(autoCounter).padStart(3, '0')}`;
          autoCounter++;
        }

        // Match No. HP & Jabatan
        const rawNoHp = row['No. HP'] || row['No HP'] || row['Nomor HP'] || row['Telepon'] || '';
        const defaultJabatan =
          jenisKepegawaian === 'PNS'
            ? 'Guru / Pegawai PNS'
            : jenisKepegawaian === 'PPPK'
            ? 'Guru / Pegawai PPPK'
            : jenisKepegawaian === 'Non ASN'
            ? 'Pegawai Non ASN / Honorer'
            : 'Anggota Purna Bakti';
        const rawJabatan = row['Jabatan'] || row['Posisi'] || defaultJabatan;

        const isValid = !!namaLengkap;
        const validationMessage = !isValid
          ? 'Nama Lengkap kosong pada baris ini'
          : undefined;

        return {
          nomorAnggota,
          namaLengkap,
          jenisKelamin,
          tempatTanggalLahir,
          alamatLengkap,
          tahunMasuk,
          jenisKepegawaian,
          noHp: String(rawNoHp).trim() || undefined,
          jabatan: String(rawJabatan).trim() || undefined,
          isValid,
          validationMessage
        };
      });

      setParsedRows(processed);
    } catch (err: any) {
      setUploadError('Gagal membaca berkas Excel: ' + (err.message || 'Format tidak didukung'));
    }
  };

  // Simpan Data Hasil Upload Excel ke Database
  const handleApplyUpload = () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      setUploadError('Tidak ada baris data valid yang dapat disimpan.');
      return;
    }

    setIsProcessing(true);

    try {
      const formattedItems: Omit<Anggota, 'id'>[] = validItems.map((r, i) => ({
        nomorAnggota: r.nomorAnggota,
        namaLengkap: r.namaLengkap,
        jenisKelamin: r.jenisKelamin,
        tempatTanggalLahir: r.tempatTanggalLahir,
        alamatLengkap: r.alamatLengkap,
        tahunMasuk: r.tahunMasuk,
        jenisKepegawaian: r.jenisKepegawaian,
        noHp: r.noHp,
        jabatan: r.jabatan,
        fotoUrl: r.jenisKelamin === 'Laki-laki'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
          : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
      }));

      const addedCount = StorageService.bulkAddAnggota(formattedItems, importMode === 'replace');

      setToastNotification(`Berhasil mengimpor ${addedCount} data anggota ke sistem!`);
      setIsUploadModalOpen(false);
      setParsedRows([]);
      setUploadFileName('');
      onDataChanged();

      setTimeout(() => {
        setToastNotification('');
      }, 5000);
    } catch (err: any) {
      setUploadError('Terjadi kesalahan saat menyimpan data: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredList = anggotaList.filter((a) => {
    const matchSearch =
      a.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nomorAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.alamatLengkap.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterKepegawaian === 'Semua' || a.jenisKepegawaian === filterKepegawaian;
    return matchSearch && matchType;
  });

  const countPNS = anggotaList.filter((a) => a.jenisKepegawaian === 'PNS').length;
  const countPPPK = anggotaList.filter((a) => a.jenisKepegawaian === 'PPPK').length;
  const countNonASN = anggotaList.filter((a) => a.jenisKepegawaian === 'Non ASN').length;
  const countPurnaBakti = anggotaList.filter((a) => a.jenisKepegawaian === 'Purna Bakti').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Anggota</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
            {anggotaList.length} <span className="text-[11px] font-normal text-slate-500">Orang</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">PNS</div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5 tabular-nums">
            {countPNS} <span className="text-[11px] font-normal text-slate-500">Anggota</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">PPPK</div>
          <div className="text-xl font-bold text-indigo-700 mt-0.5 tabular-nums">
            {countPPPK} <span className="text-[11px] font-normal text-slate-500">Anggota</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Non ASN</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5 tabular-nums">
            {countNonASN} <span className="text-[11px] font-normal text-slate-500">Anggota</span>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500">Purna Bakti</div>
          <div className="text-xl font-bold text-purple-700 mt-0.5 tabular-nums">
            {countPurnaBakti} <span className="text-[11px] font-normal text-slate-500">Anggota</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filter, Template Excel, Upload Excel, Export, Add */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama anggota, nomor anggota, alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Status Kepegawaian */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            {(['Semua', 'PNS', 'PPPK', 'Non ASN', 'Purna Bakti'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterKepegawaian(type)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  filterKepegawaian === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Template Excel, Upload Excel, Export Excel, Tambah Anggota */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Menu Template Excel */}
          <button
            onClick={handleDownloadTemplate}
            title="Download Template Format Excel Anggota (Nama Lengkap, Jenis Kelamin, TTL, Alamat, Tahun Masuk, PNS/PPPK)"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Template Excel</span>
          </button>

          {/* Menu Upload Excel */}
          <button
            onClick={() => {
              setParsedRows([]);
              setUploadFileName('');
              setUploadError('');
              setUploadSuccess('');
              setIsUploadModalOpen(true);
            }}
            title="Import dan Upload data anggota massal dari file Excel"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-300 hover:bg-teal-100 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>Upload Excel</span>
          </button>

          {/* Unduh Excel Data Saat Ini */}
          <button
            onClick={handleExportExcel}
            title="Export seluruh data anggota ke Excel"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>

          {/* Unduh PDF Data Keanggotaan */}
          <button
            onClick={() => exportAnggotaToPdf(filteredList)}
            title="Unduh laporan data keanggotaan ke format PDF"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Unduh PDF</span>
          </button>

          {/* Tambah Anggota Manual */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Main Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Anggota</th>
                <th className="py-3.5 px-4">Nama Lengkap & Foto</th>
                <th className="py-3.5 px-3">L/P</th>
                <th className="py-3.5 px-4">Tempat, Tgl Lahir</th>
                <th className="py-3.5 px-4">Alamat Lengkap</th>
                <th className="py-3.5 px-3">Tahun Masuk</th>
                <th className="py-3.5 px-3">Kepegawaian</th>
                <th className="py-3.5 px-4 text-center">Aksi & E-KTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <User className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-medium text-slate-600">Tidak ada data anggota yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Gunakan tombol "Upload Excel" atau "Tambah Anggota" untuk menambahkan anggota baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nomor Anggota */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {a.nomorAnggota}
                    </td>

                    {/* Foto & Nama Lengkap */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {a.fotoUrl ? (
                            <img
                              src={a.fotoUrl}
                              alt={a.namaLengkap}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {a.namaLengkap}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {a.jabatan ||
                              (a.jenisKepegawaian === 'PNS'
                                ? 'Pegawai Negeri Sipil'
                                : a.jenisKepegawaian === 'PPPK'
                                ? 'Pegawai Pemerintah PPPK'
                                : a.jenisKepegawaian === 'Non ASN'
                                ? 'Pegawai Non ASN / Honorer'
                                : 'Anggota Purna Bakti')}
                            {a.noHp && ` · ${a.noHp}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Jenis Kelamin */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          a.jenisKelamin === 'Laki-laki'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}
                      >
                        {a.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                      </span>
                    </td>

                    {/* Tempat Tanggal Lahir */}
                    <td className="py-3 px-4 text-slate-600">
                      {a.tempatTanggalLahir}
                    </td>

                    {/* Alamat Lengkap */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={a.alamatLengkap}>
                      {a.alamatLengkap}
                    </td>

                    {/* Tahun Masuk */}
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                      {a.tahunMasuk}
                    </td>

                    {/* Jenis Kepegawaian (PNS / PPPK / Non ASN / Purna Bakti) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          a.jenisKepegawaian === 'PNS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : a.jenisKepegawaian === 'PPPK'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : a.jenisKepegawaian === 'Non ASN'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {a.jenisKepegawaian}
                      </span>
                    </td>

                    {/* Aksi & E-KTA */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedEktaAnggota(a)}
                          title="Generate & Lihat Kartu E-KTA"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>E-KTA</span>
                        </button>

                        <button
                          onClick={() => openEditModal(a)}
                          title="Edit Data Anggota"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteClick(a)}
                          title="Hapus Data Keanggotaan"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
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

      {/* ========================================================= */}
      {/* MODAL 1: UPLOAD EXCEL DATA KEANGGOTAAN */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Upload & Import Data Keanggotaan dari Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan file spreadsheet berisi daftar nama dan identitas anggota koperasi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Guidance & Template Info Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Format Kolom Excel yang Didukung:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    <strong>Nama Lengkap</strong>, <strong>Jenis Kelamin</strong> (Laki-laki / Perempuan), <strong>Tempat Tanggal Lahir</strong>, <strong>Alamat Lengkap</strong>, <strong>Tahun Masuk Anggota</strong>, dan <strong>Jenis Kepegawaian</strong> (Pilihan: <em>PNS</em>, <em>PPPK</em>, <em>Non ASN</em>, atau <em>Purna Bakti</em>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-400 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg shadow-2xs shrink-0 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Format Template (.xlsx)</span>
                </button>
              </div>

              {/* Error & Success Messages */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button onClick={() => setUploadError('')} className="font-bold text-rose-600">✕</button>
                </div>
              )}

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelFileSelect}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-600 mb-2 stroke-1" />
                <p className="text-xs font-bold text-slate-800">
                  {uploadFileName ? `File Terpilih: ${uploadFileName}` : 'Klik untuk memilih file Excel atau seret berkas ke sini'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mendukung format Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) atau <strong>.csv</strong>
                </p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadFileName ? 'Pilih File Lain' : 'Pilih Berkas Excel'}</span>
                  </button>
                  {uploadFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFileName('');
                        setParsedRows([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table of Parsed Data */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Pratinjau Data Excel ({parsedRows.length} Baris Ditemukan)
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        PNS: {parsedRows.filter(r => r.jenisKepegawaian === 'PNS').length}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                        PPPK: {parsedRows.filter(r => r.jenisKepegawaian === 'PPPK').length}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        Valid: {parsedRows.filter(r => r.isValid).length}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">No. Anggota</th>
                          <th className="py-2 px-3">Nama Lengkap</th>
                          <th className="py-2 px-2 text-center">L/P</th>
                          <th className="py-2 px-3">Tempat, Tgl Lahir</th>
                          <th className="py-2 px-3">Alamat</th>
                          <th className="py-2 px-2 text-center">Tahun</th>
                          <th className="py-2 px-3">Kepegawaian</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{row.nomorAnggota}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{row.namaLengkap}</td>
                            <td className="py-2 px-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                              }`}>
                                {row.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]">{row.tempatTanggalLahir}</td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">{row.alamatLengkap}</td>
                            <td className="py-2 px-2 text-center text-slate-700 font-medium">{row.tahunMasuk}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.jenisKepegawaian === 'PNS' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {row.jenisKepegawaian}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Siap Import</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold" title={row.validationMessage}>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>{row.validationMessage || 'Error'}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mode Import Selection */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Metode Penerapan Data:
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span><strong>Tambahkan ke data yang ada (Append)</strong> — aman, tidak menghapus anggota lama</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-rose-700">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span><strong>Timpa / Gantikan seluruh anggota (Overwrite)</strong></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs transition-colors"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleApplyUpload}
                disabled={parsedRows.filter(r => r.isValid).length === 0 || isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                {isProcessing ? (
                  <span>Menyimpan ke Sistem...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terapkan & Simpan ({parsedRows.filter(r => r.isValid).length} Anggota)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FORM TAMBAH / EDIT ANGGOTA MANUAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">
                {editingAnggota ? 'Edit Data Keanggotaan' : 'Daftarkan Anggota Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nomor Anggota */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Anggota *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomorAnggota}
                    onChange={(e) => setNomorAnggota(e.target.value)}
                    placeholder="Contoh: KWB-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                {/* Jenis Kepegawaian (PNS / PPPK / Non ASN / Purna Bakti) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Kepegawaian *
                  </label>
                  <select
                    value={jenisKepegawaian}
                    onChange={(e) => setJenisKepegawaian(e.target.value as JenisKepegawaian)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="PNS">Pegawai Negeri Sipil (PNS)</option>
                    <option value="PPPK">Pegawai Pemerintah Perjanjian Kerja (PPPK)</option>
                    <option value="Non ASN">Non ASN (Honorer / GTT / PTT)</option>
                    <option value="Purna Bakti">Purna Bakti (Pensiunan)</option>
                  </select>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap beserta Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Drs. H. Ahmad Sudrajat, M.Pd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jenis Kelamin */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="jk"
                        value="Laki-laki"
                        checked={jenisKelamin === 'Laki-laki'}
                        onChange={() => setJenisKelamin('Laki-laki')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Laki-laki</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="jk"
                        value="Perempuan"
                        checked={jenisKelamin === 'Perempuan'}
                        onChange={() => setJenisKelamin('Perempuan')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Perempuan</span>
                    </label>
                  </div>
                </div>

                {/* Tahun Masuk Anggota */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tahun Masuk Anggota *
                  </label>
                  <input
                    type="number"
                    required
                    min={1980}
                    max={2035}
                    value={tahunMasuk}
                    onChange={(e) => setTahunMasuk(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              {/* Tempat Tanggal Lahir */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempat & Tanggal Lahir *
                </label>
                <input
                  type="text"
                  required
                  value={tempatTanggalLahir}
                  onChange={(e) => setTempatTanggalLahir(e.target.value)}
                  placeholder="Contoh: Bandung, 12 Agustus 1978"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap *
                </label>
                <textarea
                  required
                  rows={2}
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  placeholder="Alamat domisili lengkap beserta RT/RW, Kelurahan, Kecamatan, Kota"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* No HP */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="Contoh: 08122345678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Jabatan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jabatan / Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Guru Ahli Madya / Tata Usaha"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Upload Foto Anggota */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload Foto Anggota (untuk E-KTA)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-lg border border-slate-300 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt="Preview Foto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    <p className="text-[10px] text-slate-400">
                      Format JPG atau PNG. Foto akan ditampilkan di Kartu Tanda Anggota Elektronik.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                {editingAnggota ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = editingAnggota;
                      setIsModalOpen(false);
                      handleDeleteClick(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Keanggotaan</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    {editingAnggota ? 'Simpan Perubahan' : 'Daftarkan Anggota'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: KONFIRMASI HAPUS KEANGGOTAAN */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Hapus Data Keanggotaan
                  </h3>
                  <p className="text-xs text-rose-700 font-medium">
                    Konfirmasi penghapusan anggota koperasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Member Card Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                  {deleteTarget.fotoUrl ? (
                    <img
                      src={deleteTarget.fotoUrl}
                      alt={deleteTarget.namaLengkap}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {deleteTarget.namaLengkap}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {deleteTarget.nomorAnggota} · <span className="font-sans font-semibold text-emerald-700">{deleteTarget.jenisKepegawaian}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {deleteTarget.alamatLengkap}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data keanggotaan untuk <strong className="text-slate-900">{deleteTarget.namaLengkap}</strong> ({deleteTarget.nomorAnggota})?
              </p>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer text-xs text-amber-900">
                <input
                  type="checkbox"
                  checked={deleteRelatedData}
                  onChange={(e) => setDeleteRelatedData(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>
                  <strong>Hapus juga buku simpanan & pinjaman</strong> yang terkait dengan anggota ini agar data keuangan koperasi tetap seimbang dan bersih.
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Keanggotaan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-KTA Preview Modal */}
      {selectedEktaAnggota && (
        <EKTAView
          anggota={selectedEktaAnggota}
          onClose={() => setSelectedEktaAnggota(null)}
        />
      )}
    </div>
  );
};
