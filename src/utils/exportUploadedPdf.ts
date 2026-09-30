import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UploadedPosisiKeuanganData, UploadedPHUData, AkunBarisLaporan } from '../types';
import { StorageService } from './storage';

function formatRupiah(num: number): string {
  if (num === 0) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

import { drawOfficialKop, drawOfficialSignatures, getDividerColors } from './pdfHeaderUtil';

function addOfficialKop(doc: jsPDF, title: string, customSubtitle?: string): number {
  return drawOfficialKop(doc, title, customSubtitle);
}

function addSignatures(doc: jsPDF, finalY: number) {
  const p = StorageService.getPengaturan();
  let currentY = finalY + 10;
  if (currentY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    currentY = 25;
  }

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text(`Bandung, ${today}`, 155, currentY, { align: 'center' });
  currentY += 4.5;
  doc.text('Pengurus Koperasi,', 105, currentY, { align: 'center' });
  currentY += 5;

  const col1X = 40;
  const col2X = 105;
  const col3X = 170;

  doc.setFont('helvetica', 'bold');
  doc.text('Ketua,', col2X, currentY, { align: 'center' });
  doc.text('Sekretaris,', col1X, currentY, { align: 'center' });
  doc.text('Bendahara,', col3X, currentY, { align: 'center' });

  currentY += 18; // space for physical signature

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(p.namaKetua || '( .................................... )', col2X, currentY, { align: 'center' });
  doc.text(p.namaSekretaris || '( .................................... )', col1X, currentY, { align: 'center' });
  doc.text(p.namaBendahara || '( .................................... )', col3X, currentY, { align: 'center' });

  currentY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIP: ${p.nipKetua || '..........................'}`, col2X, currentY, { align: 'center' });
  doc.text(`NIP: ${p.nipSekretaris || '..........................'}`, col1X, currentY, { align: 'center' });
  doc.text(`NIP: ${p.nipBendahara || '..........................'}`, col3X, currentY, { align: 'center' });
}

/**
 * EXPORT LAPORAN POSISI KEUANGAN (NERACA) KE PDF
 */
export function exportUploadedPosisiKeuanganPdf(data: UploadedPosisiKeuanganData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const thB = data.tahunBerjalan || '2025';
  const thL = data.tahunLalu || '2024';

  let startY = addOfficialKop(
    doc,
    'LAPORAN POSISI KEUANGAN (NERACA)',
    `KOMPARATIF TAHUN BUKU ${thB} & ${thL}`
  );

  const sum = (arr: AkunBarisLaporan[], field: 'nilaiBerjalan' | 'nilaiLalu') =>
    arr.reduce((acc, c) => acc + (Number(c[field]) || 0), 0);

  const jmlLancarB = sum(data.asetLancar, 'nilaiBerjalan');
  const jmlLancarL = sum(data.asetLancar, 'nilaiLalu');
  const jmlPenyertaanB = sum(data.penyertaan, 'nilaiBerjalan');
  const jmlPenyertaanL = sum(data.penyertaan, 'nilaiLalu');
  const jmlTetapB = sum(data.asetTetap, 'nilaiBerjalan');
  const jmlTetapL = sum(data.asetTetap, 'nilaiLalu');

  const totalAsetB = jmlLancarB + jmlPenyertaanB + jmlTetapB;
  const totalAsetL = jmlLancarL + jmlPenyertaanL + jmlTetapL;

  const jmlLiabilitasB = sum(data.liabilitas, 'nilaiBerjalan');
  const jmlLiabilitasL = sum(data.liabilitas, 'nilaiLalu');
  const jmlEkuitasB = sum(data.ekuitas, 'nilaiBerjalan');
  const jmlEkuitasL = sum(data.ekuitas, 'nilaiLalu');
  const shuB = Number(data.shuTahunBerjalan?.nilaiBerjalan || 0);
  const shuL = Number(data.shuTahunBerjalan?.nilaiLalu || 0);

  const totalPasivaB = jmlLiabilitasB + jmlEkuitasB + shuB;
  const totalPasivaL = jmlLiabilitasL + jmlEkuitasL + shuL;

  // Build Table Data for AKTIVA & PASIVA
  const tableRows: any[][] = [];

  // 1. AKTIVA Header
  tableRows.push([{ content: 'AKTIVA (ASET)', colSpan: 3, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
  tableRows.push([{ content: 'A. Aset Lancar', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
  data.asetLancar.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([{ content: 'Jumlah Aset Lancar', styles: { fontStyle: 'bold' } }, formatRupiah(jmlLancarB), formatRupiah(jmlLancarL)]);

  tableRows.push([{ content: 'B. Penyertaan', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
  data.penyertaan.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([{ content: 'Jumlah Penyertaan', styles: { fontStyle: 'bold' } }, formatRupiah(jmlPenyertaanB), formatRupiah(jmlPenyertaanL)]);

  tableRows.push([{ content: 'C. Aset Tetap', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
  data.asetTetap.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([{ content: 'Jumlah Aset Tetap', styles: { fontStyle: 'bold' } }, formatRupiah(jmlTetapB), formatRupiah(jmlTetapL)]);
  tableRows.push([
    { content: 'TOTAL AKTIVA (ASET)', styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } },
    { content: formatRupiah(totalAsetB), styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } },
    { content: formatRupiah(totalAsetL), styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } }
  ]);

  // 2. PASIVA Header
  tableRows.push([{ content: 'PASIVA (LIABILITAS & EKUITAS)', colSpan: 3, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
  tableRows.push([{ content: 'A. Liabilitas Jangka Pendek', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
  data.liabilitas.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([{ content: 'Jumlah Liabilitas', styles: { fontStyle: 'bold' } }, formatRupiah(jmlLiabilitasB), formatRupiah(jmlLiabilitasL)]);

  tableRows.push([{ content: 'B. Ekuitas (Modal Sendiri)', colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
  data.ekuitas.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([{ content: 'Jumlah Ekuitas Sebelum SHU', styles: { fontStyle: 'bold' } }, formatRupiah(jmlEkuitasB), formatRupiah(jmlEkuitasL)]);

  tableRows.push([
    '   SHU Tahun Berjalan',
    formatRupiah(shuB),
    formatRupiah(shuL)
  ]);
  tableRows.push([
    { content: 'TOTAL PASIVA (LIABILITAS & EKUITAS)', styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } },
    { content: formatRupiah(totalPasivaB), styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } },
    { content: formatRupiah(totalPasivaL), styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } }
  ]);

  autoTable(doc, {
    startY: startY,
    head: [
      ['Komponen Laporan Keuangan', `Th. Berjalan (${thB})`, `Th. Pembanding (${thL})`]
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left' },
      1: { cellWidth: 41, halign: 'right', font: 'courier' },
      2: { cellWidth: 41, halign: 'right', font: 'courier' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 1.8
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || startY + 120;
  addSignatures(doc, finalY);

  doc.save(`Laporan_Posisi_Keuangan_Neraca_Komparatif_${thB}_${thL}_KWB.pdf`);
}

/**
 * EXPORT PERHITUNGAN HASIL USAHA (PHU / LABA RUGI) KE PDF
 */
export function exportUploadedPHUPdf(data: UploadedPHUData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const thB = data.tahunBerjalan || '2025';
  const thL = data.tahunLalu || '2024';

  let startY = addOfficialKop(
    doc,
    'PERHITUNGAN HASIL USAHA (PHU / LABA RUGI)',
    `KOMPARATIF & DISTRIBUSI SHU TAHUN BUKU ${thB} & ${thL}`
  );

  const sum = (arr: AkunBarisLaporan[], field: 'nilaiBerjalan' | 'nilaiLalu') =>
    arr.reduce((acc, c) => acc + (Number(c[field]) || 0), 0);

  const jmlPendapatanB = sum(data.pendapatan, 'nilaiBerjalan');
  const jmlPendapatanL = sum(data.pendapatan, 'nilaiLalu');
  const jmlBebanB = sum(data.beban, 'nilaiBerjalan');
  const jmlBebanL = sum(data.beban, 'nilaiLalu');

  const shuB = jmlPendapatanB - jmlBebanB;
  const shuL = jmlPendapatanL - jmlBebanL;

  const tableRows: any[][] = [];

  // I. PENDAPATAN
  tableRows.push([{ content: 'I. PENDAPATAN USAHA KOPERASI', colSpan: 3, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
  data.pendapatan.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([
    { content: 'TOTAL PENDAPATAN USAHA', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: formatRupiah(jmlPendapatanB), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: formatRupiah(jmlPendapatanL), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
  ]);

  // II. BEBAN
  tableRows.push([{ content: 'II. BEBAN ADMINISTRASI & BEBAN UMUM', colSpan: 3, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
  data.beban.forEach(item => {
    tableRows.push([
      `   ${item.no}. ${item.namaAkun}`,
      formatRupiah(item.nilaiBerjalan),
      formatRupiah(item.nilaiLalu)
    ]);
  });
  tableRows.push([
    { content: 'TOTAL BEBAN USAHA', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: formatRupiah(jmlBebanB), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: formatRupiah(jmlBebanL), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
  ]);

  // III. SHU BERSIH
  tableRows.push([
    { content: 'SISA HASIL USAHA (SHU) TAHUN BERJALAN', styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } },
    { content: formatRupiah(shuB), styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } },
    { content: formatRupiah(shuL), styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' } }
  ]);

  autoTable(doc, {
    startY: startY,
    head: [
      ['Rincian Uraian Akun PHU', `Th. Berjalan (${thB})`, `Th. Pembanding (${thL})`]
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left' },
      1: { cellWidth: 41, halign: 'right', font: 'courier' },
      2: { cellWidth: 41, halign: 'right', font: 'courier' }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5
    },
    margin: { left: 14, right: 14 }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || startY + 120;

  // IV. DISTRIBUSI SHU TABLE (If items present)
  if (data.distribusiSHU && data.distribusiSHU.length > 0) {
    if (finalY + 50 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('PEMBAGIAN / DISTRIBUSI SHU KOPERASI', 14, finalY + 6);

    const distRows = data.distribusiSHU.map((d, idx) => [
      `${idx + 1}. ${d.namaPos}`,
      `${d.persentase}%`,
      formatRupiah(d.nilaiBerjalan),
      formatRupiah(d.nilaiLalu)
    ]);

    const totalDistB = data.distribusiSHU.reduce((acc, c) => acc + (Number(c.nilaiBerjalan) || 0), 0);
    const totalDistL = data.distribusiSHU.reduce((acc, c) => acc + (Number(c.nilaiLalu) || 0), 0);

    distRows.push([
      'TOTAL ALOKASI DISTRIBUSI SHU',
      '100%',
      formatRupiah(totalDistB),
      formatRupiah(totalDistL)
    ]);

    autoTable(doc, {
      startY: finalY + 8,
      head: [
        ['Pos Pembagian SHU', 'Persentase', `Alokasi Th. ${thB}`, `Alokasi Th. ${thL}`]
      ],
      body: distRows,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 90, halign: 'left' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 35, halign: 'right', font: 'courier' },
        3: { cellWidth: 35, halign: 'right', font: 'courier' }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5
      },
      margin: { left: 14, right: 14 }
    });

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 40;
  }

  addSignatures(doc, finalY);

  doc.save(`Laporan_Perhitungan_Hasil_Usaha_PHU_${thB}_${thL}_KWB.pdf`);
}
