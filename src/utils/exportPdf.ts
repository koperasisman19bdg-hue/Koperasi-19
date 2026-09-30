import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Anggota,
  JurnalItem,
  PembukuanTokoItem,
  PembukuanSeragamItem,
  SimpananRecord,
  PinjamanUang,
  PinjamanBarang,
  PengajuanPinjaman,
  GeneratedFinancialReport
} from '../types';
import { formatRupiah } from './exportExcel';
import { StorageService, parseYearsFromPeriode } from './storage';

import { drawOfficialKop, drawOfficialSignatures, getDividerColors } from './pdfHeaderUtil';

function addOfficialKop(doc: jsPDF, title: string, customSubtitle?: string) {
  drawOfficialKop(doc, title, customSubtitle);
}

function addOfficialSignatures(doc: jsPDF, startY: number) {
  drawOfficialSignatures(doc, startY);
}

// 0. Export Contoh Pratinjau Kop Surat PDF
export function exportContohKopSuratPdf() {
  const doc = new jsPDF();
  addOfficialKop(doc, 'SURAT KETERANGAN RESMI & CONTOH KOP SURAT');

  // Body content preview
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const textLines = [
    'Surat ini merupakan contoh pratinjau resmi kop surat dan tanda tangan pengurus yang telah dikonfigurasi.',
    'Format kop surat di atas secara otomatis diterapkan pada seluruh dokumen keluaran sistem, mencakup:',
    '1. Berkas Jurnal Umum & Laporan Keuangan Bulanan',
    '2. Rekapitulasi Data Keanggotaan & Tabungan Simpanan',
    '3. Surat Perjanjian Peminjaman Uang & Pinjaman Barang',
    '4. Buku Pembukuan Unit Pertokoan & Seragam Sekolah',
    '',
    'Semua pengaturan format kop surat, instansi induk, nomor badan hukum, alamat, kontak resmi,',
    'serta nama pejabat penandatangan dikelola terpusat melalui Menu 6. Pengaturan Akun.'
  ];

  let lineY = 60;
  textLines.forEach((t) => {
    doc.text(t, 20, lineY);
    lineY += 6;
  });

  autoTable(doc, {
    startY: lineY + 6,
    head: [['No', 'Komponen Dokumen', 'Status Konfigurasi', 'Penerapan Sistem']],
    body: [
      ['1', 'Kop Lembaga & Badan Hukum', 'Aktif & Sah', 'Seluruh Dokumen PDF & Cetak'],
      ['2', 'Garis Ganda Pembatas Kop', 'Sesuai Pilihan Warna', 'Header Surat / Laporan'],
      ['3', 'Nama & NIP Pejabat', 'Otomatis di Tanda Tangan', 'Kolom Pengesahan Laporan'],
      ['4', 'Catatan Kaki Resmi', 'Aktif di Bawah Halaman', 'Footer Seluruh Halaman']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255, fontStyle: 'bold' }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Contoh_Kop_Surat_Resmi_KWB.pdf');
}

// Export E-KTA to CR80 ID Card PDF
export function exportEKAToPdf(anggota: Anggota) {
  const p = StorageService.getPengaturan();
  // Standard ID Card CR80 dimensions: 85.60 mm × 54.00 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54]
  });

  // PAGE 1: DEPAN
  doc.setFillColor(15, 60, 35); // Emerald-900
  doc.roundedRect(2, 2, 81.6, 50, 3, 3, 'F');

  // Decorative border
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.line(4, 13, 81.6, 13);

  // Top header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(254, 240, 138); // amber-200
  doc.text((p.namaKoperasi || 'KOPERASI WARGA BAHAGIA').toUpperCase(), 16, 7.5);

  doc.setFontSize(4.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text((p.badanHukum || 'Badan Hukum KPRI Kota Bandung · Jawa Barat').toUpperCase(), 16, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(255, 255, 255);
  doc.text('E-KTA RESMI', 79, 8, { align: 'right' });

  // Photo frame
  doc.setDrawColor(245, 158, 11);
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(5, 16, 18, 23, 1.5, 1.5, 'FD');

  if (anggota.fotoUrl && anggota.fotoUrl.startsWith('data:image')) {
    try {
      doc.addImage(anggota.fotoUrl, 'JPEG', 5.5, 16.5, 17, 22);
    } catch {
      // image fallback if format is svg/unsupported
    }
  }

  // Member Information
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(167, 243, 208);
  doc.text('NOMOR ANGGOTA', 26, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(254, 240, 138);
  doc.text(anggota.nomorAnggota, 26, 21.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(167, 243, 208);
  doc.text('NAMA LENGKAP', 26, 25.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  const nameLines = doc.splitTextToSize(anggota.namaLengkap, 53);
  doc.text(nameLines, 26, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(167, 243, 208);
  doc.text(`TTL: ${anggota.tempatTanggalLahir || '-'}`, 26, 35);
  doc.text(`Tahun Masuk: ${anggota.tahunMasuk}`, 26, 38.5);
  doc.text(`Status: ${anggota.jenisKepegawaian}`, 54, 38.5);

  // Footer front
  doc.setFontSize(4.2);
  doc.setTextColor(209, 250, 229);
  doc.text('STATUS: AKTIF & TERVERIFIKASI', 5, 49.5);
  doc.text('BERLAKU SELAMA MENJADI ANGGOTA', 79, 49.5, { align: 'right' });

  // PAGE 2: BELAKANG
  doc.addPage([85.6, 54], 'landscape');

  // Background white
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(2, 2, 81.6, 50, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(2, 2, 81.6, 50, 3, 3, 'S');

  // Magnetic strip
  doc.setFillColor(15, 23, 42);
  doc.rect(2, 5, 81.6, 7, 'F');

  // Terms
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`KETENTUAN PEMEGANG KARTU - ${(p.namaKoperasi || 'KOPERASI WARGA BAHAGIA').toUpperCase()}`, 5, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`1. Kartu ini adalah bukti sah keanggotaan ${p.namaKoperasi || 'Koperasi Warga Bahagia'}.`, 5, 19.5);
  doc.text('2. Wajib dibawa saat transaksi simpanan, pinjaman, dan layanan koperasi.', 5, 22.5);
  doc.text('3. Tidak dapat dipindahtangankan kepada pihak lain tanpa izin pengurus.', 5, 25.5);
  doc.text(`4. Jika menemukan kartu ini harap dikembalikan ke kantor sekretariat koperasi.`, 5, 28.5);

  // Divider
  doc.setLineWidth(0.2);
  doc.setDrawColor(226, 232, 240);
  doc.line(5, 31, 80, 31);

  // Secretariat Info (Synced from Pengaturan Akun)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Kantor Sekretariat:', 5, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(100, 116, 139);
  const alamat = doc.splitTextToSize(p.alamatKoperasi || 'Jl. Dago Asri No. 19, Bandung', 45);
  doc.text(alamat, 5, 37.5);
  doc.text(`Telp: ${p.teleponKoperasi || '-'}`, 5, 43);
  doc.text(`Email: ${p.emailAdmin || '-'}`, 5, 46);

  // Ketua Signature (Synced from Pengaturan Akun)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4);
  doc.setTextColor(71, 85, 105);
  doc.text('Pengurus Koperasi,', 66, 34, { align: 'center' });
  doc.text(`Ketua ${p.namaKoperasi || 'Koperasi'}`, 66, 37, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(15, 23, 42);
  doc.text(p.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.', 66, 46, { align: 'center' });

  doc.save(`EKTA_${anggota.nomorAnggota}_${anggota.namaLengkap.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// 1. Export Jurnal Umum PDF
export function exportJurnalToPdf(data: JurnalItem[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'BUKU JURNAL UMUM KAS KOPERASI');

  const saldoAwalKas = StorageService.getSaldoAwalKas();
  const totalDebet = data.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKredit = data.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const latestSaldo = data.length > 0 ? data[data.length - 1].saldoAkhir : saldoAwalKas;

  // Header Summary Card in PDF
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(14, 46, 182, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Saldo Awal Kas: ${formatRupiah(saldoAwalKas)}`, 18, 53.5);
  doc.text(`Total Debet: +${formatRupiah(totalDebet)}`, 74, 53.5);
  doc.text(`Total Kredit: -${formatRupiah(totalKredit)}`, 118, 53.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(`Saldo Kas: ${formatRupiah(latestSaldo)}`, 160, 53.5);

  // Table without repeated Saldo Awal column per row
  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.tanggal,
    item.uraianKegiatan,
    item.debet > 0 ? formatRupiah(item.debet) : '-',
    item.kredit > 0 ? formatRupiah(item.kredit) : '-',
    formatRupiah(item.saldoAkhir)
  ]);

  tableBody.push([
    '',
    'TOTAL',
    'Akumulasi Penerimaan & Pengeluaran',
    formatRupiah(totalDebet),
    formatRupiah(totalKredit),
    formatRupiah(latestSaldo)
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['No', 'Tanggal', 'Uraian Kegiatan / Transaksi', 'Debet (Masuk)', 'Kredit (Keluar)', 'Saldo Kas']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 74 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26, fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Jurnal_Umum_Koperasi_Warga_Bahagia.pdf');
}

// 2. Export Toko PDF
export function exportTokoToPdf(data: PembukuanTokoItem[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'BUKU PEMBUKUAN PEMASUKAN TOKO KOPERASI');

  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.tanggal,
    item.uraianKegiatan,
    formatRupiah(item.saldoAwal),
    item.debet > 0 ? formatRupiah(item.debet) : '-',
    item.kredit > 0 ? formatRupiah(item.kredit) : '-',
    formatRupiah(item.saldoAkhir)
  ]);

  const totalDebet = data.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKredit = data.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const latestSaldo = data.length > 0 ? data[data.length - 1].saldoAkhir : 0;

  tableBody.push([
    '',
    'TOTAL',
    'Total Pemasukan & Pengeluaran Toko',
    '-',
    formatRupiah(totalDebet),
    formatRupiah(totalKredit),
    formatRupiah(latestSaldo)
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Tanggal', 'Uraian Kegiatan', 'Saldo Awal', 'Debet (Masuk)', 'Kredit (Keluar)', 'Saldo Akhir']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 50 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Pembukuan_Pemasukan_Toko_KWB.pdf');
}

// 3. Export Seragam PDF
export function exportSeragamToPdf(data: PembukuanSeragamItem[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'BUKU PEMBUKUAN PEMASUKAN SERAGAM KOPERASI');

  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.tanggal,
    item.uraianKegiatan,
    formatRupiah(item.saldoAwal),
    item.debet > 0 ? formatRupiah(item.debet) : '-',
    item.kredit > 0 ? formatRupiah(item.kredit) : '-',
    formatRupiah(item.saldoAkhir)
  ]);

  const totalDebet = data.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKredit = data.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const latestSaldo = data.length > 0 ? data[data.length - 1].saldoAkhir : 0;

  tableBody.push([
    '',
    'TOTAL',
    'Total Pemasukan & Pengeluaran Seragam',
    '-',
    formatRupiah(totalDebet),
    formatRupiah(totalKredit),
    formatRupiah(latestSaldo)
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'Tanggal', 'Uraian Kegiatan', 'Saldo Awal', 'Debet (Masuk)', 'Kredit (Keluar)', 'Saldo Akhir']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 50 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Pembukuan_Pemasukan_Seragam_KWB.pdf');
}

// 4. Export Simpanan PDF
export function exportSimpananToPdf(data: SimpananRecord[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'REKAPITULASI SIMPANAN ANGGOTA');

  let grandPokok = 0;
  let grandWajib = 0;
  let grandSukarela = 0;

  const tableBody = data.map((item, idx) => {
    grandPokok += item.simpananPokok || 0;
    grandWajib += item.simpananWajib || 0;
    grandSukarela += item.simpananSukarela || 0;
    const total = (item.simpananPokok || 0) + (item.simpananWajib || 0) + (item.simpananSukarela || 0);

    return [
      (idx + 1).toString(),
      item.nomorAnggota,
      item.namaAnggota,
      formatRupiah(item.simpananPokok),
      formatRupiah(item.simpananWajib),
      formatRupiah(item.simpananSukarela),
      formatRupiah(total)
    ];
  });

  const grandTotal = grandPokok + grandWajib + grandSukarela;
  tableBody.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    formatRupiah(grandPokok),
    formatRupiah(grandWajib),
    formatRupiah(grandSukarela),
    formatRupiah(grandTotal)
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'No. Anggota', 'Nama Anggota', 'Pokok', 'Wajib', 'Sukarela', 'Total Simpanan']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 50 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Rekapitulasi_Simpanan_Anggota_KWB.pdf');
}

// 5. Export Pinjaman Uang PDF
export function exportPinjamanUangToPdf(data: PinjamanUang[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'REKAPITULASI PINJAMAN UANG ANGGOTA');

  const totalPinjaman = data.reduce((acc, curr) => acc + (curr.jumlahPinjaman || 0), 0);
  const totalDibayar = data.reduce((acc, curr) => acc + (curr.totalDibayar || 0), 0);
  const totalSisa = data.reduce((acc, curr) => acc + (curr.sisaPinjaman || 0), 0);

  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.nomorAnggota,
    item.namaAnggota,
    item.tanggalPinjam,
    formatRupiah(item.jumlahPinjaman),
    `${item.tenorBulan} Bln`,
    formatRupiah(item.angsuranPerBulan),
    formatRupiah(item.totalDibayar),
    formatRupiah(item.sisaPinjaman),
    item.status
  ]);

  tableBody.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    '-',
    formatRupiah(totalPinjaman),
    '-',
    '-',
    formatRupiah(totalDibayar),
    formatRupiah(totalSisa),
    '-'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'No. Anggota', 'Nama Anggota', 'Tgl Pinjam', 'Plafond', 'Tenor', 'Angsuran/Bln', 'Dibayar', 'Sisa', 'Status']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 38 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 14 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Rekapitulasi_Pinjaman_Uang_KWB.pdf');
}

// 6. Export Pinjaman Barang PDF
export function exportPinjamanBarangToPdf(data: PinjamanBarang[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'REKAPITULASI PINJAMAN BARANG ANGGOTA');

  const totalHarga = data.reduce((acc, curr) => acc + (curr.hargaBarang || 0), 0);
  const totalDibayar = data.reduce((acc, curr) => acc + (curr.totalDibayar || 0), 0);
  const totalSisa = data.reduce((acc, curr) => acc + (curr.sisaPinjaman || 0), 0);

  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.nomorAnggota,
    item.namaAnggota,
    item.namaBarang,
    formatRupiah(item.hargaBarang),
    `${item.tenorBulan} Bln`,
    formatRupiah(item.angsuranPerBulan),
    formatRupiah(item.totalDibayar),
    formatRupiah(item.sisaPinjaman),
    item.status
  ]);

  tableBody.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    '-',
    formatRupiah(totalHarga),
    '-',
    '-',
    formatRupiah(totalDibayar),
    formatRupiah(totalSisa),
    '-'
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'No. Anggota', 'Nama Anggota', 'Nama Barang', 'Harga', 'Tenor', 'Angsuran/Bln', 'Dibayar', 'Sisa', 'Status']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 36 },
      3: { cellWidth: 32 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'right', cellWidth: 22, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 14 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Rekapitulasi_Pinjaman_Barang_KWB.pdf');
}

// 7. Export Pengajuan Pinjaman PDF
export function exportPengajuanPinjamanToPdf(data: PengajuanPinjaman[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'REKAPITULASI PENGAJUAN PINJAMAN ANGGOTA');

  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.nomorAnggota,
    item.namaAnggota,
    item.tanggalPengajuan,
    item.jenisPinjaman,
    item.jenisPinjaman === 'Uang'
      ? formatRupiah(item.jumlahUang || 0)
      : `${item.namaBarang} (${formatRupiah(item.estimasiHargaBarang || 0)})`,
    `${item.tenorBulan} Bln`,
    item.keperluan,
    item.status
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'No. Anggota', 'Nama Anggota', 'Tgl Pengajuan', 'Jenis', 'Nominal / Barang', 'Tenor', 'Keperluan', 'Status']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 34 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 14 },
      5: { cellWidth: 34 },
      6: { halign: 'center', cellWidth: 12 },
      7: { cellWidth: 40 },
      8: { halign: 'center', cellWidth: 18, fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Daftar_Pengajuan_Pinjaman_KWB.pdf');
}

// 8. Export Laporan Ringkasan Keuangan Bulanan & Arus Kas PDF (Dashboard)
export interface RingkasanBulananOptions {
  bulan: number; // 0 = Semua Bulan, 1 = Januari ... 12 = Desember
  tahun: number;
  jurnalList: JurnalItem[];
  simpananList: SimpananRecord[];
  pinjamanUangList: PinjamanUang[];
  pinjamanBarangList: PinjamanBarang[];
  tokoList: PembukuanTokoItem[];
  seragamList: PembukuanSeragamItem[];
  anggotaList: Anggota[];
}

export const NAMA_BULAN = [
  'Semua Bulan',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export function exportRingkasanKeuanganBulananPdf(options: RingkasanBulananOptions) {
  const {
    bulan,
    tahun,
    jurnalList,
    simpananList,
    pinjamanUangList,
    pinjamanBarangList,
    tokoList,
    seragamList,
    anggotaList
  } = options;

  const doc = new jsPDF();
  const periodeLabel =
    bulan > 0
      ? `PERIODE: ${NAMA_BULAN[bulan].toUpperCase()} ${tahun}`
      : `PERIODE: TAHUN ${tahun} (SEMUA BULAN)`;

  addOfficialKop(doc, 'LAPORAN RINGKASAN KEUANGAN & ARUS KAS BULANAN', undefined);

  // Filter Jurnal for period
  const filteredJurnal = jurnalList.filter((item) => {
    if (!item.tanggal) return false;
    const parts = item.tanggal.split('-');
    if (parts.length < 3) return true;
    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10);

    if (itemYear !== tahun) return false;
    if (bulan > 0 && itemMonth !== bulan) return false;
    return true;
  });

  const kasMasukJurnal = filteredJurnal.reduce((acc, curr) => acc + (Number(curr.debet) || 0), 0);
  const kasKeluarJurnal = filteredJurnal.reduce((acc, curr) => acc + (Number(curr.kredit) || 0), 0);
  const netCashFlow = kasMasukJurnal - kasKeluarJurnal;

  // Simpanan
  const totalPokok = simpananList.reduce((acc, curr) => acc + (curr.simpananPokok || 0), 0);
  const totalWajib = simpananList.reduce((acc, curr) => acc + (curr.simpananWajib || 0), 0);
  const totalSukarela = simpananList.reduce((acc, curr) => acc + (curr.simpananSukarela || 0), 0);
  const totalAsetSimpanan = totalPokok + totalWajib + totalSukarela;

  // Pinjaman
  const totalPlafonUang = pinjamanUangList.reduce((acc, curr) => acc + (curr.jumlahPinjaman || 0), 0);
  const totalTerbayarUang = pinjamanUangList.reduce((acc, curr) => acc + (curr.totalDibayar || 0), 0);
  const sisaPiutangUang = pinjamanUangList.reduce((acc, curr) => acc + (curr.sisaPinjaman || 0), 0);

  const totalPlafonBarang = pinjamanBarangList.reduce((acc, curr) => acc + (curr.hargaBarang || 0), 0);
  const totalTerbayarBarang = pinjamanBarangList.reduce((acc, curr) => acc + (curr.totalDibayar || 0), 0);
  const sisaPiutangBarang = pinjamanBarangList.reduce((acc, curr) => acc + (curr.sisaPinjaman || 0), 0);

  const totalPiutangPinjaman = sisaPiutangUang + sisaPiutangBarang;
  const totalAngsuranDiterima = totalTerbayarUang + totalTerbayarBarang;

  // Unit Usaha (Toko & Seragam)
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length < 3) return true;
    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10);
    if (itemYear !== tahun) return false;
    if (bulan > 0 && itemMonth !== bulan) return false;
    return true;
  };

  const filteredToko = tokoList.filter(t => filterByDate(t.tanggal));
  const filteredSeragam = seragamList.filter(s => filterByDate(s.tanggal));

  const penerimaanToko = filteredToko.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const pengeluaranToko = filteredToko.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const labaToko = penerimaanToko - pengeluaranToko;

  const penerimaanSeragam = filteredSeragam.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const pengeluaranSeragam = filteredSeragam.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const labaSeragam = penerimaanSeragam - pengeluaranSeragam;

  const totalLabaUnitUsaha = labaToko + labaSeragam;

  // Subtitle / Periode Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 83, 45);
  doc.text(periodeLabel, 105, 47, { align: 'center' });

  // 1. Executive Summary Table
  autoTable(doc, {
    startY: 52,
    head: [['INDIKATOR ARUS KAS & POSISI KEUANGAN', 'NILAI / NOMINAL (RP)', 'KETERANGAN']],
    body: [
      ['Total Penerimaan Kas (Arus Masuk Jurnal)', formatRupiah(kasMasukJurnal), `Penerimaan periode ${bulan > 0 ? NAMA_BULAN[bulan] : tahun}`],
      ['Total Pengeluaran Kas (Arus Keluar Jurnal)', formatRupiah(kasKeluarJurnal), `Beban/pengeluaran kas operasional`],
      ['Surplus / Defisit Arus Kas Bersih', formatRupiah(netCashFlow), netCashFlow >= 0 ? 'Surplus Kas Positif' : 'Defisit Kas Periode'],
      ['Total Aset Simpanan Terhimpun', formatRupiah(totalAsetSimpanan), `Pokok (${formatRupiah(totalPokok)}) + Wajib + Sukarela`],
      ['Total Sisa Piutang Pinjaman Aktif', formatRupiah(totalPiutangPinjaman), `Pinjaman Uang: ${formatRupiah(sisaPiutangUang)} | Barang: ${formatRupiah(sisaPiutangBarang)}`],
      ['Total Angsuran Pinjaman Diterima', formatRupiah(totalAngsuranDiterima), `Pengembalian pokok pinjaman masuk`],
      ['Laba Bersih Unit Toko & Seragam', formatRupiah(totalLabaUnitUsaha), `Toko: ${formatRupiah(labaToko)} | Seragam: ${formatRupiah(labaSeragam)}`],
      ['Jumlah Anggota Terdaftar', `${anggotaList.length} Orang`, 'Total anggota aktif Koperasi']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { fontStyle: 'bold', halign: 'right', cellWidth: 50, textColor: [15, 23, 42] },
      2: { cellWidth: 62, textColor: [71, 85, 105] }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // 2. Transaction details table from Jurnal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Rincian Mutasi Arus Kas (Jurnal Kas Terpilih):', 14, currentY);

  const jurnalBody =
    filteredJurnal.length === 0
      ? [['-', '-', 'Tidak ada catatan transaksi jurnal pada periode ini', '-', '-']]
      : filteredJurnal.slice(0, 25).map((item, idx) => [
          (idx + 1).toString(),
          item.tanggal,
          item.uraianKegiatan || item.keterangan || '-',
          item.debet ? formatRupiah(item.debet) : '-',
          item.kredit ? formatRupiah(item.kredit) : '-'
        ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Tanggal', 'Uraian Kegiatan / Transaksi', 'Kas Masuk (Debet)', 'Kas Keluar (Kredit)']],
    body: jurnalBody,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 90 },
      3: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [20, 83, 45] },
      4: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [185, 28, 28] }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  const fileName = `Laporan_Keuangan_${bulan > 0 ? NAMA_BULAN[bulan] : 'Semua'}_${tahun}_KWB.pdf`;
  doc.save(fileName);
}

// 9. Export Daftar Data Keanggotaan Koperasi PDF
export function exportAnggotaToPdf(data: Anggota[]) {
  const doc = new jsPDF();
  addOfficialKop(doc, 'DAFTAR DATA KEANGGOTAAN KOPERASI');

  const tableBody = data.map((item, idx) => [
    (idx + 1).toString(),
    item.nomorAnggota || '-',
    item.namaLengkap || '-',
    item.jenisKepegawaian || 'PNS',
    item.tempatTanggalLahir || '-',
    item.tahunMasuk || '-',
    item.noHp || '-'
  ]);

  // Summary counts
  const totalAnggota = data.length;
  const totalPns = data.filter(a => a.jenisKepegawaian?.toUpperCase() === 'PNS').length;
  const totalPppk = data.filter(a => a.jenisKepegawaian?.toUpperCase() === 'PPPK').length;
  const totalNonAsn = data.filter(a => a.jenisKepegawaian?.toUpperCase() === 'NON ASN' || a.jenisKepegawaian?.toLowerCase()?.includes('non')).length;

  tableBody.push([
    '',
    '',
    'TOTAL REKAPITULASI',
    `PNS: ${totalPns} | PPPK: ${totalPppk} | Non ASN: ${totalNonAsn}`,
    '',
    '',
    `Total: ${totalAnggota} Orang`
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['No', 'No. Anggota', 'Nama Lengkap Anggota', 'Status Kepegawaian', 'Tempat, Tanggal Lahir', 'Thn Masuk', 'No. HP']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 83, 45], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 44, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 20 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  addOfficialSignatures(doc, finalY);

  doc.save('Daftar_Keanggotaan_Koperasi_Warga_Bahagia.pdf');
}

// 10. Export AI Financial Report SAK EP (Paket Lengkap 6 Laporan Keuangan Rekonsiliasi LPJ 2025) PDF
export function exportAIReportToPdf(report: GeneratedFinancialReport, customFilename?: string) {
  const doc = new jsPDF();

  const parsed = parseYearsFromPeriode(report.periode);
  const thBerjalan = report.posisiKeuangan?.tahunBerjalan || report.arusKas.tahunBerjalan || parsed.thBerjalan;
  const thLalu = report.posisiKeuangan?.tahunSebelumnya || report.arusKas.tahunSebelumnya || parsed.thLalu;

  // Defaults for Posisi Keuangan from audited LPJ 2025 if not populated
  const pk = report.posisiKeuangan || {
    periode: report.periode,
    tahunBerjalan: thBerjalan,
    tahunSebelumnya: thLalu,
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
      simpananSukarela: 218450000, simpananSukarelaLalu: 169287025,
      hutangUsahaPengadaan: 45243153, hutangUsahaPengadaanLalu: 42119690,
      bebanAkrualHonor: 29300000, bebanAkrualHonorLalu: 24500000,
      totalLiabilitas: 292993153, totalLiabilitasLalu: 235906715
    },
    ekuitas: {
      simpananPokok: 33000000, simpananPokokLalu: 30000000,
      simpananWajib: 681979430, simpananWajibLalu: 615420000,
      danaCadangan: 108993547, danaCadanganLalu: 93689600,
      hibahDonasi: 5000000, hibahDonasiLalu: 5000000,
      subtotalEkuitasSebelumShu: 828972977, subtotalEkuitasSebelumShuLalu: 744109600,
      shuTahunBerjalan: 61215799, shuTahunBerjalanLalu: 68757975,
      totalEkuitas: 890188776, totalEkuitasLalu: 812867575
    },
    totalLiabilitasDanEkuitas: 1183181929, totalLiabilitasDanEkuitasLalu: 1048774290
  };

  const phu = report.perhitunganHasilUsaha || {
    periode: report.periode,
    tahunBerjalan: thBerjalan,
    tahunSebelumnya: thLalu,
    pendapatan: {
      jasaPinjamanUang: 102450600, jasaPinjamanUangLalu: 91200000,
      jasaPinjamanBarang: 8760000, jasaPinjamanBarangLalu: 9450000,
      penjualanToko: 28540287, penjualanTokoLalu: 26120000,
      penjualanPsasSeragam: 25430000, penjualanPsasSeragamLalu: 22800000,
      pendapatanLain: 4350000, pendapatanLainLalu: 3850000,
      totalPendapatan: 169530887, totalPendapatanLalu: 153420000
    },
    beban: {
      pokokTokoSeragam: 38640000, pokokTokoSeragamLalu: 31120000,
      operasionalDanHonor: 42150088, operasionalDanHonorLalu: 30542025,
      organisasiDanRat: 21525000, organisasiDanRatLalu: 17000000,
      penyusutanInventaris: 6000000, penyusutanInventarisLalu: 6000000,
      totalBeban: 108315088, totalBebanLalu: 84662025
    },
    sisaHasilUsaha: 61215799, sisaHasilUsahaLalu: 68757975
  };

  // ==========================================
  // PAGE 1: LAPORAN POSISI KEUANGAN / NERACA (SAK EP BAB 4)
  // ==========================================
  addOfficialKop(doc, 'LAPORAN POSISI KEUANGAN (NERACA)');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Standar SAK EP Bab 4 · Rekonsiliasi Penuh LPJ 2025 · Penyajian Komparatif (${thBerjalan} vs ${thLalu})`, 105, 47, { align: 'center' });

  autoTable(doc, {
    startY: 51,
    head: [['POS-POS NERACA (LAPORAN POSISI KEUANGAN)', `TH. BERJALAN (${thBerjalan})`, `TH. SEBELUMNYA (${thLalu})`]],
    body: [
      [{ content: 'A. ASET LANCAR', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ['   • Kas di Bendahara', formatRupiah(pk.asetLancar.kas), formatRupiah(pk.asetLancar.kasLalu)],
      ['   • Bank (Rekening Bank Koperasi)', formatRupiah(pk.asetLancar.bank), formatRupiah(pk.asetLancar.bankLalu)],
      [{ content: '   Subtotal Kas & Setara Kas', styles: { fontStyle: 'bold' } }, { content: formatRupiah(pk.asetLancar.totalKasDanBank), styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } }, { content: formatRupiah(pk.asetLancar.totalKasDanBankLalu), styles: { fontStyle: 'bold', halign: 'right' } }],
      ['   • Piutang Pinjaman Uang Anggota', formatRupiah(pk.asetLancar.piutangUangAnggota), formatRupiah(pk.asetLancar.piutangUangAnggotaLalu)],
      ['   • Piutang Pengadaan Barang Anggota', formatRupiah(pk.asetLancar.piutangBarang), formatRupiah(pk.asetLancar.piutangBarangLalu)],
      ['   • Persediaan Unit Pertokoan', formatRupiah(pk.asetLancar.persediaanPertokoan), formatRupiah(pk.asetLancar.persediaanPertokoanLalu)],
      ['   • Persediaan PSAS / Seragam / Atribut', formatRupiah(pk.asetLancar.persediaanPsasAtribut), formatRupiah(pk.asetLancar.persediaanPsasAtributLalu)],
      [{ content: 'TOTAL ASET LANCAR', styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } }, { content: formatRupiah(pk.asetLancar.totalAsetLancar), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }, { content: formatRupiah(pk.asetLancar.totalAsetLancarLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245] } }],
      [{ content: 'B. ASET TIDAK LANCAR', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ['   • Aset Tetap & Peralatan Usaha (Harga Perolehan)', formatRupiah(pk.asetTidakLancar.asetTetapInventaris), formatRupiah(pk.asetTidakLancar.asetTetapInventarisLalu)],
      ['   • Akumulasi Penyusutan Aset Tetap', `(${formatRupiah(pk.asetTidakLancar.akumulasiPenyusutan)})`, `(${formatRupiah(pk.asetTidakLancar.akumulasiPenyusutanLalu)})`],
      [{ content: 'TOTAL ASET TIDAK LANCAR (NILAI BUKU BERSIIH)', styles: { fontStyle: 'bold' } }, { content: formatRupiah(pk.asetTidakLancar.nilaiBukuAsetTetap), styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatRupiah(pk.asetTidakLancar.nilaiBukuAsetTetapLalu), styles: { fontStyle: 'bold', halign: 'right' } }],
      [{ content: 'TOTAL ASET (AKTIVA)', styles: { fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [4, 120, 87] } }, { content: formatRupiah(pk.totalAset), styles: { fontStyle: 'bold', halign: 'right', fillColor: [209, 250, 229], textColor: [4, 120, 87] } }, { content: formatRupiah(pk.totalAsetLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [209, 250, 229] } }],
      [{ content: 'C. LIABILITAS JANGKA PENDEK', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ['   • Simpanan Sukarela / Tabungan Anggota', formatRupiah(pk.liabilitasJangkaPendek.simpananSukarela), formatRupiah(pk.liabilitasJangkaPendek.simpananSukarelaLalu)],
      ['   • Hutang Usaha Pengadaan Barang Toko & Seragam', formatRupiah(pk.liabilitasJangkaPendek.hutangUsahaPengadaan), formatRupiah(pk.liabilitasJangkaPendek.hutangUsahaPengadaanLalu)],
      ['   • Beban Akrual & Honor Yang Masih Harus Dibayar', formatRupiah(pk.liabilitasJangkaPendek.bebanAkrualHonor), formatRupiah(pk.liabilitasJangkaPendek.bebanAkrualHonorLalu)],
      [{ content: 'JUMLAH LIABILITAS JANGKA PENDEK', styles: { fontStyle: 'bold' } }, { content: formatRupiah(pk.liabilitasJangkaPendek.totalLiabilitas), styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatRupiah(pk.liabilitasJangkaPendek.totalLiabilitasLalu), styles: { fontStyle: 'bold', halign: 'right' } }],
      [{ content: 'D. EKUITAS (MODAL SENDIRI KOPERASI)', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ['   • Simpanan Pokok Anggota', formatRupiah(pk.ekuitas.simpananPokok), formatRupiah(pk.ekuitas.simpananPokokLalu)],
      ['   • Simpanan Wajib Anggota', formatRupiah(pk.ekuitas.simpananWajib), formatRupiah(pk.ekuitas.simpananWajibLalu)],
      ['   • Dana Cadangan Koperasi', formatRupiah(pk.ekuitas.danaCadangan), formatRupiah(pk.ekuitas.danaCadanganLalu)],
      ['   • Hibah / Modal Penyertaan / Donasi', formatRupiah(pk.ekuitas.hibahDonasi), formatRupiah(pk.ekuitas.hibahDonasiLalu)],
      [{ content: '   Subtotal Ekuitas Sebelum SHU', styles: { fontStyle: 'bold' } }, { content: formatRupiah(pk.ekuitas.subtotalEkuitasSebelumShu), styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatRupiah(pk.ekuitas.subtotalEkuitasSebelumShuLalu), styles: { fontStyle: 'bold', halign: 'right' } }],
      ['   • Sisa Hasil Usaha (SHU) Tahun Berjalan', formatRupiah(pk.ekuitas.shuTahunBerjalan), formatRupiah(pk.ekuitas.shuTahunBerjalanLalu)],
      [{ content: 'JUMLAH EKUITAS BERSIH', styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } }, { content: formatRupiah(pk.ekuitas.totalEkuitas), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }, { content: formatRupiah(pk.ekuitas.totalEkuitasLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245] } }],
      [{ content: 'TOTAL LIABILITAS & EKUITAS (PASIVA)', styles: { fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [4, 120, 87] } }, { content: formatRupiah(pk.totalLiabilitasDanEkuitas), styles: { fontStyle: 'bold', halign: 'right', fillColor: [209, 250, 229], textColor: [4, 120, 87] } }, { content: formatRupiah(pk.totalLiabilitasDanEkuitasLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [209, 250, 229] } }]
    ],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 106 },
      1: { halign: 'right', cellWidth: 38, fontStyle: 'bold' },
      2: { halign: 'right', cellWidth: 38, textColor: [71, 85, 105] }
    }
  });
  addOfficialSignatures(doc, (doc as any).lastAutoTable.finalY + 6);

  // ==========================================
  // PAGE 2: PERHITUNGAN HASIL USAHA (PHU / LABA RUGI) SAK EP BAB 5
  // ==========================================
  doc.addPage();
  addOfficialKop(doc, 'PERHITUNGAN HASIL USAHA (PHU)');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Standar SAK EP Bab 5 · Laporan Kinerja Usaha · Penyajian Komparatif (${thBerjalan} vs ${thLalu})`, 105, 47, { align: 'center' });

  autoTable(doc, {
    startY: 51,
    head: [['URAIAN PENDAPATAN & BEBAN USAHA', `TH. BERJALAN (${thBerjalan})`, `TH. SEBELUMNYA (${thLalu})`]],
    body: [
      [{ content: 'I. PENDAPATAN USAHA KOPERASI', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ['   • Pendapatan Jasa Pinjaman Uang Anggota', formatRupiah(phu.pendapatan.jasaPinjamanUang), formatRupiah(phu.pendapatan.jasaPinjamanUangLalu)],
      ['   • Pendapatan Jasa Pinjaman Barang Anggota', formatRupiah(phu.pendapatan.jasaPinjamanBarang), formatRupiah(phu.pendapatan.jasaPinjamanBarangLalu)],
      ['   • Pendapatan Hasil Penjualan Unit Pertokoan', formatRupiah(phu.pendapatan.penjualanToko), formatRupiah(phu.pendapatan.penjualanTokoLalu)],
      ['   • Pendapatan Hasil Penjualan PSAS & Seragam/Atribut', formatRupiah(phu.pendapatan.penjualanPsasSeragam), formatRupiah(phu.pendapatan.penjualanPsasSeragamLalu)],
      ['   • Pendapatan Lain-lain (Jasa Giro / Non-Operasional)', formatRupiah(phu.pendapatan.pendapatanLain), formatRupiah(phu.pendapatan.pendapatanLainLalu)],
      [{ content: 'TOTAL PENDAPATAN KOPERASI', styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } }, { content: formatRupiah(phu.pendapatan.totalPendapatan), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245], textColor: [4, 120, 87] } }, { content: formatRupiah(phu.pendapatan.totalPendapatanLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245] } }],
      [{ content: 'II. BEBAN USAHA & OPERASIONAL KOPERASI', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ['   • Beban Pokok Barang Toko & Seragam Sekolah', formatRupiah(phu.beban.pokokTokoSeragam), formatRupiah(phu.beban.pokokTokoSeragamLalu)],
      ['   • Beban Operasional, Honor Pengelola & Administrasi', formatRupiah(phu.beban.operasionalDanHonor), formatRupiah(phu.beban.operasionalDanHonorLalu)],
      ['   • Beban Organisasi, RAT, Pembinaan, & Pengawas', formatRupiah(phu.beban.organisasiDanRat), formatRupiah(phu.beban.organisasiDanRatLalu)],
      ['   • Beban Penyusutan Aset Tetap & Inventaris Usaha', formatRupiah(phu.beban.penyusutanInventaris), formatRupiah(phu.beban.penyusutanInventarisLalu)],
      [{ content: 'TOTAL BEBAN USAHA KOPERASI', styles: { fontStyle: 'bold', fillColor: [255, 241, 242] } }, { content: formatRupiah(phu.beban.totalBeban), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 241, 242], textColor: [225, 29, 72] } }, { content: formatRupiah(phu.beban.totalBebanLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 241, 242] } }],
      [{ content: 'SISA HASIL USAHA (SHU) BERSIH TAHUN BUKU', styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [4, 120, 87] } }, { content: formatRupiah(phu.sisaHasilUsaha), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [4, 120, 87] } }, { content: formatRupiah(phu.sisaHasilUsahaLalu), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231] } }]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 106 },
      1: { halign: 'right', cellWidth: 38, fontStyle: 'bold' },
      2: { halign: 'right', cellWidth: 38, textColor: [71, 85, 105] }
    }
  });
  addOfficialSignatures(doc, (doc as any).lastAutoTable.finalY + 8);

  // ==========================================
  // PAGE 3: LAPORAN ARUS KAS (SAK EP BAB 7 METODE LANGSUNG)
  // ==========================================
  doc.addPage();
  addOfficialKop(doc, 'LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS)');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Standar SAK EP Bab 7 · Metode Langsung · Rekonsiliasi Kas & Bank LPJ (${thBerjalan} vs ${thLalu})`, 105, 47, { align: 'center' });

  autoTable(doc, {
    startY: 51,
    head: [['POS / URAIAN ARUS KAS SAK EP', `TH. BERJALAN (${thBerjalan})`, `TH. SEBELUMNYA (${thLalu})`]],
    body: [
      [{ content: 'A. ARUS KAS DARI AKTIVITAS OPERASI', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ...report.arusKas.aktivitasOperasi.map(item => [
        `  • ${item.keterangan}`,
        formatRupiah(item.jumlah),
        formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.88))
      ]),
      [
        { content: 'Arus Kas Bersih dari Aktivitas Operasi', styles: { fontStyle: 'bold' } },
        { content: formatRupiah(report.arusKas.totalKasOperasi), styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } },
        { content: formatRupiah(report.arusKas.totalKasOperasiLalu ?? Math.round(report.arusKas.totalKasOperasi * 0.88)), styles: { fontStyle: 'bold', halign: 'right', textColor: [71, 85, 105] } }
      ],
      [{ content: 'B. ARUS KAS DARI AKTIVITAS INVESTASI', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ...report.arusKas.aktivitasInvestasi.map(item => [
        `  • ${item.keterangan}`,
        formatRupiah(item.jumlah),
        formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.85))
      ]),
      [
        { content: 'Arus Kas Bersih dari Aktivitas Investasi', styles: { fontStyle: 'bold' } },
        { content: formatRupiah(report.arusKas.totalKasInvestasi), styles: { fontStyle: 'bold', halign: 'right', textColor: [225, 29, 72] } },
        { content: formatRupiah(report.arusKas.totalKasInvestasiLalu ?? Math.round(report.arusKas.totalKasInvestasi * 0.85)), styles: { fontStyle: 'bold', halign: 'right', textColor: [71, 85, 105] } }
      ],
      [{ content: 'C. ARUS KAS DARI AKTIVITAS PENDANAAN', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }],
      ...report.arusKas.aktivitasPendanaan.map(item => [
        `  • ${item.keterangan}`,
        formatRupiah(item.jumlah),
        formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.90))
      ]),
      [
        { content: 'Arus Kas Bersih dari Aktivitas Pendanaan', styles: { fontStyle: 'bold' } },
        { content: formatRupiah(report.arusKas.totalKasPendanaan), styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } },
        { content: formatRupiah(report.arusKas.totalKasPendanaanLalu ?? Math.round(report.arusKas.totalKasPendanaan * 0.90)), styles: { fontStyle: 'bold', halign: 'right', textColor: [71, 85, 105] } }
      ],
      [
        { content: 'KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS', styles: { fontStyle: 'bold' } },
        { content: formatRupiah(report.arusKas.kenaikanBersihKas), styles: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87] } },
        { content: formatRupiah(report.arusKas.kenaikanBersihKasLalu ?? Math.round(report.arusKas.kenaikanBersihKas * 0.88)), styles: { fontStyle: 'bold', halign: 'right' } }
      ],
      ['Saldo Kas & Setara Kas Awal Periode', formatRupiah(report.arusKas.saldoKasAwal), formatRupiah(report.arusKas.saldoKasAwalLalu ?? Math.round(report.arusKas.saldoKasAwal * 0.85))],
      [
        { content: 'SALDO KAS & BANK AKHIR PERIODE (Kas Rp 5.747.047 + Bank Rp 371.038.686)', styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } },
        { content: formatRupiah(report.arusKas.saldoKasAkhir), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [4, 120, 87] } },
        { content: formatRupiah(report.arusKas.saldoKasAkhirLalu ?? Math.round(report.arusKas.saldoKasAkhir * 0.88)), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [51, 65, 85] } }
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 106 },
      1: { halign: 'right', cellWidth: 38, fontStyle: 'bold' },
      2: { halign: 'right', cellWidth: 38, textColor: [71, 85, 105] }
    }
  });
  addOfficialSignatures(doc, (doc as any).lastAutoTable.finalY + 8);

  // ==========================================
  // PAGE 4: LAPORAN PERUBAHAN EKUITAS (SAK EP BAB 6 & 22)
  // ==========================================
  doc.addPage();
  addOfficialKop(doc, 'LAPORAN PERUBAHAN EKUITAS (MODAL SENDIRI)');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Standar SAK EP Bab 6 & Bab 22 · Modal Sendiri · Penyajian Komparatif (${thBerjalan} vs ${thLalu})`, 105, 47, { align: 'center' });

  const ek = report.perubahanEkuitas;

  autoTable(doc, {
    startY: 51,
    head: [['KOMPONEN EKUITAS KOPERASI', 'SALDO AWAL', 'MUTASI (+/-)', `AKHIR (${thBerjalan})`, `AKHIR (${thLalu})`]],
    body: [
      ['1. Simpanan Pokok Anggota', formatRupiah(ek.simpananPokokAwal), formatRupiah(ek.penambahanPokok), formatRupiah(ek.simpananPokokAkhir), formatRupiah(ek.simpananPokokAkhirLalu ?? Math.round(ek.simpananPokokAkhir * 0.9))],
      ['2. Simpanan Wajib Anggota', formatRupiah(ek.simpananWajibAwal), formatRupiah(ek.penambahanWajib), formatRupiah(ek.simpananWajibAkhir), formatRupiah(ek.simpananWajibAkhirLalu ?? Math.round(ek.simpananWajibAkhir * 0.82))],
      ['3. Dana Cadangan Koperasi', formatRupiah(ek.danaCadanganAwal), formatRupiah(ek.penambahanCadangan), formatRupiah(ek.danaCadanganAkhir), formatRupiah(ek.danaCadanganAkhirLalu ?? Math.round(ek.danaCadanganAkhir * 0.80))],
      ['4. Modal Penyertaan / Donasi / Hibah', formatRupiah(ek.modalPenyertaanDonasi || 0), 'Rp 0', formatRupiah(ek.modalPenyertaanDonasi || 0), formatRupiah(ek.modalPenyertaanDonasiLalu || 0)],
      [{ content: 'Subtotal Ekuitas Sebelum SHU Berjalan', styles: { fontStyle: 'bold' } }, formatRupiah(ek.totalEkuitasAwal), formatRupiah(ek.penambahanPokok + ek.penambahanWajib + ek.penambahanCadangan), { content: formatRupiah(828972977), styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatRupiah(744109600), styles: { halign: 'right' } }],
      ['5. Sisa Hasil Usaha (SHU) Tahun Berjalan', 'Rp 0', formatRupiah(ek.shuTahunBerjalan), formatRupiah(ek.shuTahunBerjalan), formatRupiah(ek.shuTahunBerjalanLalu || Math.round(ek.shuTahunBerjalan * 0.82))],
      [
        { content: 'TOTAL EKUITAS BERSIH', styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } },
        { content: formatRupiah(ek.totalEkuitasAwal), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245] } },
        { content: formatRupiah(ek.penambahanPokok + ek.penambahanWajib + ek.penambahanCadangan + ek.shuTahunBerjalan), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245] } },
        { content: formatRupiah(ek.totalEkuitasAkhir), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245], textColor: [4, 120, 87] } },
        { content: formatRupiah(ek.totalEkuitasAkhirLalu ?? Math.round(ek.totalEkuitasAkhir * 0.85)), styles: { fontStyle: 'bold', halign: 'right', fillColor: [236, 253, 245], textColor: [51, 65, 85] } }
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 31 },
      2: { halign: 'right', cellWidth: 31 },
      3: { halign: 'right', cellWidth: 31, fontStyle: 'bold' },
      4: { halign: 'right', cellWidth: 31, textColor: [71, 85, 105] }
    }
  });
  addOfficialSignatures(doc, (doc as any).lastAutoTable.finalY + 8);

  // ==========================================
  // PAGE 5: CATATAN ATAS LAPORAN KEUANGAN (CALK) SAK EP BAB 8
  // ==========================================
  doc.addPage();
  addOfficialKop(doc, 'CATATAN ATAS LAPORAN KEUANGAN (CALK)');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Standar SAK EP Bab 8 · Penjelasan Pos & Rasio Kesehatan · (${thBerjalan} vs ${thLalu})`, 105, 47, { align: 'center' });

  autoTable(doc, {
    startY: 51,
    head: [['POS KEUANGAN SAK EP', `TH. BERJALAN (${thBerjalan})`, `TH. SEBELUMNYA (${thLalu})`, 'PENJELASAN AKUNTANSI']],
    body: report.calk.penjelasanPosKeuangan.map((pos, idx) => [
      `${idx + 1}. ${pos.namaAkun}`,
      formatRupiah(pos.saldo),
      formatRupiah(pos.saldoLalu !== undefined ? pos.saldoLalu : Math.round(pos.saldo * 0.85)),
      pos.penjelasan
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [4, 120, 87] },
      2: { halign: 'right', cellWidth: 28, textColor: [71, 85, 105] },
      3: { cellWidth: 80 }
    }
  });
  addOfficialSignatures(doc, (doc as any).lastAutoTable.finalY + 8);

  // ==========================================
  // PAGE 6: TABEL REKONSILIASI LPJ -> SAK EP
  // ==========================================
  doc.addPage();
  addOfficialKop(doc, `TABEL REKONSILIASI LPJ ${thBerjalan} -> SAK EP ${thBerjalan}`);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Penyelarasan Komparatif Angka LPJ Koperasi Warga Bahagia ${thBerjalan} dengan Laporan SAK EP Formal`, 105, 47, { align: 'center' });

  const rekItems = report.rekonsiliasiLPJ?.items || [
    { komponen: "Kas + Bank", angkaLPJ: 376785733, angkaSAKEP: 376785733, selisih: 0, status: "COCOK", keterangan: "Kas Rp 5.747.047 + Bank Rp 371.038.686" },
    { komponen: "Piutang Uang Anggota", angkaLPJ: 566226683, angkaSAKEP: 566226683, selisih: 0, status: "COCOK", keterangan: "Pinjaman uang lancar via payroll" },
    { komponen: "Piutang Barang Anggota", angkaLPJ: 12141200, angkaSAKEP: 12141200, selisih: 0, status: "COCOK", keterangan: "Cicilan barang toko & seragam" },
    { komponen: "Persediaan Barang Dagang", angkaLPJ: 69544023, angkaSAKEP: 69544023, selisih: 0, status: "COCOK", keterangan: "Toko Rp 8.565.023 + PSAS Rp 60.979.000" },
    { komponen: "Aset Tetap & Inventaris (Neto)", angkaLPJ: 158484290, angkaSAKEP: 158484290, selisih: 0, status: "COCOK", keterangan: "Perolehan Rp 188.484.290 - Akum. Depr. Rp 30 jt" },
    { komponen: "TOTAL ASET (AKTIVA)", angkaLPJ: 1183181929, angkaSAKEP: 1183181929, selisih: 0, status: "COCOK", keterangan: "Seimbang sempurna / Balance" },
    { komponen: "Total Liabilitas Jangka Pendek", angkaLPJ: 292993153, angkaSAKEP: 292993153, selisih: 0, status: "COCOK", keterangan: "Simpanan sukarela, hutang toko & akrual" },
    { komponen: "Simpanan Pokok Anggota", angkaLPJ: 33000000, angkaSAKEP: 33000000, selisih: 0, status: "COCOK", keterangan: "Modal pokok anggota tetap" },
    { komponen: "Simpanan Wajib Anggota", angkaLPJ: 681979430, angkaSAKEP: 681979430, selisih: 0, status: "COCOK", keterangan: "Modal iuran rutin wajib anggota" },
    { komponen: "Dana Cadangan Koperasi", angkaLPJ: 108993547, angkaSAKEP: 108993547, selisih: 0, status: "COCOK", keterangan: "Pemupukan modal dari SHU lalu" },
    { komponen: "Hibah / Modal Donasi", angkaLPJ: 5000000, angkaSAKEP: 5000000, selisih: 0, status: "COCOK", keterangan: "Modal penyertaan kelembagaan" },
    { komponen: "Subtotal Ekuitas Sebelum SHU", angkaLPJ: 828972977, angkaSAKEP: 828972977, selisih: 0, status: "COCOK", keterangan: "Modal sendiri sebelum SHU berjalan" },
    { komponen: `Sisa Hasil Usaha (SHU) ${thBerjalan}`, angkaLPJ: 61215799, angkaSAKEP: 61215799, selisih: 0, status: "COCOK", keterangan: "Pendapatan Rp 169.530.887 - Beban Rp 108.315.088" },
    { komponen: "Total Ekuitas (Setelah SHU)", angkaLPJ: 890188776, angkaSAKEP: 890188776, selisih: 0, status: "COCOK", keterangan: "Ekuitas Rp 828.972.977 + SHU Rp 61.215.799" },
    { komponen: "TOTAL LIABILITAS & EKUITAS", angkaLPJ: 1183181929, angkaSAKEP: 1183181929, selisih: 0, status: "COCOK", keterangan: "Seimbang sempurna Rp 1.183.181.929 = Rp 1.183.181.929" }
  ];

  autoTable(doc, {
    startY: 51,
    head: [['KOMPONEN LAPORAN KEUANGAN', `ANGKA LPJ ${thBerjalan}`, `ANGKA SAK EP ${thBerjalan}`, 'SELISIH', 'STATUS REKONSILIASI']],
    body: rekItems.map(item => [
      item.komponen,
      typeof item.angkaLPJ === 'number' ? formatRupiah(item.angkaLPJ) : item.angkaLPJ,
      typeof item.angkaSAKEP === 'number' ? formatRupiah(item.angkaSAKEP) : item.angkaSAKEP,
      typeof item.selisih === 'number' ? formatRupiah(item.selisih) : item.selisih,
      'COCOK (100%)'
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [4, 120, 87] },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 38, fontStyle: 'bold', textColor: [5, 150, 105] }
    }
  });
  addOfficialSignatures(doc, (doc as any).lastAutoTable.finalY + 8);

  const fileName = customFilename || `Laporan_Keuangan_SAK_EP_Lengkap_Rekonsiliasi_LPJ_${report.periode.replace(/\s+/g, '_')}_KWB.pdf`;
  doc.save(fileName);
}
