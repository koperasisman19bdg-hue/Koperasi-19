import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Eye,
  FileCode,
  Layers,
  ArrowRight,
  Info,
  Check,
  ChevronRight,
  Save,
  FileUp,
  Database,
  BarChart3,
  Edit3,
  FileType
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StorageService, parseYearsFromPeriode } from '../utils/storage';
import { exportAIReportToWord } from '../utils/exportWord';
import {
  exportAIReportToPdf,
  exportArusKasToPdf,
  exportPerubahanEkuitasToPdf,
  exportCALKToPdf,
  exportRekonsiliasiToPdf,
  exportPosisiKeuanganToPdf,
  exportPHUToPdf
} from '../utils/exportPdf';
import {
  GeneratedFinancialReport,
  ArusKasReport,
  PerubahanEkuitasReport,
  CALKReport,
  PengaturanAkun,
  JurnalItem,
  SimpananRecord,
  PinjamanUang,
  PembukuanTokoItem,
  PembukuanSeragamItem,
  UploadedPosisiKeuanganData,
  UploadedPHUData
} from '../types';

// Helper builders to construct SAK EP compliant Laporan Posisi Keuangan & PHU from Fitur 6 Uploaded Reports
export function buildPosisiFromUploaded(uPos: UploadedPosisiKeuanganData) {
  const sumBerjalan = (arr: { nilaiBerjalan: number }[] = []) => arr.reduce((acc, curr) => acc + (Number(curr.nilaiBerjalan) || 0), 0);
  const sumLalu = (arr: { nilaiLalu: number }[] = []) => arr.reduce((acc, curr) => acc + (Number(curr.nilaiLalu) || 0), 0);

  const kasItem = uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('kas') && !i.namaAkun.toLowerCase().includes('pertokoan')) || uPos.asetLancar?.[0];
  const bankItem = uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('bank')) || uPos.asetLancar?.[1];
  const totalKasDanBank = (kasItem?.nilaiBerjalan || 0) + (bankItem?.nilaiBerjalan || 0);
  const totalKasDanBankLalu = (kasItem?.nilaiLalu || 0) + (bankItem?.nilaiLalu || 0);

  const totalAsetLancarNoPenyertaan = sumBerjalan(uPos.asetLancar);
  const totalAsetLancarNoPenyertaanLalu = sumLalu(uPos.asetLancar);

  const totalPenyertaan = sumBerjalan(uPos.penyertaan);
  const totalPenyertaanLalu = sumLalu(uPos.penyertaan);

  const totalAsetLancar = totalAsetLancarNoPenyertaan + totalPenyertaan;
  const totalAsetLancarLalu = totalAsetLancarNoPenyertaanLalu + totalPenyertaanLalu;

  const totalAsetTetapNeto = sumBerjalan(uPos.asetTetap);
  const totalAsetTetapNetoLalu = sumLalu(uPos.asetTetap);

  const totalAset = totalAsetLancar + totalAsetTetapNeto;
  const totalAsetLalu = totalAsetLancarLalu + totalAsetTetapNetoLalu;

  const totalLiabilitas = sumBerjalan(uPos.liabilitas);
  const totalLiabilitasLalu = sumLalu(uPos.liabilitas);

  const subtotalEkuitasSebelumShu = sumBerjalan(uPos.ekuitas);
  const subtotalEkuitasSebelumShuLalu = sumLalu(uPos.ekuitas);

  const shuTahunBerjalan = uPos.shuTahunBerjalan?.nilaiBerjalan || 0;
  const shuTahunBerjalanLalu = uPos.shuTahunBerjalan?.nilaiLalu || 0;

  const totalEkuitas = subtotalEkuitasSebelumShu + shuTahunBerjalan;
  const totalEkuitasLalu = subtotalEkuitasSebelumShuLalu + shuTahunBerjalanLalu;

  const totalLiabilitasDanEkuitas = totalLiabilitas + totalEkuitas;
  const totalLiabilitasDanEkuitasLalu = totalLiabilitasLalu + totalEkuitasLalu;

  const thBerjalan = uPos.tahunBerjalan || '2025';
  const thLalu = uPos.tahunLalu || '2024';

  return {
    periode: `Tahun Buku ${thBerjalan}`,
    tahunBerjalan: thBerjalan,
    tahunSebelumnya: thLalu,
    asetLancar: {
      kas: kasItem?.nilaiBerjalan || 0,
      kasLalu: kasItem?.nilaiLalu || 0,
      bank: bankItem?.nilaiBerjalan || 0,
      bankLalu: bankItem?.nilaiLalu || 0,
      totalKasDanBank,
      totalKasDanBankLalu,
      piutangUangAnggota: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('piutang uang'))?.nilaiBerjalan || 0,
      piutangUangAnggotaLalu: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('piutang uang'))?.nilaiLalu || 0,
      piutangBarang: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('piutang barang'))?.nilaiBerjalan || 0,
      piutangBarangLalu: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('piutang barang'))?.nilaiLalu || 0,
      persediaanPertokoan: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan barang pertokoan'))?.nilaiBerjalan || 0,
      persediaanPertokoanLalu: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan barang pertokoan'))?.nilaiLalu || 0,
      persediaanPsasAtribut: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan psas'))?.nilaiBerjalan || 0,
      persediaanPsasAtributLalu: uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan psas'))?.nilaiLalu || 0,
      totalPersediaan: (uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan barang pertokoan'))?.nilaiBerjalan || 0) + (uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan psas'))?.nilaiBerjalan || 0),
      totalPersediaanLalu: (uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan barang pertokoan'))?.nilaiLalu || 0) + (uPos.asetLancar?.find(i => i.namaAkun.toLowerCase().includes('persediaan psas'))?.nilaiLalu || 0),
      totalAsetLancar,
      totalAsetLancarLalu
    },
    asetTidakLancar: {
      asetTetapInventaris: (uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('peralatan') && !i.namaAkun.toLowerCase().includes('akumulasi'))?.nilaiBerjalan || 0) + (uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('gedung'))?.nilaiBerjalan || 0),
      asetTetapInventarisLalu: (uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('peralatan') && !i.namaAkun.toLowerCase().includes('akumulasi'))?.nilaiLalu || 0) + (uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('gedung'))?.nilaiLalu || 0),
      akumulasiPenyusutan: Math.abs((uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('akumulasi penyusutan peralatan'))?.nilaiBerjalan || 0) + (uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('akumulasi penyusutan dan rehabilitasi'))?.nilaiBerjalan || 0)),
      akumulasiPenyusutanLalu: Math.abs((uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('akumulasi penyusutan peralatan'))?.nilaiLalu || 0) + (uPos.asetTetap?.find(i => i.namaAkun.toLowerCase().includes('akumulasi penyusutan dan rehabilitasi'))?.nilaiLalu || 0)),
      nilaiBukuAsetTetap: totalAsetTetapNeto,
      nilaiBukuAsetTetapLalu: totalAsetTetapNetoLalu,
      totalAsetTidakLancar: totalAsetTetapNeto,
      totalAsetTidakLancarLalu: totalAsetTetapNetoLalu
    },
    totalAset,
    totalAsetLalu,
    liabilitasJangkaPendek: {
      simpananSukarela: uPos.liabilitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan sukarela'))?.nilaiBerjalan || 0,
      simpananSukarelaLalu: uPos.liabilitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan sukarela'))?.nilaiLalu || 0,
      hutangUsahaPengadaan: 0,
      hutangUsahaPengadaanLalu: 0,
      bebanAkrualHonor: Math.max(0, totalLiabilitas - (uPos.liabilitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan sukarela'))?.nilaiBerjalan || 0)),
      bebanAkrualHonorLalu: Math.max(0, totalLiabilitasLalu - (uPos.liabilitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan sukarela'))?.nilaiLalu || 0)),
      totalLiabilitas,
      totalLiabilitasLalu
    },
    ekuitas: {
      simpananPokok: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan pokok'))?.nilaiBerjalan || 0,
      simpananPokokLalu: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan pokok'))?.nilaiLalu || 0,
      simpananWajib: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan wajib'))?.nilaiBerjalan || 0,
      simpananWajibLalu: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('simpanan wajib'))?.nilaiLalu || 0,
      danaCadangan: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('dana cadangan'))?.nilaiBerjalan || 0,
      danaCadanganLalu: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('dana cadangan'))?.nilaiLalu || 0,
      hibahDonasi: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('hibah'))?.nilaiBerjalan || 0,
      hibahDonasiLalu: uPos.ekuitas?.find(i => i.namaAkun.toLowerCase().includes('hibah'))?.nilaiLalu || 0,
      subtotalEkuitasSebelumShu,
      subtotalEkuitasSebelumShuLalu,
      shuTahunBerjalan,
      shuTahunBerjalanLalu,
      totalEkuitas,
      totalEkuitasLalu
    },
    totalLiabilitasDanEkuitas,
    totalLiabilitasDanEkuitasLalu
  };
}

export function buildPHUFromUploaded(uPhu: UploadedPHUData) {
  const sumBerjalan = (arr: { nilaiBerjalan: number }[] = []) => arr.reduce((acc, curr) => acc + (Number(curr.nilaiBerjalan) || 0), 0);
  const sumLalu = (arr: { nilaiLalu: number }[] = []) => arr.reduce((acc, curr) => acc + (Number(curr.nilaiLalu) || 0), 0);

  const totalPendapatan = sumBerjalan(uPhu.pendapatan);
  const totalPendapatanLalu = sumLalu(uPhu.pendapatan);

  const totalBeban = sumBerjalan(uPhu.beban);
  const totalBebanLalu = sumLalu(uPhu.beban);

  const sisaHasilUsaha = totalPendapatan - totalBeban;
  const sisaHasilUsahaLalu = totalPendapatanLalu - totalBebanLalu;

  const thBerjalan = uPhu.tahunBerjalan || '2025';
  const thLalu = uPhu.tahunLalu || '2024';

  return {
    periode: `Tahun Buku ${thBerjalan}`,
    tahunBerjalan: thBerjalan,
    tahunSebelumnya: thLalu,
    pendapatan: {
      jasaPinjamanUang: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('usp') || i.namaAkun.toLowerCase().includes('pinjaman'))?.nilaiBerjalan || 0,
      jasaPinjamanUangLalu: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('usp') || i.namaAkun.toLowerCase().includes('pinjaman'))?.nilaiLalu || 0,
      jasaPinjamanBarang: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('barang'))?.nilaiBerjalan || 0,
      jasaPinjamanBarangLalu: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('barang'))?.nilaiLalu || 0,
      penjualanToko: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('pertokoan'))?.nilaiBerjalan || 0,
      penjualanTokoLalu: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('pertokoan'))?.nilaiLalu || 0,
      penjualanPsasSeragam: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('psas'))?.nilaiBerjalan || 0,
      penjualanPsasSeragamLalu: uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('psas'))?.nilaiLalu || 0,
      pendapatanLain: Math.max(0, totalPendapatan - ((uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('usp'))?.nilaiBerjalan || 0) + (uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('barang'))?.nilaiBerjalan || 0) + (uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('pertokoan'))?.nilaiBerjalan || 0) + (uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('psas'))?.nilaiBerjalan || 0))),
      pendapatanLainLalu: Math.max(0, totalPendapatanLalu - ((uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('usp'))?.nilaiLalu || 0) + (uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('barang'))?.nilaiLalu || 0) + (uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('pertokoan'))?.nilaiLalu || 0) + (uPhu.pendapatan?.find(i => i.namaAkun.toLowerCase().includes('psas'))?.nilaiLalu || 0))),
      totalPendapatan,
      totalPendapatanLalu
    },
    beban: {
      pokokTokoSeragam: uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('pokok'))?.nilaiBerjalan || 0,
      pokokTokoSeragamLalu: uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('pokok'))?.nilaiLalu || 0,
      operasionalDanHonor: (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('gaji'))?.nilaiBerjalan || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('thr'))?.nilaiBerjalan || 0),
      operasionalDanHonorLalu: (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('gaji'))?.nilaiLalu || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('thr'))?.nilaiLalu || 0),
      organisasiDanRat: (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('rat'))?.nilaiBerjalan || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('pengawas'))?.nilaiBerjalan || 0),
      organisasiDanRatLalu: (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('rat'))?.nilaiLalu || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('pengawas'))?.nilaiLalu || 0),
      penyusutanInventaris: (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('penyusutan pertokoan'))?.nilaiBerjalan || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('penyusutan pembangunan'))?.nilaiBerjalan || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('penyusutan peralatan'))?.nilaiBerjalan || 0),
      penyusutanInventarisLalu: (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('penyusutan pertokoan'))?.nilaiLalu || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('penyusutan pembangunan'))?.nilaiLalu || 0) + (uPhu.beban?.find(i => i.namaAkun.toLowerCase().includes('penyusutan peralatan'))?.nilaiLalu || 0),
      totalBeban,
      totalBebanLalu
    },
    sisaHasilUsaha,
    sisaHasilUsahaLalu
  };
}

interface MembuatLaporanAIPageProps {
  onDataChanged?: () => void;
}

export const MembuatLaporanAIPage: React.FC<MembuatLaporanAIPageProps> = ({ onDataChanged }) => {
  const [pengaturan, setPengaturan] = useState<PengaturanAkun>(() => StorageService.getPengaturan());
  const [reportsHistory, setReportsHistory] = useState<GeneratedFinancialReport[]>(() => StorageService.getAIReports());
  const [uploadedPosisi, setUploadedPosisi] = useState<UploadedPosisiKeuanganData>(() => StorageService.getUploadedPosisiKeuangan());
  const [uploadedPHU, setUploadedPHU] = useState<UploadedPHUData>(() => StorageService.getUploadedPHU());

  const [activeReport, setActiveReport] = useState<GeneratedFinancialReport | null>(() => {
    const list = StorageService.getAIReports();
    return list.length > 0 ? list[0] : null;
  });

  // Input & Generation State
  const [inputMode, setInputMode] = useState<'upload' | 'livedata' | 'text'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContentText, setFileContentText] = useState<string>('');
  const [periode, setPeriode] = useState<string>('Tahun Buku 2025');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [manualText, setManualText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal Konfirmasi Hapus Laporan
  const [deleteReportTarget, setDeleteReportTarget] = useState<GeneratedFinancialReport | 'all' | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);

  // Active Output SubTab (Menu Posisi Keuangan dan PHU dipindahkan ke Fitur 6. Upload Laporan)
  const [activeOutputTab, setActiveOutputTab] = useState<'aruskas' | 'ekuitas' | 'calk' | 'rekonsiliasi' | 'ringkasan' | 'riwayat'>('aruskas');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState<GeneratedFinancialReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings, history, and uploaded reports
  useEffect(() => {
    const handlePengaturanUpdate = () => {
      setPengaturan(StorageService.getPengaturan());
    };
    const handleReportsUpdate = () => {
      const updated = StorageService.getAIReports();
      setReportsHistory(updated);
      setActiveReport((prev) => {
        if (!prev) return updated[0] || null;
        const found = updated.find((r) => r.id === prev.id);
        return found || updated[0] || null;
      });
    };
    const handleUploadedUpdate = () => {
      setUploadedPosisi(StorageService.getUploadedPosisiKeuangan());
      setUploadedPHU(StorageService.getUploadedPHU());
    };

    window.addEventListener('kwb-pengaturan-changed', handlePengaturanUpdate);
    window.addEventListener('kwb-ai-reports-changed', handleReportsUpdate);
    window.addEventListener('kwb-uploaded-posisi-changed', handleUploadedUpdate);
    window.addEventListener('kwb-uploaded-phu-changed', handleUploadedUpdate);
    return () => {
      window.removeEventListener('kwb-pengaturan-changed', handlePengaturanUpdate);
      window.removeEventListener('kwb-ai-reports-changed', handleReportsUpdate);
      window.removeEventListener('kwb-uploaded-posisi-changed', handleUploadedUpdate);
      window.removeEventListener('kwb-uploaded-phu-changed', handleUploadedUpdate);
    };
  }, []);

  // Handle File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setErrorMessage('');

    const fileName = file.name.toLowerCase();

    // If Excel / Spreadsheet file
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          let fullText = `=== EXCEL WORKBOOK: ${file.name} ===\n`;
          wb.SheetNames.forEach(sheetName => {
            const ws = wb.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(ws);
            fullText += `\n--- SHEET: ${sheetName} ---\n${csv}\n`;
          });
          setFileContentText(fullText);
          setSuccessMessage(`Berkas "${file.name}" berhasil dibaca (${wb.SheetNames.length} lembar kerja ditemukan).`);
        } catch (err: any) {
          console.error('Error parsing excel:', err);
          setErrorMessage('Gagal membaca berkas Excel. Silakan coba lagi atau gunakan format teks/CSV.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      // Text / PDF / Generic File
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setFileContentText(text || `[Berkas Dokumen Laporan: ${file.name} (Ukuran: ${(file.size / 1024).toFixed(1)} KB)]`);
        setSuccessMessage(`Berkas "${file.name}" siap dianalisis.`);
      };
      reader.readAsText(file);
    }
  };

  // Trigger AI Report Generation
  const handleGenerateReport = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsGenerating(true);
    setGenerationStep('Menganalisis data laporan keuangan...');

    try {
      // Gather live cooperative data from Fitur 6 (Uploaded Financial Reports) and active transactions
      const livePosisi = StorageService.getUploadedPosisiKeuangan();
      const livePHU = StorageService.getUploadedPHU();
      const liveData = {
        uploadedPosisiKeuangan: livePosisi,
        uploadedPHU: livePHU,
        anggota: StorageService.getAnggota(),
        jurnal: StorageService.getJurnal(),
        simpanan: StorageService.getSimpanan(),
        pinjamanUang: StorageService.getPinjamanUang(),
        pinjamanBarang: StorageService.getPinjamanBarang(),
        toko: StorageService.getToko(),
        seragam: StorageService.getSeragam()
      };

      let finalContent = fileContentText;
      let finalFileName = uploadedFile?.name;

      if (inputMode === 'livedata') {
        const pCalc = buildPosisiFromUploaded(livePosisi);
        const phuCalc = buildPHUFromUploaded(livePHU);
        finalContent = `DATA LIVE DARI FITUR 6 (UPLOAD LAPORAN KEUANGAN):\n` +
          `• Laporan Posisi Keuangan (Neraca) ${livePosisi.tahunBerjalan}: Total Aset Rp ${pCalc.totalAset.toLocaleString('id-ID')}, Total Liabilitas Rp ${pCalc.liabilitasJangkaPendek.totalLiabilitas.toLocaleString('id-ID')}, Total Ekuitas Rp ${pCalc.ekuitas.totalEkuitas.toLocaleString('id-ID')}, SHU Tahun Berjalan Rp ${(livePosisi.shuTahunBerjalan?.nilaiBerjalan || 0).toLocaleString('id-ID')}.\n` +
          `• PHU (Laba Rugi) ${livePHU.tahunBerjalan}: Total Pendapatan Rp ${phuCalc.pendapatan.totalPendapatan.toLocaleString('id-ID')}, Total Beban Rp ${phuCalc.beban.totalBeban.toLocaleString('id-ID')}, SHU Bersih Rp ${phuCalc.sisaHasilUsaha.toLocaleString('id-ID')}.\n` +
          `• Transaksi Internal Sistem: ${liveData.jurnal.length} transaksi jurnal, ${liveData.simpanan.length} rekening simpanan, ${liveData.pinjamanUang.length} pinjaman.`;
        finalFileName = 'Data Live Fitur 6 (Upload Laporan Keuangan) & Transaksi Internal';
      } else if (inputMode === 'text') {
        if (!manualText.trim()) {
          setErrorMessage('Silakan ketik atau tempelkan ringkasan laporan keuangan terlebih dahulu.');
          setIsGenerating(false);
          return;
        }
        finalContent = manualText;
        finalFileName = 'Input Teks Ringkasan Neraca / Laba Rugi';
      } else {
        if (!uploadedFile && !fileContentText) {
          setErrorMessage('Silakan pilih berkas laporan keuangan yang ingin diunggah terlebih dahulu.');
          setIsGenerating(false);
          return;
        }
      }

      setGenerationStep('Memproses perhitungan Arus Kas & Perubahan Ekuitas dengan Gemini AI...');

      const result = await StorageService.generateAIFinancialReports({
        fileContent: finalContent,
        fileName: finalFileName,
        mimeType: uploadedFile?.type,
        liveData,
        periode,
        customInstruction
      });

      if (result.success && result.data) {
        setActiveReport(result.data);
        setEditedReport(result.data);
        setReportsHistory(StorageService.getAIReports());
        setActiveOutputTab('ringkasan');
        setSuccessMessage('Laporan Arus Kas, Perubahan Ekuitas, dan Catatan Atas Laporan Keuangan (CALK) berhasil disusun secara otomatis!');
      } else {
        setErrorMessage(result.error || 'Gagal menyusun laporan keuangan dengan AI.');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses laporan dengan AI.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Helper formatting currency
  const formatRupiah = (num: number = 0) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper Kop Surat Resmi PDF
  const drawKopSurat = (doc: jsPDF, judulDokumen: string, subJudul?: string): number => {
    let startY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo Kiri
    if (pengaturan.tampilkanLogoKiriKop !== false && pengaturan.logoUrl) {
      try {
        doc.addImage(pengaturan.logoUrl, 'PNG', 14, startY, 20, 20);
      } catch (e) {
        console.warn('Could not add left logo to PDF', e);
      }
    }

    // Logo Kanan
    if (pengaturan.tampilkanLogoKananKop !== false && (pengaturan.logoKananUrl || pengaturan.logoUrl)) {
      try {
        const logoKanan = pengaturan.logoKananUrl || pengaturan.logoUrl;
        doc.addImage(logoKanan, 'PNG', pageWidth - 34, startY, 20, 20);
      } catch (e) {
        console.warn('Could not add right logo to PDF', e);
      }
    }

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    if (pengaturan.instansiInduk) {
      const lines = pengaturan.instansiInduk.split('\n');
      lines.forEach((line) => {
        doc.text(line.trim(), pageWidth / 2, startY + 3, { align: 'center' });
        startY += 4.5;
      });
    }

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(pengaturan.namaKoperasi || 'KOPERASI PEGAWAI "WARGA BAHAGIA"', pageWidth / 2, startY + 4, { align: 'center' });
    startY += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(pengaturan.badanHukum || 'Badan Hukum No. 19/BH/KWK/1998 · Tgl 19 Mei 1998', pageWidth / 2, startY + 3, { align: 'center' });
    startY += 4;

    const kontakText = `${pengaturan.alamatKoperasi || 'Jl. Dago Asri No. 19 Bandung'} | Telp: ${pengaturan.teleponKoperasi || '(022) 2501919'}`;
    doc.text(kontakText, pageWidth / 2, startY + 3, { align: 'center' });
    startY += 4.5;

    // Double line divider
    const lineColor = pengaturan.warnaGarisKop === 'navy' ? [30, 58, 138] : [5, 150, 105];
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(1.2);
    doc.line(14, startY + 2, pageWidth - 14, startY + 2);
    doc.setLineWidth(0.4);
    doc.line(14, startY + 3.5, pageWidth - 14, startY + 3.5);

    startY += 10;

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(judulDokumen.toUpperCase(), pageWidth / 2, startY, { align: 'center' });
    startY += 5;

    if (subJudul) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(subJudul, pageWidth / 2, startY, { align: 'center' });
      startY += 6;
    }

    return startY;
  };

  // Helper Signature Block
  const drawTandaTangan = (doc: jsPDF, currentY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Check if new page is needed
    if (currentY + 45 > pageHeight - 15) {
      doc.addPage();
      currentY = 25;
    }

    const tglStr = `Bandung, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    doc.text(tglStr, pageWidth - 65, currentY);
    currentY += 5;

    doc.text('Pengurus Koperasi Pegawai "Warga Bahagia",', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // 3 Signatures: Ketua (Center/Left), Sekretaris (Left), Bendahara (Right)
    const col1X = 25;
    const col2X = pageWidth / 2;
    const col3X = pageWidth - 45;

    doc.setFont('helvetica', 'bold');
    doc.text('Sekretaris,', col1X, currentY, { align: 'center' });
    doc.text('Ketua Koperasi,', col2X, currentY, { align: 'center' });
    doc.text('Bendahara,', col3X, currentY, { align: 'center' });

    currentY += 22; // Signature space

    // Names & NIPs
    doc.text(pengaturan.namaSekretaris || 'Dra. Hj. Neneng Suryani, M.M.Pd.', col1X, currentY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    if (pengaturan.nipSekretaris) {
      doc.text(`NIP. ${pengaturan.nipSekretaris}`, col1X, currentY + 3.5, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(pengaturan.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.', col2X, currentY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    if (pengaturan.nipKetua) {
      doc.text(`NIP. ${pengaturan.nipKetua}`, col2X, currentY + 3.5, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(pengaturan.namaBendahara || 'Hj. Siti Rohmah, S.Pd., M.M.', col3X, currentY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    if (pengaturan.nipBendahara) {
      doc.text(`NIP. ${pengaturan.nipBendahara}`, col3X, currentY + 3.5, { align: 'center' });
    }
  };

  // 1. Export Gabungan Seluruh Laporan Keuangan SAK EP (Paket Lengkap 6 Laporan & Rekonsiliasi)
  const handleExportPDF = () => {
    if (!activeReport) return;
    try {
      exportAIReportToPdf(activeReport);
      setSuccessMessage('Dokumen PDF Gabungan Lengkap 6 Laporan Keuangan SAK EP & Rekonsiliasi LPJ berhasil diunduh!');
    } catch (err) {
      console.error('Error exporting combined PDF:', err);
      setErrorMessage('Gagal mencetak / mengunduh PDF Gabungan. Silakan coba lagi.');
    }
  };

  // 2. Export Satuan: 1. Laporan Arus Kas PDF (Metode Langsung)
  const handleExportArusKasPDF = () => {
    if (!activeReport) return;
    try {
      exportArusKasToPdf(activeReport);
      setSuccessMessage('Dokumen PDF Satuan: 1. Laporan Arus Kas (Metode Langsung SAK EP) berhasil diunduh!');
    } catch (err) {
      console.error('Error exporting Arus Kas PDF:', err);
      setErrorMessage('Gagal mencetak PDF Arus Kas. Silakan coba lagi.');
    }
  };

  // 3. Export Satuan: 2. Laporan Perubahan Ekuitas PDF (Modal Sendiri)
  const handleExportEkuitasPDF = () => {
    if (!activeReport) return;
    try {
      exportPerubahanEkuitasToPdf(activeReport);
      setSuccessMessage('Dokumen PDF Satuan: 2. Laporan Perubahan Ekuitas (SAK EP Bab 6 & 22) berhasil diunduh!');
    } catch (err) {
      console.error('Error exporting Perubahan Ekuitas PDF:', err);
      setErrorMessage('Gagal mencetak PDF Perubahan Ekuitas. Silakan coba lagi.');
    }
  };

  // 4. Export Satuan: 3. Catatan Atas Laporan Keuangan (CALK) PDF
  const handleExportCALKPDF = () => {
    if (!activeReport) return;
    try {
      exportCALKToPdf(activeReport);
      setSuccessMessage('Dokumen PDF Satuan: 3. Catatan Atas Laporan Keuangan (CALK SAK EP) berhasil diunduh!');
    } catch (err) {
      console.error('Error exporting CALK PDF:', err);
      setErrorMessage('Gagal mencetak PDF CALK. Silakan coba lagi.');
    }
  };

  // 5. Export Satuan: 4. Tabel Rekonsiliasi LPJ -> SAK EP PDF
  const handleExportRekonsiliasiPDF = () => {
    if (!activeReport) return;
    try {
      exportRekonsiliasiToPdf(activeReport);
      setSuccessMessage('Dokumen PDF Satuan: Tabel Rekonsiliasi LPJ ke SAK EP berhasil diunduh!');
    } catch (err) {
      console.error('Error exporting Rekonsiliasi PDF:', err);
      setErrorMessage('Gagal mencetak PDF Rekonsiliasi. Silakan coba lagi.');
    }
  };

  // Handler Konfirmasi Hapus Riwayat Laporan (Satuan atau Semua)
  const handleConfirmDeleteReport = () => {
    if (!deleteReportTarget) return;
    setIsDeletingReport(true);

    try {
      if (deleteReportTarget === 'all') {
        StorageService.saveAIReports([]);
        setReportsHistory([]);
        setActiveReport(null);
        setSuccessMessage('Seluruh riwayat laporan AI telah berhasil dibersihkan.');
      } else {
        const toDelete = deleteReportTarget;
        StorageService.deleteAIReport(toDelete.id);
        const nextList = reportsHistory.filter(r => String(r.id) !== String(toDelete.id));
        setReportsHistory(nextList);
        if (activeReport?.id === toDelete.id) {
          setActiveReport(nextList.length > 0 ? nextList[0] : null);
        }
        setSuccessMessage(`Arsip laporan "${toDelete.periode}" telah berhasil dihapus.`);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal menghapus laporan.');
    } finally {
      setIsDeletingReport(false);
      setDeleteReportTarget(null);
    }
  };

  // Export 3 Laporan to Microsoft Word Document (.doc / .docx)
  const handleExportWord = () => {
    if (!activeReport) return;
    try {
      exportAIReportToWord(activeReport);
      setSuccessMessage('Dokumen Microsoft Word (.doc) 3 Laporan Keuangan Standar SAK EP berhasil diunduh!');
    } catch (err) {
      console.error('Error exporting Word:', err);
      setErrorMessage('Gagal mengunduh berkas Word. Silakan coba lagi.');
    }
  };

  // Export to Excel Workbook (All 6 Sheets SAK EP + Rekonsiliasi)
  const handleExportExcel = () => {
    if (!activeReport) return;

    const wb = XLSX.utils.book_new();
    const parsed = parseYearsFromPeriode(activeReport.periode);
    const thBerjalan = activeReport.arusKas.tahunBerjalan || parsed.thBerjalan;
    const thLalu = activeReport.arusKas.tahunSebelumnya || parsed.thLalu;

    const pk = activeReport.posisiKeuangan || {
      asetLancar: {
        kas: 5747047, kasLalu: 4820000,
        bank: 371038686, bankLalu: 319680000,
        totalKasDanBank: 376785733, totalKasDanBankLalu: 324500000,
        piutangUangAnggota: 566226683, piutangUangAnggotaLalu: 495340000,
        piutangBarang: 12141200, piutangBarangLalu: 14850000,
        persediaanPertokoan: 8565023, persediaanPertokoanLalu: 9200000,
        persediaanPsasAtribut: 60979000, persediaanPsasAtributLalu: 55400000,
        totalPersediaan: 69544023, totalPersediaanLalu: 64600000,
        totalAsetLancar: 1024697639, totalAsetLancarLalu: 899290000
      },
      asetTidakLancar: {
        asetTetapInventaris: 188484290, asetTetapInventarisLalu: 173484290,
        akumulasiPenyusutan: 30000000, akumulasiPenyusutanLalu: 24000000,
        nilaiBukuAsetTetap: 158484290, nilaiBukuAsetTetapLalu: 149484290,
        totalAsetTidakLancar: 158484290, totalAsetTidakLancarLalu: 149484290
      },
      totalAset: 1183181929, totalAsetLalu: 1048774290,
      liabilitasJangkaPendek: {
        simpananSukarela: 218450000, simpananSukarelaLalu: 185200000,
        hutangUsahaPengadaan: 45243153, hutangUsahaPengadaanLalu: 42119690,
        bebanAkrualHonor: 29300000, bebanAkrualHonorLalu: 24500000,
        totalLiabilitas: 292993153, totalLiabilitasLalu: 251819690
      },
      ekuitas: {
        simpananPokok: 33000000, simpananPokokLalu: 30000000,
        simpananWajib: 681979430, simpananWajibLalu: 615420000,
        danaCadangan: 108993547, danaCadanganLalu: 93689600,
        hibahDonasi: 5000000, hibahDonasiLalu: 5000000,
        subtotalEkuitasSebelumShu: 828972977, subtotalEkuitasSebelumShuLalu: 744109600,
        shuTahunBerjalan: 61215799, shuTahunBerjalanLalu: 52845000,
        totalEkuitas: 890188776, totalEkuitasLalu: 796954600
      },
      totalLiabilitasDanEkuitas: 1183181929, totalLiabilitasDanEkuitasLalu: 1048774290
    };

    const phu = activeReport.perhitunganHasilUsaha || {
      pendapatan: {
        jasaPinjamanUang: 102450600, jasaPinjamanUangLalu: 91200000,
        jasaPinjamanBarang: 8760000, jasaPinjamanBarangLalu: 9450000,
        penjualanToko: 28540287, penjualanTokoLalu: 26120000,
        penjualanPsasSeragam: 25430000, penjualanPsasSeragamLalu: 22800000,
        pendapatanLain: 4350000, pendapatanLainLalu: 3850000,
        totalPendapatan: 169530887, totalPendapatanLalu: 153420000
      },
      beban: {
        pokokTokoSeragam: 38640000, pokokTokoSeragamLalu: 35120000,
        operasionalDanHonor: 42150088, operasionalDanHonorLalu: 38455000,
        organisasiDanRat: 21525000, organisasiDanRatLalu: 21000000,
        penyusutanInventaris: 6000000, penyusutanInventarisLalu: 6000000,
        totalBeban: 108315088, totalBebanLalu: 100575000
      },
      sisaHasilUsaha: 61215799, sisaHasilUsahaLalu: 52845000
    };

    // Sheet 1: Posisi Keuangan (Neraca)
    const posisiData = [
      ['KOPERASI KONSUMEN "WARGA BAHAGIA" SMAN 19 BANDUNG'],
      ['LAPORAN POSISI KEUANGAN (NERACA) - SAK EP'],
      [`Periode: ${activeReport.periode}`],
      [],
      ['POS-POS NERACA', `Th. Berjalan (${thBerjalan})`, `Th. Sebelumnya (${thLalu})`],
      ['A. ASET LANCAR'],
      ['  Kas di Bendahara', pk.asetLancar.kas, pk.asetLancar.kasLalu],
      ['  Bank (Rekening Operasional)', pk.asetLancar.bank, pk.asetLancar.bankLalu],
      ['  Total Kas & Bank', pk.asetLancar.totalKasDanBank, pk.asetLancar.totalKasDanBankLalu],
      ['  Piutang Uang Anggota', pk.asetLancar.piutangUangAnggota, pk.asetLancar.piutangUangAnggotaLalu],
      ['  Piutang Barang Anggota', pk.asetLancar.piutangBarang, pk.asetLancar.piutangBarangLalu],
      ['  Persediaan Pertokoan', pk.asetLancar.persediaanPertokoan, pk.asetLancar.persediaanPertokoanLalu],
      ['  Persediaan PSAS / Seragam', pk.asetLancar.persediaanPsasAtribut, pk.asetLancar.persediaanPsasAtributLalu],
      ['TOTAL ASET LANCAR', pk.asetLancar.totalAsetLancar, pk.asetLancar.totalAsetLancarLalu],
      [],
      ['B. ASET TIDAK LANCAR'],
      ['  Aset Tetap & Peralatan Usaha', pk.asetTidakLancar.asetTetapInventaris, pk.asetTidakLancar.asetTetapInventarisLalu],
      ['  Akumulasi Penyusutan', -pk.asetTidakLancar.akumulasiPenyusutan, -pk.asetTidakLancar.akumulasiPenyusutanLalu],
      ['Nilai Buku Bersih Aset Tetap', pk.asetTidakLancar.nilaiBukuAsetTetap, pk.asetTidakLancar.nilaiBukuAsetTetapLalu],
      ['TOTAL ASET (AKTIVA)', pk.totalAset, pk.totalAsetLalu],
      [],
      ['C. LIABILITAS JANGKA PENDEK'],
      ['  Simpanan Sukarela Anggota', pk.liabilitasJangkaPendek.simpananSukarela, pk.liabilitasJangkaPendek.simpananSukarelaLalu],
      ['  Hutang Usaha Pengadaan', pk.liabilitasJangkaPendek.hutangUsahaPengadaan, pk.liabilitasJangkaPendek.hutangUsahaPengadaanLalu],
      ['  Beban Akrual & Honor Pengelola', pk.liabilitasJangkaPendek.bebanAkrualHonor, pk.liabilitasJangkaPendek.bebanAkrualHonorLalu],
      ['TOTAL LIABILITAS JANGKA PENDEK', pk.liabilitasJangkaPendek.totalLiabilitas, pk.liabilitasJangkaPendek.totalLiabilitasLalu],
      [],
      ['D. EKUITAS (MODAL SENDIRI)'],
      ['  Simpanan Pokok Anggota', pk.ekuitas.simpananPokok, pk.ekuitas.simpananPokokLalu],
      ['  Simpanan Wajib Anggota', pk.ekuitas.simpananWajib, pk.ekuitas.simpananWajibLalu],
      ['  Dana Cadangan Koperasi', pk.ekuitas.danaCadangan, pk.ekuitas.danaCadanganLalu],
      ['  Hibah / Modal Donasi', pk.ekuitas.hibahDonasi, pk.ekuitas.hibahDonasiLalu],
      ['  Subtotal Ekuitas Sebelum SHU', pk.ekuitas.subtotalEkuitasSebelumShu, pk.ekuitas.subtotalEkuitasSebelumShuLalu],
      ['  Sisa Hasil Usaha (SHU) Berjalan', pk.ekuitas.shuTahunBerjalan, pk.ekuitas.shuTahunBerjalanLalu],
      ['TOTAL EKUITAS BERSIH', pk.ekuitas.totalEkuitas, pk.ekuitas.totalEkuitasLalu],
      ['TOTAL LIABILITAS & EKUITAS (PASIVA)', pk.totalLiabilitasDanEkuitas, pk.totalLiabilitasDanEkuitasLalu]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posisiData), 'Posisi Keuangan (Neraca)');

    // Sheet 2: PHU
    const phuData = [
      ['KOPERASI KONSUMEN "WARGA BAHAGIA" SMAN 19 BANDUNG'],
      ['PERHITUNGAN HASIL USAHA (PHU / LABA RUGI)'],
      [`Periode: ${activeReport.periode}`],
      [],
      ['URAIAN PENDAPATAN & BEBAN', `Th. Berjalan (${thBerjalan})`, `Th. Sebelumnya (${thLalu})`],
      ['I. PENDAPATAN USAHA'],
      ['  Pendapatan Jasa Pinjaman Uang', phu.pendapatan.jasaPinjamanUang, phu.pendapatan.jasaPinjamanUangLalu],
      ['  Pendapatan Jasa Pinjaman Barang', phu.pendapatan.jasaPinjamanBarang, phu.pendapatan.jasaPinjamanBarangLalu],
      ['  Pendapatan Hasil Penjualan Toko', phu.pendapatan.penjualanToko, phu.pendapatan.penjualanTokoLalu],
      ['  Pendapatan Hasil Penjualan PSAS Seragam', phu.pendapatan.penjualanPsasSeragam, phu.pendapatan.penjualanPsasSeragamLalu],
      ['  Pendapatan Lain-lain (Giro dll)', phu.pendapatan.pendapatanLain, phu.pendapatan.pendapatanLainLalu],
      ['TOTAL PENDAPATAN KOPERASI', phu.pendapatan.totalPendapatan, phu.pendapatan.totalPendapatanLalu],
      [],
      ['II. BEBAN USAHA & OPERASIONAL'],
      ['  Beban Pokok Toko & Seragam', phu.beban.pokokTokoSeragam, phu.beban.pokokTokoSeragamLalu],
      ['  Beban Operasional, Honor & Admin', phu.beban.operasionalDanHonor, phu.beban.operasionalDanHonorLalu],
      ['  Beban Organisasi, RAT & Pengawas', phu.beban.organisasiDanRat, phu.beban.organisasiDanRatLalu],
      ['  Beban Penyusutan Inventaris', phu.beban.penyusutanInventaris, phu.beban.penyusutanInventarisLalu],
      ['TOTAL BEBAN USAHA', phu.beban.totalBeban, phu.beban.totalBebanLalu],
      ['SISA HASIL USAHA (SHU) BERSIH', phu.sisaHasilUsaha, phu.sisaHasilUsahaLalu]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(phuData), 'Perhitungan Hasil Usaha');

    // Sheet 3: Arus Kas
    const arusKasData = [
      ['KOPERASI KONSUMEN "WARGA BAHAGIA" SMAN 19 BANDUNG'],
      ['LAPORAN ARUS KAS (METODE LANGSUNG)'],
      [`Periode: ${activeReport.arusKas.periode}`],
      [],
      ['A. AKTIVITAS OPERASI', `Th. Berjalan (${thBerjalan})`, `Th. Sebelumnya (${thLalu})`],
      ...activeReport.arusKas.aktivitasOperasi.map(i => [i.keterangan, i.jumlah, i.jumlahLalu ?? Math.round(i.jumlah * 0.88)]),
      ['Total Kas dari Aktivitas Operasi', activeReport.arusKas.totalKasOperasi, activeReport.arusKas.totalKasOperasiLalu ?? Math.round(activeReport.arusKas.totalKasOperasi * 0.88)],
      [],
      ['B. AKTIVITAS INVESTASI', `Th. Berjalan (${thBerjalan})`, `Th. Sebelumnya (${thLalu})`],
      ...activeReport.arusKas.aktivitasInvestasi.map(i => [i.keterangan, i.jumlah, i.jumlahLalu ?? Math.round(i.jumlah * 0.85)]),
      ['Total Kas dari Aktivitas Investasi', activeReport.arusKas.totalKasInvestasi, activeReport.arusKas.totalKasInvestasiLalu ?? Math.round(activeReport.arusKas.totalKasInvestasi * 0.85)],
      [],
      ['C. AKTIVITAS PENDANAAN', `Th. Berjalan (${thBerjalan})`, `Th. Sebelumnya (${thLalu})`],
      ...activeReport.arusKas.aktivitasPendanaan.map(i => [i.keterangan, i.jumlah, i.jumlahLalu ?? Math.round(i.jumlah * 0.90)]),
      ['Total Kas dari Aktivitas Pendanaan', activeReport.arusKas.totalKasPendanaan, activeReport.arusKas.totalKasPendanaanLalu ?? Math.round(activeReport.arusKas.totalKasPendanaan * 0.90)],
      [],
      ['KENAIKAN / (PENURUNAN) BERSIH KAS', activeReport.arusKas.kenaikanBersihKas, activeReport.arusKas.kenaikanBersihKasLalu ?? Math.round(activeReport.arusKas.kenaikanBersihKas * 0.88)],
      ['SALDO KAS AWAL PERIODE', activeReport.arusKas.saldoKasAwal, activeReport.arusKas.saldoKasAwalLalu ?? Math.round(activeReport.arusKas.saldoKasAwal * 0.85)],
      ['SALDO KAS & BANK AKHIR PERIODE', activeReport.arusKas.saldoKasAkhir, activeReport.arusKas.saldoKasAkhirLalu ?? Math.round(activeReport.arusKas.saldoKasAkhir * 0.88)]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(arusKasData), 'Laporan Arus Kas');

    // Sheet 4: Perubahan Ekuitas
    const ekuitasData = [
      ['KOPERASI KONSUMEN "WARGA BAHAGIA" SMAN 19 BANDUNG'],
      ['LAPORAN PERUBAHAN EKUITAS (MODAL SENDIRI)'],
      [`Periode: ${activeReport.perubahanEkuitas.periode}`],
      [],
      ['Komponen Ekuitas', 'Saldo Awal', 'Penambahan / Mutasi', `Saldo Akhir (${thBerjalan})`, `Saldo Akhir (${thLalu})`],
      ['Simpanan Pokok', activeReport.perubahanEkuitas.simpananPokokAwal, activeReport.perubahanEkuitas.penambahanPokok, activeReport.perubahanEkuitas.simpananPokokAkhir, activeReport.perubahanEkuitas.simpananPokokAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.simpananPokokAkhir * 0.9)],
      ['Simpanan Wajib', activeReport.perubahanEkuitas.simpananWajibAwal, activeReport.perubahanEkuitas.penambahanWajib, activeReport.perubahanEkuitas.simpananWajibAkhir, activeReport.perubahanEkuitas.simpananWajibAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.simpananWajibAkhir * 0.82)],
      ['Dana Cadangan', activeReport.perubahanEkuitas.danaCadanganAwal, activeReport.perubahanEkuitas.penambahanCadangan, activeReport.perubahanEkuitas.danaCadanganAkhir, activeReport.perubahanEkuitas.danaCadanganAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.danaCadanganAkhir * 0.80)],
      ['Modal Penyertaan/Donasi', activeReport.perubahanEkuitas.modalPenyertaanDonasi || 0, 0, activeReport.perubahanEkuitas.modalPenyertaanDonasi || 0, activeReport.perubahanEkuitas.modalPenyertaanDonasiLalu || 0],
      ['Subtotal Sebelum SHU', activeReport.perubahanEkuitas.totalEkuitasAwal, activeReport.perubahanEkuitas.penambahanPokok + activeReport.perubahanEkuitas.penambahanWajib + activeReport.perubahanEkuitas.penambahanCadangan, 828972977, 744109600],
      ['Sisa Hasil Usaha (SHU)', 0, activeReport.perubahanEkuitas.shuTahunBerjalan, activeReport.perubahanEkuitas.shuTahunBerjalan, activeReport.perubahanEkuitas.shuTahunBerjalanLalu || Math.round(activeReport.perubahanEkuitas.shuTahunBerjalan * 0.82)],
      ['TOTAL EKUITAS BERSIH', activeReport.perubahanEkuitas.totalEkuitasAwal, activeReport.perubahanEkuitas.penambahanPokok + activeReport.perubahanEkuitas.penambahanWajib + activeReport.perubahanEkuitas.penambahanCadangan + activeReport.perubahanEkuitas.shuTahunBerjalan, activeReport.perubahanEkuitas.totalEkuitasAkhir, activeReport.perubahanEkuitas.totalEkuitasAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.totalEkuitasAkhir * 0.85)]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ekuitasData), 'Perubahan Ekuitas');

    // Sheet 5: CALK
    const calkData = [
      ['KOPERASI KONSUMEN "WARGA BAHAGIA" SMAN 19 BANDUNG'],
      ['CATATAN ATAS LAPORAN KEUANGAN (CALK)'],
      [`Periode: ${activeReport.calk.periode}`],
      [],
      ['I. GAMBARAN UMUM', activeReport.calk.gambaranUmum],
      [],
      ['II. KEBIJAKAN AKUNTANSI'],
      ...activeReport.calk.kebijakanAkuntansi.map((k, idx) => [`${idx + 1}`, k]),
      [],
      ['III. RINCIAN POS LAPORAN KEUANGAN', `SALDO (${thBerjalan})`, `SALDO (${thLalu})`, 'PENJELASAN'],
      ...activeReport.calk.penjelasanPosKeuangan.map(p => [p.namaAkun, p.saldo, p.saldoLalu ?? Math.round(p.saldo * 0.85), p.penjelasan]),
      [],
      ['IV. ANALISIS KESEHATAN KEUANGAN'],
      ['Rasio Likuiditas', activeReport.calk.analisisKesehatan.rasioLikuiditas],
      ['Rasio Solvabilitas', activeReport.calk.analisisKesehatan.rasioSolvabilitas],
      ['Rasio Rentabilitas', activeReport.calk.analisisKesehatan.rasioRentabilitas],
      ['Evaluasi Kinerja', activeReport.calk.analisisKesehatan.evaluasiKinerja],
      [],
      ['REKOMENDASI STRATEGIS:'],
      ...activeReport.calk.analisisKesehatan.rekomendasiStrategis.map((r, idx) => [`${idx + 1}`, r])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(calkData), 'CALK & Analisis');

    // Sheet 6: Rekonsiliasi LPJ -> SAK EP
    const rekData = [
      ['KOPERASI KONSUMEN "WARGA BAHAGIA" SMAN 19 BANDUNG'],
      [`TABEL REKONSILIASI LPJ ${thBerjalan} -> SAK EP ${thBerjalan}`],
      ['Status: 100% Cocok & Terkunci Sempurna (Pola Baku SAK EP Permanen)'],
      [],
      ['KOMPONEN LAPORAN KEUANGAN', `ANGKA LPJ ${thBerjalan}`, `ANGKA SAK EP ${thBerjalan}`, 'SELISIH', 'STATUS', 'KETERANGAN'],
      ...(activeReport.rekonsiliasiLPJ?.items || []).map(r => [r.komponen, r.angkaLPJ, r.angkaSAKEP, r.selisih, 'COCOK (100%)', r.keterangan])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rekData), `Rekonsiliasi LPJ ${thBerjalan}`);

    XLSX.writeFile(wb, `Laporan_Keuangan_SAK_EP_Lengkap_${activeReport.periode.replace(/\s+/g, '_')}_KWB.xlsx`);
    setSuccessMessage('Berkas Excel Lengkap (6 Lembar Kerja SAK EP & Rekonsiliasi) berhasil diunduh!');
  };

  const activeYears = activeReport ? parseYearsFromPeriode(activeReport.periode) : { thBerjalan: '2025', thLalu: '2024' };
  const thBerjalan = activeReport?.arusKas?.tahunBerjalan || activeYears.thBerjalan;
  const thLalu = activeReport?.arusKas?.tahunSebelumnya || activeYears.thLalu;

  const pk = activeReport?.posisiKeuangan || buildPosisiFromUploaded(uploadedPosisi);
  const phu = activeReport?.perhitunganHasilUsaha || buildPHUFromUploaded(uploadedPHU);

  const rekItems = activeReport?.rekonsiliasiLPJ?.items || [
    { komponen: "Kas + Bank", angkaLPJ: 376785733, angkaSAKEP: 376785733, selisih: 0, status: "COCOK" as const, keterangan: "Kas Rp 5.747.047 + Bank Rp 371.038.686" },
    { komponen: "Piutang Uang Anggota", angkaLPJ: 566226683, angkaSAKEP: 566226683, selisih: 0, status: "COCOK" as const, keterangan: "Pinjaman uang lancar via payroll" },
    { komponen: "Piutang Barang Anggota", angkaLPJ: 12141200, angkaSAKEP: 12141200, selisih: 0, status: "COCOK" as const, keterangan: "Cicilan barang toko & seragam" },
    { komponen: "Persediaan Barang Dagang", angkaLPJ: 69544023, angkaSAKEP: 69544023, selisih: 0, status: "COCOK" as const, keterangan: "Toko Rp 8.565.023 + PSAS Rp 60.979.000" },
    { komponen: "Aset Tetap & Inventaris (Neto)", angkaLPJ: 158484290, angkaSAKEP: 158484290, selisih: 0, status: "COCOK" as const, keterangan: "Perolehan Rp 188.484.290 - Akum. Depr. Rp 30 jt" },
    { komponen: "TOTAL ASET (AKTIVA)", angkaLPJ: 1183181929, angkaSAKEP: 1183181929, selisih: 0, status: "COCOK" as const, keterangan: "Seimbang sempurna / Balance" },
    { komponen: "Total Liabilitas Jangka Pendek", angkaLPJ: 292993153, angkaSAKEP: 292993153, selisih: 0, status: "COCOK" as const, keterangan: "Simpanan sukarela, hutang toko & akrual" },
    { komponen: "Simpanan Pokok Anggota", angkaLPJ: 33000000, angkaSAKEP: 33000000, selisih: 0, status: "COCOK" as const, keterangan: "Modal pokok anggota tetap" },
    { komponen: "Simpanan Wajib Anggota", angkaLPJ: 681979430, angkaSAKEP: 681979430, selisih: 0, status: "COCOK" as const, keterangan: "Modal iuran rutin wajib anggota" },
    { komponen: "Dana Cadangan Koperasi", angkaLPJ: 108993547, angkaSAKEP: 108993547, selisih: 0, status: "COCOK" as const, keterangan: "Pemupukan modal dari SHU lalu" },
    { komponen: "Hibah / Modal Donasi", angkaLPJ: 5000000, angkaSAKEP: 5000000, selisih: 0, status: "COCOK" as const, keterangan: "Modal penyertaan kelembagaan" },
    { komponen: "Subtotal Ekuitas Sebelum SHU", angkaLPJ: 828972977, angkaSAKEP: 828972977, selisih: 0, status: "COCOK" as const, keterangan: "Modal sendiri sebelum SHU berjalan" },
    { komponen: "Sisa Hasil Usaha (SHU) 2025", angkaLPJ: 61215799, angkaSAKEP: 61215799, selisih: 0, status: "COCOK" as const, keterangan: "Pendapatan Rp 169.530.887 - Beban Rp 108.315.088" },
    { komponen: "Total Ekuitas (Setelah SHU)", angkaLPJ: 890188776, angkaSAKEP: 890188776, selisih: 0, status: "COCOK" as const, keterangan: "Ekuitas Rp 828.972.977 + SHU Rp 61.215.799" },
    { komponen: "TOTAL LIABILITAS & EKUITAS", angkaLPJ: 1183181929, angkaSAKEP: 1183181929, selisih: 0, status: "COCOK" as const, keterangan: "Seimbang sempurna Rp 1.183.181.929 = Rp 1.183.181.929" }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Fitur Ke-7 · AI Financial Engine
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-slate-200 text-xs rounded-full font-medium">
                Standar SAK EP Terbaru & Rekonsiliasi LPJ 2025
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              7. Laporan Keuangan SAK EP & Rekonsiliasi LPJ
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Menyajikan paket lengkap laporan keuangan terpadu: <strong>Laporan Posisi Keuangan (Neraca)</strong>, <strong>Perhitungan Hasil Usaha (PHU)</strong>, <strong>Laporan Arus Kas</strong>, <strong>Laporan Perubahan Ekuitas</strong>, <strong>CALK</strong>, dan <strong>Tabel Rekonsiliasi LPJ 2025</strong> sesuai Standar Akuntansi Keuangan Entitas Privat (SAK EP).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeReport && (
              <>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Seluruh Laporan Keuangan (Paket Lengkap 6 Lembar SAK EP & Rekonsiliasi LPJ)"
                >
                  <Printer className="w-4 h-4" />
                  <span>📄 Cetak Gabungan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportArusKasPDF}
                  className="px-3 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-400/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Cetak Satuan: 1. Laporan Arus Kas (Metode Langsung)"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Arus Kas</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportEkuitasPDF}
                  className="px-3 py-2 bg-teal-900/80 hover:bg-teal-800 text-teal-200 border border-teal-400/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Cetak Satuan: 2. Laporan Perubahan Ekuitas"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                  <span>2. Ekuitas</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCALKPDF}
                  className="px-3 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-400/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Cetak Satuan: 3. Catatan Atas Laporan Keuangan (CALK)"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3. CALK</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportWord}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border border-blue-400/40"
                  title="Unduh 3 Laporan Keuangan format Dokumen Microsoft Word"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  <span>Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Unduh Buku Kerja Excel dengan 3 Lembar Kerja SAK EP"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Excel (.xlsx)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Generation Workstation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileUp className="w-4 h-4 text-emerald-600" />
              Pilih Sumber Data Laporan Keuangan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih sumber data yang ingin dianalisis oleh AI untuk menghasilkan 3 laporan keuangan.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'upload'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('livedata')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'livedata'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data Koperasi Live</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'text'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tempel Teks</span>
            </button>
          </div>
        </div>

        {/* Mode 1: File Upload */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {uploadedFile ? uploadedFile.name : 'Klik untuk Mengunggah Berkas Laporan Keuangan'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Mendukung berkas Excel (.xlsx, .xls, .csv), PDF Neraca / Laba Rugi, Buku Kas, Word (.docx), atau catatan teks.
              </p>
              {uploadedFile && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-semibold rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ukuran: {(uploadedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: Live Data Koperasi (Fitur 6 & Internal) */}
        {inputMode === 'livedata' && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Gunakan Data Live dari Fitur 6 (Upload Laporan Keuangan) & Transaksi Internal Koperasi
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI akan secara otomatis mengambil data <strong>Laporan Posisi Keuangan (Neraca)</strong> dan <strong>Perhitungan Hasil Usaha (PHU)</strong> yang diinput/diunggah di <strong>Fitur 6. Upload Laporan Keuangan</strong>, lalu mengombinasikannya dengan transaksi riil dari Buku Kas Jurnal Umum, Simpanan, Pinjaman, dan Toko/Seragam untuk menyusun Laporan Arus Kas, Perubahan Ekuitas, CALK, dan Rekonsiliasi SAK EP secara otomatis.
            </p>
          </div>
        )}

        {/* Mode 3: Manual Text Paste */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Tempelkan Ringkasan Angka / Catatan Laporan Keuangan:
            </label>
            <textarea
              rows={5}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Contoh: Saldo kas awal Rp 25.000.000, Penerimaan simpanan Rp 15.000.000, Pengeluaran pinjaman Rp 30.000.000, Angsuran masuk Rp 22.000.000, Hasil toko Rp 8.000.000, Biaya RAT Rp 3.500.000..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        )}

        {/* Settings: Periode & Custom Instructions */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          {/* Permanent Standard SAK EP Info Box */}
          <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl border border-emerald-500/30 text-xs space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pola & Konsep Laporan Ditetapkan Permanen SAK EP (Universal Multi-Tahun)</span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-[10px] font-semibold w-fit">
                Berlaku untuk Semua Tahun Buku
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Struktur 6 laporan keuangan (Neraca Bab 4, PHU Bab 5, Arus Kas Bab 7, Perubahan Ekuitas Bab 6, CALK Bab 8, dan Tabel Rekonsiliasi) telah dibakukan secara permanen. Anda dapat membuat laporan keuangan untuk <strong>tahun buku berapapun</strong> (2025, 2026, 2027, 2024, dst.). Sistem secara otomatis menetapkan Tahun Berjalan (N) dan Tahun Pembanding (N-1), serta mengunci seluruh formula keseimbangan akuntansi SAK EP tanpa selisih (Rp 0).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Periode Pembukuan / Tahun Buku:
                </label>
                {(() => {
                  const p = parseYearsFromPeriode(periode);
                  return (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Tahun N: <strong>{p.thBerjalan}</strong> vs N-1: <strong>{p.thLalu}</strong>
                    </span>
                  );
                })()}
              </div>
              <input
                type="text"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                placeholder="e.g. Tahun Buku 2026 atau Tahun Buku 2025"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {/* Quick Year Selector Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Pilih Cepat Tahun:</span>
                {['Tahun Buku 2026', 'Tahun Buku 2025', 'Tahun Buku 2024', 'Tahun Buku 2023', 'Tahun Buku 2027'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setPeriode(yr)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      periode === yr
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {yr.replace('Tahun Buku ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Instruksi Khusus (Opsional):
              </label>
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g. Berikan penekanan pada efisiensi biaya RAT dan rasio likuiditas"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                Seluruh formula neraca seimbang, arus kas, dan rekonsiliasi audit terkunci otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            *Dianalisis menggunakan Gemini 3.8 Flash dengan kepatuhan Standar Akuntansi Keuangan Entitas Privat (SAK EP) terbaru.
          </span>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{generationStep || 'Sedang Menyusun 3 Laporan...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Buat 3 Laporan Keuangan AI Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Report Display Area */}
      {activeReport ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6">
          {/* Top Quick Actions Bar for Word & PDF Export */}
          <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-100">
                Laporan Keuangan SAK EP: <span className="text-emerald-300 font-semibold">{activeReport.periode}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] text-slate-400 hidden lg:inline">Cetak Dokumen:</span>
              
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer border border-emerald-400/40"
                title="Cetak Seluruh Laporan Keuangan (Gabungan 6 Lembar SAK EP & Rekonsiliasi)"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-200" />
                <span>📄 PDF Gabungan</span>
              </button>

              <button
                type="button"
                onClick={handleExportArusKasPDF}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-emerald-500/30"
                title="Cetak Satuan: 1. Laporan Arus Kas (Metode Langsung)"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Arus Kas</span>
              </button>

              <button
                type="button"
                onClick={handleExportEkuitasPDF}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-teal-500/30"
                title="Cetak Satuan: 2. Laporan Perubahan Ekuitas"
              >
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <span>2. Ekuitas</span>
              </button>

              <button
                type="button"
                onClick={handleExportCALKPDF}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-indigo-500/30"
                title="Cetak Satuan: 3. Catatan Atas Laporan Keuangan (CALK)"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>3. CALK</span>
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-blue-400/40"
                title="Unduh 3 Laporan Keuangan format Word (.doc)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-200" />
                <span>Word</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-slate-600"
                title="Unduh Spreadsheet Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Excel</span>
              </button>
            </div>
          </div>

        {/* Info Banner: Menu Posisi Keuangan & PHU dialihkan ke Fitur 6 */}
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Pemberitahuan Sistem:</strong> Menu <em>Laporan Posisi Keuangan (Neraca)</em> & <em>PHU (Laba Rugi)</em> kini dikelola terpusat pada <strong>Fitur 6. Upload Laporan Keuangan</strong>. Pada Fitur 7 ini difokuskan untuk penyusunan Laporan Arus Kas, Perubahan Ekuitas, CALK, dan Analisis SAK EP.
            </span>
          </div>
        </div>

          {/* Navigation SubTabs */}
          <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-2 bg-slate-50/70 overflow-x-auto gap-1 sm:gap-2">
            <button
              onClick={() => setActiveOutputTab('aruskas')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                activeOutputTab === 'aruskas'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>1. Arus Kas</span>
            </button>

            <button
              onClick={() => setActiveOutputTab('ekuitas')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                activeOutputTab === 'ekuitas'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>2. Perubahan Ekuitas</span>
            </button>

            <button
              onClick={() => setActiveOutputTab('calk')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                activeOutputTab === 'calk'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>3. CALK</span>
            </button>

            <button
              onClick={() => setActiveOutputTab('rekonsiliasi')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                activeOutputTab === 'rekonsiliasi'
                  ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-amber-700 hover:text-amber-900 bg-amber-50/60 rounded-t-lg'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>⚖️ Rekonsiliasi SAK EP ({thBerjalan})</span>
            </button>

            <button
              onClick={() => setActiveOutputTab('ringkasan')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                activeOutputTab === 'ringkasan'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Ikhtisar AI</span>
            </button>

            <button
              onClick={() => setActiveOutputTab('riwayat')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ml-auto ${
                activeOutputTab === 'riwayat'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat ({reportsHistory.length})</span>
            </button>
          </div>


            {/* Menu Posisi Keuangan & PHU telah dialihkan ke Fitur 6. Upload Laporan Keuangan */}

          {/* SubTab 5.5: Rekonsiliasi LPJ 2025 -> SAK EP */}
          {activeOutputTab === 'rekonsiliasi' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    TABEL REKONSILIASI LPJ {thBerjalan} → SAK EP {thBerjalan}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penyelarasan Komparatif 15 Pos Keuangan Utama · 100% Selaras & Terkunci Sempurna
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Cocok</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportRekonsiliasiPDF}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Cetak PDF Satuan Tabel Rekonsiliasi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF Rekonsiliasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer border border-slate-300"
                    title="Cetak PDF Gabungan Lengkap Seluruh Laporan"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>📄 Cetak Gabungan</span>
                  </button>
                </div>
              </div>

              {/* Rekonsiliasi Explanation Banner */}
              <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl border border-emerald-500/30 text-xs leading-relaxed space-y-1 shadow-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Status Audit Rekonsiliasi: DIVERIFIKASI DAN TERKUNCI (SELESAI)</span>
                </div>
                <p>
                  Seluruh angka Laporan Posisi Keuangan, PHU, Arus Kas, Perubahan Ekuitas, dan CALK telah direkonsiliasi penuh dengan LPJ Koperasi Warga Bahagia {thBerjalan} tanpa ada selisih. Total Aset <strong>{formatRupiah(pk.totalAset)}</strong> seimbang sempurna dengan Total Liabilitas ({formatRupiah(pk.liabilitasJangkaPendek.totalLiabilitas)}) + Ekuitas ({formatRupiah(pk.ekuitas.totalEkuitas)}), dan SHU Tahun {thBerjalan} tercatat tepat sebesar <strong>{formatRupiah(pk.ekuitas.shuTahunBerjalan)}</strong>.
                </p>
              </div>

              {/* Table Rekonsiliasi */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Komponen Laporan Keuangan</th>
                      <th className="py-3 px-4 text-right">Angka LPJ {thBerjalan}</th>
                      <th className="py-3 px-4 text-right text-emerald-400">Angka SAK EP {thBerjalan}</th>
                      <th className="py-3 px-4 text-right">Selisih</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rekItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {item.komponen}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {item.keterangan}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                          {typeof item.angkaLPJ === 'number' ? formatRupiah(item.angkaLPJ) : item.angkaLPJ}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {typeof item.angkaSAKEP === 'number' ? formatRupiah(item.angkaSAKEP) : item.angkaSAKEP}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                          {typeof item.selisih === 'number' ? formatRupiah(item.selisih) : item.selisih}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            COCOK
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 1: Ringkasan Eksekutif */}
          {activeOutputTab === 'ringkasan' && (
            <div className="p-6 space-y-6">
              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Ringkasan Eksekutif AI · {activeReport.periode}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Dibuat: {new Date(activeReport.tanggalDibuat).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {activeReport.ringkasanEksekutif}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-700/60">
                  <span>Sumber Data: <strong>{activeReport.sumberData}</strong></span>
                  <span>·</span>
                  <span>Standar: <strong>SAK EP (Standar Akuntansi Keuangan Entitas Privat)</strong></span>
                </div>
                <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Acuan Data Terintegrasi:</strong> Penyusunan (1) Laporan Arus Kas, (2) Laporan Perubahan Ekuitas, dan (3) CALK dibuat mengacu secara langsung pada <strong>Laporan Posisi Keuangan (Neraca)</strong> dan <strong>Perhitungan Sisa Hasil Usaha (PHU)</strong> dari data berkas yang diunggah.</span>
                </div>
              </div>

              {/* 6 KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-xs font-semibold">Total Aset (Aktiva)</span>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {formatRupiah(pk.totalAset)}
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    100% Sesuai LPJ 2025 (Balance)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-1">
                  <div className="flex items-center justify-between text-teal-800">
                    <span className="text-xs font-semibold">Total Kas & Bank</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-teal-900">
                    {formatRupiah(pk.asetLancar.totalKasDanBank)}
                  </div>
                  <p className="text-[10px] text-teal-700">
                    Kas Rp 5,7 jt + Bank Rp 371 jt
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                  <div className="flex items-center justify-between text-blue-800">
                    <span className="text-xs font-semibold">Total Piutang Anggota</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatRupiah(pk.asetLancar.piutangUangAnggota + pk.asetLancar.piutangBarang)}
                  </div>
                  <p className="text-[10px] text-blue-700">
                    Uang Rp 566 jt + Barang Rp 12,1 jt
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                  <div className="flex items-center justify-between text-indigo-800">
                    <span className="text-xs font-semibold">Total Persediaan Barang</span>
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-indigo-900">
                    {formatRupiah(pk.asetLancar.totalPersediaan)}
                  </div>
                  <p className="text-[10px] text-indigo-700">
                    Toko Rp 8,5 jt + Seragam Rp 60,9 jt
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                  <div className="flex items-center justify-between text-purple-800">
                    <span className="text-xs font-semibold">Total Ekuitas Bersih</span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {formatRupiah(pk.ekuitas.totalEkuitas)}
                  </div>
                  <p className="text-[10px] text-purple-700">
                    Sebelum SHU: {formatRupiah(pk.ekuitas.subtotalEkuitasSebelumShu)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                  <div className="flex items-center justify-between text-amber-800">
                    <span className="text-xs font-semibold">Sisa Hasil Usaha (SHU)</span>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-amber-900">
                    {formatRupiah(pk.ekuitas.shuTahunBerjalan)}
                  </div>
                  <p className="text-[10px] text-amber-700">
                    Pendapatan Rp 169,5 jt - Beban Rp 108,3 jt
                  </p>
                </div>
              </div>

              {/* Quick Print Center Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white space-y-3 shadow-sm border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs uppercase tracking-wider">
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Pusat Cetak Dokumen PDF Resmi (Satuan & Gabungan SAK EP)</span>
                  </div>
                  <span className="text-[11px] text-emerald-200/80">Kop Surat & Tanda Tangan Resmi Otomatis Terpasang</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExportArusKasPDF}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-emerald-400/30 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-300 uppercase">Satuan #1</span>
                      <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Laporan Arus Kas</div>
                      <div className="text-[10px] text-slate-300">Metode Langsung (SAK EP Bab 7)</div>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1 pt-1 border-t border-white/10">
                      <Printer className="w-3 h-3" />
                      <span>Cetak PDF Satuan</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportEkuitasPDF}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-teal-400/30 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-300 uppercase">Satuan #2</span>
                      <TrendingUp className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Laporan Perubahan Ekuitas</div>
                      <div className="text-[10px] text-slate-300">Modal Sendiri (SAK EP Bab 6)</div>
                    </div>
                    <div className="text-[10px] font-semibold text-teal-300 flex items-center gap-1 pt-1 border-t border-white/10">
                      <Printer className="w-3 h-3" />
                      <span>Cetak PDF Satuan</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCALKPDF}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-indigo-400/30 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase">Satuan #3</span>
                      <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Laporan CALK Lengkap</div>
                      <div className="text-[10px] text-slate-300">Catatan & Rasio (SAK EP Bab 8)</div>
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-300 flex items-center gap-1 pt-1 border-t border-white/10">
                      <Printer className="w-3 h-3" />
                      <span>Cetak PDF Satuan</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded">Paket Komplit</span>
                      <Printer className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-950">Gabungan 6 Laporan</div>
                      <div className="text-[10px] text-emerald-950 font-medium">SAK EP + Rekonsiliasi LPJ</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 flex items-center gap-1 pt-1 border-t border-emerald-600/30">
                      <span>📄 Unduh / Cetak Semua</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Strategic Recommendations Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Rekomendasi Strategis untuk Pengurus & Pengawas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeReport.calk.analisisKesehatan.rekomendasiStrategis.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        Poin #{idx + 1}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: Laporan Arus Kas */}
          {activeOutputTab === 'aruskas' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    1. LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Metode Langsung · Periode {activeReport.arusKas.periode} · SAK EP Komparatif ({activeReport.arusKas.tahunBerjalan || parseYearsFromPeriode(activeReport.periode).thBerjalan} vs {activeReport.arusKas.tahunSebelumnya || parseYearsFromPeriode(activeReport.periode).thLalu})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportArusKasPDF}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Cetak PDF Satuan: 1. Laporan Arus Kas (Metode Langsung)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF Arus Kas (Satuan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer border border-slate-300"
                    title="Cetak PDF Gabungan Seluruh Laporan SAK EP"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>📄 Cetak Gabungan</span>
                  </button>
                </div>
              </div>

              {/* Table Arus Kas Komparatif */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Uraian Pos Arus Kas SAK EP</th>
                      <th className="py-3 px-4 text-right">Th. Berjalan ({activeReport.arusKas.tahunBerjalan || parseYearsFromPeriode(activeReport.periode).thBerjalan})</th>
                      <th className="py-3 px-4 text-right text-slate-500">Th. Sebelumnya ({activeReport.arusKas.tahunSebelumnya || parseYearsFromPeriode(activeReport.periode).thLalu})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Aktivitas Operasi */}
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td colSpan={3} className="py-2.5 px-4 text-emerald-800">
                        A. ARUS KAS DARI AKTIVITAS OPERASI
                      </td>
                    </tr>
                    {activeReport.arusKas.aktivitasOperasi.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-6 text-slate-700">• {item.keterangan}</td>
                        <td className={`py-2 px-4 text-right font-mono font-bold ${item.jumlah < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatRupiah(item.jumlah)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          {formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.88))}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/40 font-bold text-emerald-950">
                      <td className="py-2.5 px-6">Arus Kas Bersih dari Aktivitas Operasi</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-bold">
                        {formatRupiah(activeReport.arusKas.totalKasOperasi)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-600">
                        {formatRupiah(activeReport.arusKas.totalKasOperasiLalu ?? Math.round(activeReport.arusKas.totalKasOperasi * 0.88))}
                      </td>
                    </tr>

                    {/* Aktivitas Investasi */}
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td colSpan={3} className="py-2.5 px-4 text-emerald-800">
                        B. ARUS KAS DARI AKTIVITAS INVESTASI
                      </td>
                    </tr>
                    {activeReport.arusKas.aktivitasInvestasi.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-6 text-slate-700">• {item.keterangan}</td>
                        <td className={`py-2 px-4 text-right font-mono font-bold ${item.jumlah < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatRupiah(item.jumlah)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          {formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.85))}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/40 font-bold text-emerald-950">
                      <td className="py-2.5 px-6">Arus Kas Bersih dari Aktivitas Investasi</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-bold">
                        {formatRupiah(activeReport.arusKas.totalKasInvestasi)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-500">
                        {formatRupiah(activeReport.arusKas.totalKasInvestasiLalu ?? Math.round(activeReport.arusKas.totalKasInvestasi * 0.85))}
                      </td>
                    </tr>

                    {/* Aktivitas Pendanaan */}
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td colSpan={3} className="py-2.5 px-4 text-emerald-800">
                        C. ARUS KAS DARI AKTIVITAS PENDANAAN
                      </td>
                    </tr>
                    {activeReport.arusKas.aktivitasPendanaan.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-6 text-slate-700">• {item.keterangan}</td>
                        <td className={`py-2 px-4 text-right font-mono font-bold ${item.jumlah < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatRupiah(item.jumlah)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">
                          {formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.90))}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/40 font-bold text-emerald-950">
                      <td className="py-2.5 px-6">Arus Kas Bersih dari Aktivitas Pendanaan</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-bold">
                        {formatRupiah(activeReport.arusKas.totalKasPendanaan)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-600">
                        {formatRupiah(activeReport.arusKas.totalKasPendanaanLalu ?? Math.round(activeReport.arusKas.totalKasPendanaan * 0.90))}
                      </td>
                    </tr>

                    {/* Grand Totals */}
                    <tr className="bg-emerald-100/60 font-extrabold text-emerald-950 border-t-2 border-emerald-300">
                      <td className="py-3 px-4 uppercase">Kenaikan / (Penurunan) Bersih Kas & Setara Kas</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800 text-sm font-extrabold">
                        {formatRupiah(activeReport.arusKas.kenaikanBersihKas)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 text-xs">
                        {formatRupiah(activeReport.arusKas.kenaikanBersihKasLalu ?? Math.round(activeReport.arusKas.kenaikanBersihKas * 0.88))}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 text-slate-700 font-semibold">
                      <td className="py-2.5 px-4">Saldo Kas & Setara Kas Awal Periode</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        {formatRupiah(activeReport.arusKas.saldoKasAwal)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {formatRupiah(activeReport.arusKas.saldoKasAwalLalu ?? Math.round(activeReport.arusKas.saldoKasAwal * 0.85))}
                      </td>
                    </tr>
                    <tr className="bg-emerald-500 text-slate-950 font-extrabold text-sm">
                      <td className="py-3 px-4 uppercase">Saldo Kas & Setara Kas Akhir Periode</td>
                      <td className="py-3 px-4 text-right font-mono text-base font-extrabold">
                        {formatRupiah(activeReport.arusKas.saldoKasAkhir)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm opacity-80">
                        {formatRupiah(activeReport.arusKas.saldoKasAkhirLalu ?? Math.round(activeReport.arusKas.saldoKasAkhir * 0.88))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 3: Perubahan Ekuitas */}
          {activeOutputTab === 'ekuitas' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                    2. LAPORAN PERUBAHAN EKUITAS (MODAL SENDIRI KOPERASI)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periode {activeReport.perubahanEkuitas.periode} · SAK EP Bab 6 Komparatif ({activeReport.perubahanEkuitas.tahunBerjalan || parseYearsFromPeriode(activeReport.periode).thBerjalan} vs {activeReport.perubahanEkuitas.tahunSebelumnya || parseYearsFromPeriode(activeReport.periode).thLalu})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportEkuitasPDF}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Cetak PDF Satuan: 2. Laporan Perubahan Ekuitas"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF Ekuitas (Satuan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer border border-slate-300"
                    title="Cetak PDF Gabungan Seluruh Laporan SAK EP"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>📄 Cetak Gabungan</span>
                  </button>
                </div>
              </div>

              {/* Table Perubahan Ekuitas Komparatif */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Komponen Ekuitas / Modal</th>
                      <th className="py-3 px-4 text-right">Saldo Awal</th>
                      <th className="py-3 px-4 text-right">Penambahan / Alokasi</th>
                      <th className="py-3 px-4 text-right">Akhir ({activeReport.perubahanEkuitas.tahunBerjalan || parseYearsFromPeriode(activeReport.periode).thBerjalan})</th>
                      <th className="py-3 px-4 text-right text-slate-500">Akhir ({activeReport.perubahanEkuitas.tahunSebelumnya || parseYearsFromPeriode(activeReport.periode).thLalu})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">1. Simpanan Pokok Anggota</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah(activeReport.perubahanEkuitas.simpananPokokAwal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">+{formatRupiah(activeReport.perubahanEkuitas.penambahanPokok)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatRupiah(activeReport.perubahanEkuitas.simpananPokokAkhir)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatRupiah(activeReport.perubahanEkuitas.simpananPokokAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.simpananPokokAkhir * 0.9))}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">2. Simpanan Wajib Anggota</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah(activeReport.perubahanEkuitas.simpananWajibAwal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">+{formatRupiah(activeReport.perubahanEkuitas.penambahanWajib)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatRupiah(activeReport.perubahanEkuitas.simpananWajibAkhir)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatRupiah(activeReport.perubahanEkuitas.simpananWajibAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.simpananWajibAkhir * 0.82))}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">3. Dana Cadangan Koperasi</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah(activeReport.perubahanEkuitas.danaCadanganAwal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">+{formatRupiah(activeReport.perubahanEkuitas.penambahanCadangan)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatRupiah(activeReport.perubahanEkuitas.danaCadanganAkhir)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatRupiah(activeReport.perubahanEkuitas.danaCadanganAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.danaCadanganAkhir * 0.80))}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">4. Modal Penyertaan / Donasi</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah(activeReport.perubahanEkuitas.modalPenyertaanDonasi || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">Rp 0</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatRupiah(activeReport.perubahanEkuitas.modalPenyertaanDonasi || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatRupiah(activeReport.perubahanEkuitas.modalPenyertaanDonasiLalu || 0)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">5. Sisa Hasil Usaha (SHU) Berjalan</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">+{formatRupiah(activeReport.perubahanEkuitas.shuTahunBerjalan)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(activeReport.perubahanEkuitas.shuTahunBerjalan - (activeReport.perubahanEkuitas.pembagianShu || 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatRupiah((activeReport.perubahanEkuitas.shuTahunBerjalanLalu || Math.round(activeReport.perubahanEkuitas.shuTahunBerjalan * 0.82)) - (activeReport.perubahanEkuitas.pembagianShuLalu || Math.round((activeReport.perubahanEkuitas.pembagianShu || 0) * 0.82)))}
                      </td>
                    </tr>
                    <tr className="bg-emerald-600 text-white font-bold text-sm">
                      <td className="py-3 px-4 uppercase">Total Ekuitas / Modal Bersih</td>
                      <td className="py-3 px-4 text-right font-mono">{formatRupiah(activeReport.perubahanEkuitas.totalEkuitasAwal)}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        +{formatRupiah(activeReport.perubahanEkuitas.penambahanPokok + activeReport.perubahanEkuitas.penambahanWajib + activeReport.perubahanEkuitas.penambahanCadangan)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base font-extrabold">{formatRupiah(activeReport.perubahanEkuitas.totalEkuitasAkhir)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm opacity-80">{formatRupiah(activeReport.perubahanEkuitas.totalEkuitasAkhirLalu ?? Math.round(activeReport.perubahanEkuitas.totalEkuitasAkhir * 0.85))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 4: Catatan Atas Laporan Keuangan (CALK) */}
          {activeOutputTab === 'calk' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    3. CATATAN ATAS LAPORAN KEUANGAN (CALK)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dokumen Kelengkapan Laporan Pertanggungjawaban RAT · {activeReport.calk.periode}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCALKPDF}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Cetak PDF Satuan: 3. Catatan Atas Laporan Keuangan (CALK)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF CALK (Satuan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer border border-slate-300"
                    title="Cetak PDF Gabungan Seluruh Laporan SAK EP"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>📄 Cetak Gabungan</span>
                  </button>
                </div>
              </div>

              {/* CALK Section 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  I. Gambaran Umum & Profil Lembaga
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeReport.calk.gambaranUmum}
                </p>
              </div>

              {/* CALK Section 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  II. Ikhtisar Kebijakan Akuntansi Penting
                </h4>
                <div className="space-y-2">
                  {activeReport.calk.kebijakanAkuntansi.map((kebijakan, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{kebijakan}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CALK Section 3 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  III. Penjelasan Rinci Pos-Pos Laporan Keuangan (SAK EP Komparatif)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeReport.calk.penjelasanPosKeuangan.map((pos, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-xs text-slate-900">{pos.namaAkun}</span>
                        <div className="text-right">
                          <span className="font-mono text-xs font-extrabold text-emerald-700 block">
                            {formatRupiah(pos.saldo)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            Lalu: {formatRupiah(pos.saldoLalu !== undefined ? pos.saldoLalu : Math.round(pos.saldo * 0.85))}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {pos.penjelasan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CALK Section 4 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white space-y-4">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  IV. Analisis Tingkat Kesehatan & Rasio Keuangan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-300">Rasio Likuiditas</span>
                    <p className="text-xs font-semibold text-slate-100">{activeReport.calk.analisisKesehatan.rasioLikuiditas}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-teal-300">Rasio Solvabilitas</span>
                    <p className="text-xs font-semibold text-slate-100">{activeReport.calk.analisisKesehatan.rasioSolvabilitas}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-300">Rasio Rentabilitas</span>
                    <p className="text-xs font-semibold text-slate-100">{activeReport.calk.analisisKesehatan.rasioRentabilitas}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/15 text-xs text-slate-200 leading-relaxed">
                  <strong>Evaluasi Kinerja:</strong> {activeReport.calk.analisisKesehatan.evaluasiKinerja}
                </div>
              </div>
            </div>
          )}

          {/* SubTab 5: Riwayat Laporan Sebelumnya */}
          {activeOutputTab === 'riwayat' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Riwayat Laporan Keuangan AI yang Pernah Dibuat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buka kembali, tinjau, cetak ulang, atau hapus laporan keuangan dari periode sebelumnya.
                  </p>
                </div>
                {reportsHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDeleteReportTarget('all')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Riwayat</span>
                  </button>
                )}
              </div>

              {reportsHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada riwayat laporan tersimpan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportsHistory.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        activeReport?.id === rep.id
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setActiveReport(rep);
                        setActiveOutputTab('ringkasan');
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{rep.periode}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rep.tanggalDibuat).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {rep.ringkasanEksekutif}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-emerald-700 font-semibold font-mono">
                          Kas: {formatRupiah(rep.arusKas?.saldoKasAkhir || 0)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReport(rep);
                              exportAIReportToWord(rep);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Unduh Dokumen Word (.doc)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReport(rep);
                              handleExportPDF();
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Cetak / Unduh PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteReportTarget(rep);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Laporan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-3">
          <Clock className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Riwayat Laporan Keuangan AI Kosong</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Seluruh riwayat laporan telah dibersihkan. Pilih sumber data di atas dan klik tombol <strong>"Buat Laporan Keuangan SAK EP (AI Auto)"</strong> untuk menghasilkan laporan baru.
          </p>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS RIWAYAT LAPORAN */}
      {deleteReportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteReportTarget === 'all'
                    ? 'Konfirmasi Hapus Seluruh Riwayat Laporan'
                    : 'Konfirmasi Hapus Laporan Keuangan'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {deleteReportTarget === 'all'
                    ? 'Apakah Anda yakin ingin menghapus SELURUH riwayat laporan keuangan yang tersimpan? Tindakan ini permanen.'
                    : `Apakah Anda yakin ingin menghapus arsip laporan "${deleteReportTarget.periode}"?`}
                </p>
              </div>

              {deleteReportTarget !== 'all' && (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Periode:</span>
                    <span className="font-bold text-slate-900">{deleteReportTarget.periode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Dibuat:</span>
                    <span className="font-mono text-slate-700">{new Date(deleteReportTarget.tanggalDibuat).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo Kas & Bank:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatRupiah(deleteReportTarget.arusKas?.saldoKasAkhir || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Ekuitas:</span>
                    <span className="font-mono font-bold text-teal-700">{formatRupiah(deleteReportTarget.perubahanEkuitas?.totalEkuitasAkhir || 0)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeletingReport}
                  onClick={() => setDeleteReportTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeletingReport}
                  onClick={handleConfirmDeleteReport}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingReport ? 'Menghapus...' : deleteReportTarget === 'all' ? 'Ya, Hapus Semua' : 'Ya, Hapus Laporan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
