import * as XLSX from 'xlsx';
import { UploadedPosisiKeuanganData, UploadedPHUData, AkunBarisLaporan } from '../types';
import { INITIAL_POSISI_KEUANGAN_LPJ, INITIAL_PHU_LPJ } from '../data/initialUploadedReports';
import { StorageService } from './storage';

// Helper: safe numeric conversion
function parseVal(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val)
    .replace(/[^\d.-]/g, '')
    .trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Helper: match name ignoring case, punctuation & extra spaces
function normalizeName(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Download Template Excel Laporan Posisi Keuangan (Neraca Komparatif)
 */
export function downloadTemplatePosisiKeuangan(
  data: UploadedPosisiKeuanganData = INITIAL_POSISI_KEUANGAN_LPJ
) {
  const wb = XLSX.utils.book_new();
  const thB = data.tahunBerjalan || '2025';
  const thL = data.tahunLalu || '2024';

  const p = StorageService.getPengaturan();
  const namaKop = (p.namaKoperasi || 'KOPERASI KONSUMEN WARGA BAHAGIA SMA NEGERI 19 BANDUNG').toUpperCase();

  const rows: any[][] = [
    [namaKop],
    [`LAPORAN POSISI KEUANGAN TAHUN USAHA ${thB}`],
    [`Komparatif Tahun ${thB} dan ${thL}`],
    [],
    [
      'No',
      'Aset',
      `Tahun ${thB}`,
      `Tahun ${thL}`,
      'No',
      'Liabilitas & Ekuitas',
      `Tahun ${thB}`,
      `Tahun ${thL}`
    ],
    ['A', 'Aset Lancar', '', '', 'A', 'Liabilitas', '', '']
  ];

  // Combine rows side by side
  // Left: Aset Lancar (11 items)
  // Right: Liabilitas (6 items)
  const maxLancar = Math.max(data.asetLancar.length, data.liabilitas.length);
  for (let i = 0; i < maxLancar; i++) {
    const l = data.asetLancar[i];
    const r = data.liabilitas[i];
    rows.push([
      l ? l.no : '',
      l ? l.namaAkun : '',
      l ? l.nilaiBerjalan : '',
      l ? l.nilaiLalu : '',
      r ? r.no : '',
      r ? r.namaAkun : '',
      r ? r.nilaiBerjalan : '',
      r ? r.nilaiLalu : ''
    ]);
  }

  // Subtotal Aset Lancar & Subtotal Liabilitas
  const jmlAsetLancarB = data.asetLancar.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const jmlAsetLancarL = data.asetLancar.reduce((acc, c) => acc + c.nilaiLalu, 0);
  const jmlLiabilitasB = data.liabilitas.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const jmlLiabilitasL = data.liabilitas.reduce((acc, c) => acc + c.nilaiLalu, 0);

  rows.push([
    '',
    'Jumlah Aset lancar',
    jmlAsetLancarB,
    jmlAsetLancarL,
    '',
    'Jumlah Liabilitas',
    jmlLiabilitasB,
    jmlLiabilitasL
  ]);
  rows.push([]);

  // Section B
  // Left: Penyertaan (6 items)
  // Right: Ekuitas (4 items)
  rows.push(['B', 'Penyertaan', '', '', 'B', 'Ekuitas', '', '']);
  const maxB = Math.max(data.penyertaan.length, data.ekuitas.length);
  for (let i = 0; i < maxB; i++) {
    const l = data.penyertaan[i];
    const r = data.ekuitas[i];
    rows.push([
      l ? l.no : '',
      l ? l.namaAkun : '',
      l ? l.nilaiBerjalan : '',
      l ? l.nilaiLalu : '',
      r ? r.no : '',
      r ? r.namaAkun : '',
      r ? r.nilaiBerjalan : '',
      r ? r.nilaiLalu : ''
    ]);
  }

  const jmlPenyertaanB = data.penyertaan.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const jmlPenyertaanL = data.penyertaan.reduce((acc, c) => acc + c.nilaiLalu, 0);
  const jmlEkuitasB = data.ekuitas.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const jmlEkuitasL = data.ekuitas.reduce((acc, c) => acc + c.nilaiLalu, 0);

  rows.push([
    '',
    'Jumlah Penyertaan',
    jmlPenyertaanB,
    jmlPenyertaanL,
    '',
    'Jumlah Ekuitas',
    jmlEkuitasB,
    jmlEkuitasL
  ]);
  rows.push([]);

  // Section C
  // Left: Aset Tetap (4 items)
  // Right: SHU Tahun Berjalan
  rows.push(['C', 'Aset Tetap', '', '', '', 'SHU Tahun Berjalan', data.shuTahunBerjalan.nilaiBerjalan, data.shuTahunBerjalan.nilaiLalu]);
  for (let i = 0; i < data.asetTetap.length; i++) {
    const l = data.asetTetap[i];
    rows.push([
      l.no,
      l.namaAkun,
      l.nilaiBerjalan,
      l.nilaiLalu,
      '',
      '',
      '',
      ''
    ]);
  }

  const jmlAsetTetapB = data.asetTetap.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const jmlAsetTetapL = data.asetTetap.reduce((acc, c) => acc + c.nilaiLalu, 0);
  rows.push(['', 'Jumlah Aset Tetap', jmlAsetTetapB, jmlAsetTetapL, '', '', '', '']);

  // Total Aset vs Total Liabilitas & Ekuitas
  const totalAsetB = jmlAsetLancarB + jmlPenyertaanB + jmlAsetTetapB;
  const totalAsetL = jmlAsetLancarL + jmlPenyertaanL + jmlAsetTetapL;
  const totalPasivaB = jmlLiabilitasB + jmlEkuitasB + data.shuTahunBerjalan.nilaiBerjalan;
  const totalPasivaL = jmlLiabilitasL + jmlEkuitasL + data.shuTahunBerjalan.nilaiLalu;

  rows.push([
    '',
    'Total Aset',
    totalAsetB,
    totalAsetL,
    '',
    'Total Liabilitas & Ekuitas',
    totalPasivaB,
    totalPasivaL
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 38 }, // Nama Akun Aktiva
    { wch: 16 }, // 2025
    { wch: 16 }, // 2024
    { wch: 5 },  // No
    { wch: 38 }, // Nama Akun Pasiva
    { wch: 16 }, // 2025
    { wch: 16 }  // 2024
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Posisi Keuangan');
  XLSX.writeFile(wb, `Template_Laporan_Posisi_Keuangan_${thB}_KWB.xlsx`);
}

/**
 * Download Template Excel PHU (Perhitungan Hasil Usaha / Laba Rugi)
 */
export function downloadTemplatePHU(
  data: UploadedPHUData = INITIAL_PHU_LPJ
) {
  const wb = XLSX.utils.book_new();
  const thB = data.tahunBerjalan || '2025';
  const thL = data.tahunLalu || '2024';

  const p = StorageService.getPengaturan();
  const namaKop = (p.namaKoperasi || 'KOPERASI KONSUMEN WARGA BAHAGIA SMA NEGERI 19 BANDUNG').toUpperCase();

  const rows: any[][] = [
    [namaKop],
    ['PERHITUNGAN HASIL USAHA (PHU)'],
    [`PER 31 DESEMBER ${thL} DAN ${thB}`],
    [],
    ['NO', 'URAIAN', `TAHUN ${thB}`, `TAHUN ${thL}`],
    ['I', 'PENDAPATAN', '', '']
  ];

  data.pendapatan.forEach(p => {
    rows.push([p.no, p.namaAkun, p.nilaiBerjalan, p.nilaiLalu]);
  });

  const totalPendapatanB = data.pendapatan.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const totalPendapatanL = data.pendapatan.reduce((acc, c) => acc + c.nilaiLalu, 0);
  rows.push(['', 'Jumlah Pendapatan', totalPendapatanB, totalPendapatanL]);
  rows.push([]);

  rows.push(['II', 'BEBAN ADMINISTRASI DAN BEBAN UMUM', '', '']);
  data.beban.forEach(b => {
    rows.push([b.no, b.namaAkun, b.nilaiBerjalan, b.nilaiLalu]);
  });

  const totalBebanB = data.beban.reduce((acc, c) => acc + c.nilaiBerjalan, 0);
  const totalBebanL = data.beban.reduce((acc, c) => acc + c.nilaiLalu, 0);
  rows.push(['', 'Jumlah Beban-beban', totalBebanB, totalBebanL]);
  rows.push([]);

  const shuB = totalPendapatanB - totalBebanB;
  const shuL = totalPendapatanL - totalBebanL;
  rows.push(['', 'SHU Tahun Berjalan', shuB, shuL]);
  rows.push([]);

  rows.push(['', 'DISTRIBUSI SHU', '%', `TAHUN ${thB}`, `TAHUN ${thL}`]);
  data.distribusiSHU.forEach(d => {
    rows.push(['', d.namaPos, `${d.persentase}%`, d.nilaiBerjalan, d.nilaiLalu]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'PHU');
  XLSX.writeFile(wb, `Template_PHU_Laba_Rugi_${thB}_KWB.xlsx`);
}

/**
 * Parse Excel Laporan Posisi Keuangan (Neraca)
 */
export async function parseExcelPosisiKeuangan(
  file: File,
  currentData: UploadedPosisiKeuanganData
): Promise<{ success: boolean; data?: UploadedPosisiKeuanganData; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: 'Berkas Excel tidak memiliki sheet yang valid.' };
    }
    const ws = wb.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rawData || rawData.length < 5) {
      return { success: false, error: 'Format berkas Excel tidak sesuai template.' };
    }

    // Deep clone current data as base structure
    const updated: UploadedPosisiKeuanganData = JSON.parse(JSON.stringify(currentData));

    // Flatten rows into text lookups
    for (const row of rawData) {
      if (!Array.isArray(row) || row.length === 0) continue;

      // Check left columns (index 1 = name, index 2 = 2025, index 3 = 2024)
      const leftName = String(row[1] || '').trim();
      const leftValB = parseVal(row[2]);
      const leftValL = parseVal(row[3]);

      // Check right columns (index 5 = name, index 6 = 2025, index 7 = 2024)
      const rightName = String(row[5] || '').trim();
      const rightValB = parseVal(row[6]);
      const rightValL = parseVal(row[7]);

      // Match left side accounts (Aset Lancar, Penyertaan, Aset Tetap)
      if (leftName) {
        const norm = normalizeName(leftName);
        // Aset Lancar
        const matchLancar = updated.asetLancar.find(a => normalizeName(a.namaAkun) === norm || norm.includes(normalizeName(a.namaAkun)));
        if (matchLancar && (leftValB !== 0 || leftValL !== 0)) {
          matchLancar.nilaiBerjalan = leftValB;
          matchLancar.nilaiLalu = leftValL;
        }

        // Penyertaan
        const matchPenyertaan = updated.penyertaan.find(a => normalizeName(a.namaAkun) === norm || norm.includes(normalizeName(a.namaAkun)));
        if (matchPenyertaan && (leftValB !== 0 || leftValL !== 0)) {
          matchPenyertaan.nilaiBerjalan = leftValB;
          matchPenyertaan.nilaiLalu = leftValL;
        }

        // Aset Tetap
        const matchTetap = updated.asetTetap.find(a => normalizeName(a.namaAkun) === norm || norm.includes(normalizeName(a.namaAkun)));
        if (matchTetap && (leftValB !== 0 || leftValL !== 0)) {
          matchTetap.nilaiBerjalan = leftValB;
          matchTetap.nilaiLalu = leftValL;
        }
      }

      // Match right side accounts (Liabilitas, Ekuitas, SHU)
      if (rightName) {
        const norm = normalizeName(rightName);
        // Liabilitas
        const matchLiab = updated.liabilitas.find(a => normalizeName(a.namaAkun) === norm || norm.includes(normalizeName(a.namaAkun)));
        if (matchLiab && (rightValB !== 0 || rightValL !== 0)) {
          matchLiab.nilaiBerjalan = rightValB;
          matchLiab.nilaiLalu = rightValL;
        }

        // Ekuitas
        const matchEkuitas = updated.ekuitas.find(a => normalizeName(a.namaAkun) === norm || norm.includes(normalizeName(a.namaAkun)));
        if (matchEkuitas && (rightValB !== 0 || rightValL !== 0)) {
          matchEkuitas.nilaiBerjalan = rightValB;
          matchEkuitas.nilaiLalu = rightValL;
        }

        // SHU Tahun Berjalan
        if (norm.includes('shutahunberjalan') || norm.includes('sisahasilusaha')) {
          if (rightValB !== 0 || rightValL !== 0) {
            updated.shuTahunBerjalan.nilaiBerjalan = rightValB;
            updated.shuTahunBerjalan.nilaiLalu = rightValL;
          }
        }
      }

      // Also check if SHU or other rows appear in leftName by mistake
      if (leftName) {
        const norm = normalizeName(leftName);
        if (norm.includes('shutahunberjalan')) {
          if (leftValB !== 0 || leftValL !== 0) {
            updated.shuTahunBerjalan.nilaiBerjalan = leftValB;
            updated.shuTahunBerjalan.nilaiLalu = leftValL;
          }
        }
      }
    }

    updated.terakhirDiperbarui = new Date().toISOString().split('T')[0];
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membaca berkas Excel Posisi Keuangan.' };
  }
}

/**
 * Parse Excel PHU (Perhitungan Hasil Usaha / Laba Rugi)
 */
export async function parseExcelPHU(
  file: File,
  currentData: UploadedPHUData
): Promise<{ success: boolean; data?: UploadedPHUData; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: 'Berkas Excel tidak memiliki sheet yang valid.' };
    }
    const ws = wb.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rawData || rawData.length < 5) {
      return { success: false, error: 'Format berkas Excel tidak sesuai template.' };
    }

    const updated: UploadedPHUData = JSON.parse(JSON.stringify(currentData));

    for (const row of rawData) {
      if (!Array.isArray(row) || row.length === 0) continue;

      // Find uraian text column (often col 1 or col 0)
      let uraian = '';
      let valB = 0;
      let valL = 0;

      if (typeof row[1] === 'string' && isNaN(Number(row[1]))) {
        uraian = String(row[1]).trim();
        valB = parseVal(row[2]);
        valL = parseVal(row[3]);
      } else if (typeof row[0] === 'string' && isNaN(Number(row[0]))) {
        uraian = String(row[0]).trim();
        valB = parseVal(row[1]);
        valL = parseVal(row[2]);
      }

      if (!uraian) continue;
      const norm = normalizeName(uraian);

      // Check Pendapatan
      const matchPend = updated.pendapatan.find(p => {
        const pNorm = normalizeName(p.namaAkun);
        return pNorm === norm || norm.includes(pNorm) || pNorm.includes(norm);
      });
      if (matchPend && (valB !== 0 || valL !== 0)) {
        matchPend.nilaiBerjalan = valB;
        matchPend.nilaiLalu = valL;
        continue;
      }

      // Check Beban
      const matchBeban = updated.beban.find(b => {
        const bNorm = normalizeName(b.namaAkun);
        return bNorm === norm || norm.includes(bNorm) || bNorm.includes(norm);
      });
      if (matchBeban && (valB !== 0 || valL !== 0)) {
        matchBeban.nilaiBerjalan = valB;
        matchBeban.nilaiLalu = valL;
        continue;
      }

      // Check Distribusi SHU
      const matchDist = updated.distribusiSHU.find(d => {
        const dNorm = normalizeName(d.namaPos);
        return dNorm === norm || norm.includes(dNorm) || dNorm.includes(norm);
      });
      if (matchDist) {
        // Look in col 3 & 4 or 2 & 3
        const distValB = parseVal(row[3]) || parseVal(row[2]);
        const distValL = parseVal(row[4]) || parseVal(row[3]);
        if (distValB !== 0 || distValL !== 0) {
          matchDist.nilaiBerjalan = distValB;
          matchDist.nilaiLalu = distValL;
        }
      }
    }

    updated.terakhirDiperbarui = new Date().toISOString().split('T')[0];
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membaca berkas Excel PHU.' };
  }
}

/**
 * Ekspor Data Laporan Posisi Keuangan (Neraca) Ke Excel (.xlsx)
 */
export function exportUploadedPosisiKeuanganExcel(data: UploadedPosisiKeuanganData) {
  downloadTemplatePosisiKeuangan(data);
}

/**
 * Ekspor Data PHU (Laba Rugi) & Distribusi SHU Ke Excel (.xlsx)
 */
export function exportUploadedPHUExcel(data: UploadedPHUData) {
  downloadTemplatePHU(data);
}
