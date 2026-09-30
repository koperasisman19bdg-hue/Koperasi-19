import * as XLSX from 'xlsx';
import {
  Anggota,
  JurnalItem,
  SimpananRecord,
  PinjamanUang,
  PinjamanBarang,
  PembukuanTokoItem,
  PembukuanSeragamItem,
  PengajuanPinjaman
} from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// 1. Export Jurnal Umum
export function exportJurnalToExcel(data: JurnalItem[], filename: string = 'Jurnal_Umum_KWB.xlsx') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'Tanggal': item.tanggal,
    'Uraian Kegiatan / Transaksi': item.uraianKegiatan,
    'Debet / Masuk (Rp)': item.debet,
    'Kredit / Keluar (Rp)': item.kredit,
    'Saldo Kas (Rp)': item.saldoAkhir
  }));

  const totalDebet = data.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKredit = data.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const finalSaldo = data.length > 0 ? data[data.length - 1].saldoAkhir : 0;

  // Append Total Row
  rows.push({
    'No': '' as any,
    'Tanggal': '',
    'Uraian Kegiatan / Transaksi': 'TOTAL AKUMULASI KAS',
    'Debet / Masuk (Rp)': totalDebet,
    'Kredit / Keluar (Rp)': totalKredit,
    'Saldo Kas (Rp)': finalSaldo
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal Umum');
  XLSX.writeFile(workbook, filename);
}

// 2. Export Toko
export function exportTokoToExcel(data: PembukuanTokoItem[], filename: string = 'Pembukuan_Toko_KWB.xlsx') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'Tanggal': item.tanggal,
    'Uraian Kegiatan': item.uraianKegiatan,
    'Saldo Awal (Rp)': item.saldoAwal,
    'Debet / Masuk (Rp)': item.debet,
    'Kredit / Keluar (Rp)': item.kredit,
    'Saldo Akhir (Rp)': item.saldoAkhir,
    'Kategori': item.kategori || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemasukan Toko');
  XLSX.writeFile(workbook, filename);
}

// 3. Export Seragam
export function exportSeragamToExcel(data: PembukuanSeragamItem[], filename: string = 'Pembukuan_Seragam_KWB.xlsx') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'Tanggal': item.tanggal,
    'Uraian Kegiatan': item.uraianKegiatan,
    'Saldo Awal (Rp)': item.saldoAwal,
    'Debet / Masuk (Rp)': item.debet,
    'Kredit / Keluar (Rp)': item.kredit,
    'Saldo Akhir (Rp)': item.saldoAkhir,
    'Kategori': item.kategori || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemasukan Seragam');
  XLSX.writeFile(workbook, filename);
}

// 4. Export Simpanan
export function exportSimpananToExcel(data: SimpananRecord[], filename: string = 'Simpanan_Anggota_KWB.xlsx') {
  const rows = data.map((item, index) => {
    const total = (item.simpananPokok || 0) + (item.simpananWajib || 0) + (item.simpananSukarela || 0);
    return {
      'No': index + 1,
      'No. Anggota': item.nomorAnggota,
      'Nama Lengkap': item.namaAnggota,
      'Simpanan Pokok (Rp)': item.simpananPokok,
      'Simpanan Wajib (Rp)': item.simpananWajib,
      'Simpanan Sukarela (Rp)': item.simpananSukarela,
      'Total Simpanan (Rp)': total,
      'Terakhir Update': item.terakhirUpdate
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Simpanan Anggota');
  XLSX.writeFile(workbook, filename);
}

// 5. Export Pinjaman Uang
export function exportPinjamanUangToExcel(data: PinjamanUang[], filename: string = 'Pinjaman_Uang_KWB.xlsx') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'No. Anggota': item.nomorAnggota,
    'Nama Anggota': item.namaAnggota,
    'Tanggal Pinjam': item.tanggalPinjam,
    'Jumlah Pinjaman (Rp)': item.jumlahPinjaman,
    'Tenor (Bulan)': item.tenorBulan,
    'Angsuran/Bln (Rp)': item.angsuranPerBulan,
    'Total Dibayar (Rp)': item.totalDibayar,
    'Sisa Pinjaman (Rp)': item.sisaPinjaman,
    'Status': item.status,
    'Keperluan': item.keterangan || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pinjaman Uang');
  XLSX.writeFile(workbook, filename);
}

// 6. Export Pinjaman Barang
export function exportPinjamanBarangToExcel(data: PinjamanBarang[], filename: string = 'Pinjaman_Barang_KWB.xlsx') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'No. Anggota': item.nomorAnggota,
    'Nama Anggota': item.namaAnggota,
    'Tanggal Pinjam': item.tanggalPinjam,
    'Nama Barang': item.namaBarang,
    'Harga Barang (Rp)': item.hargaBarang,
    'Tenor (Bulan)': item.tenorBulan,
    'Angsuran/Bln (Rp)': item.angsuranPerBulan,
    'Total Dibayar (Rp)': item.totalDibayar,
    'Sisa Pinjaman (Rp)': item.sisaPinjaman,
    'Status': item.status,
    'Keterangan': item.keterangan || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pinjaman Barang');
  XLSX.writeFile(workbook, filename);
}

// 7. Export Pengajuan Pinjaman
export function exportPengajuanPinjamanToExcel(data: PengajuanPinjaman[], filename: string = 'Pengajuan_Pinjaman_KWB.xlsx') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'No. Anggota': item.nomorAnggota,
    'Nama Anggota': item.namaAnggota,
    'Tanggal Pengajuan': item.tanggalPengajuan,
    'Jenis Pinjaman': item.jenisPinjaman,
    'Jumlah Uang (Rp)': item.jumlahUang || '-',
    'Nama Barang': item.namaBarang || '-',
    'Estimasi Harga Barang (Rp)': item.estimasiHargaBarang || '-',
    'Tenor (Bulan)': item.tenorBulan,
    'Keperluan': item.keperluan,
    'Status': item.status,
    'Catatan Pengurus': item.catatanAdmin || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengajuan Pinjaman');
  XLSX.writeFile(workbook, filename);
}

// 8. Download Excel Templates for easy Upload
export function downloadAnggotaTemplate() {
  const sampleRows = [
    {
      'Nomor Anggota': 'KWB-001',
      'Nama Lengkap': 'Drs. H. Ahmad Sudrajat, M.Pd.',
      'Jenis Kelamin': 'Laki-laki',
      'Tempat Tanggal Lahir': 'Bandung, 12 Agustus 1975',
      'Alamat Lengkap': 'Jl. Dago Asri No. 19, Coblong, Kota Bandung',
      'Tahun Masuk Anggota': 2018,
      'Jenis Kepegawaian': 'PNS',
      'No. HP': '081223456789',
      'Jabatan': 'Guru Ahli Madya'
    },
    {
      'Nomor Anggota': '',
      'Nama Lengkap': 'Dewi Sartika, S.Pd., M.Si.',
      'Jenis Kelamin': 'Perempuan',
      'Tempat Tanggal Lahir': 'Cimahi, 15 Mei 1988',
      'Alamat Lengkap': 'Komp. Permata Indah Blok B-2, Cimahi',
      'Tahun Masuk Anggota': 2022,
      'Jenis Kepegawaian': 'PPPK',
      'No. HP': '085712345678',
      'Jabatan': 'Guru Ahli Pertama'
    },
    {
      'Nomor Anggota': '',
      'Nama Lengkap': 'Bambang Irawan, S.Kom.',
      'Jenis Kelamin': 'Laki-laki',
      'Tempat Tanggal Lahir': 'Sumedang, 04 September 1991',
      'Alamat Lengkap': 'Jl. Tubagus Ismail No. 88, Bandung',
      'Tahun Masuk Anggota': 2023,
      'Jenis Kepegawaian': 'Non ASN',
      'No. HP': '087812984567',
      'Jabatan': 'Tenaga Kependidikan / IT'
    },
    {
      'Nomor Anggota': '',
      'Nama Lengkap': 'Dra. Hj. Nurjanah, M.Si.',
      'Jenis Kelamin': 'Perempuan',
      'Tempat Tanggal Lahir': 'Bandung, 10 Maret 1963',
      'Alamat Lengkap': 'Jl. Cikutra Barat No. 45, Bandung',
      'Tahun Masuk Anggota': 2005,
      'Jenis Kepegawaian': 'Purna Bakti',
      'No. HP': '081398765432',
      'Jabatan': 'Pensiunan Guru'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  worksheet['!cols'] = [
    { wch: 16 }, // Nomor Anggota
    { wch: 30 }, // Nama Lengkap
    { wch: 15 }, // Jenis Kelamin
    { wch: 28 }, // Tempat Tanggal Lahir
    { wch: 42 }, // Alamat Lengkap
    { wch: 20 }, // Tahun Masuk Anggota
    { wch: 18 }, // Jenis Kepegawaian
    { wch: 16 }, // No. HP
    { wch: 24 }  // Jabatan
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Anggota');
  XLSX.writeFile(workbook, 'Template_Data_Keanggotaan_KWB.xlsx');
}

export function downloadSimpananTemplate(anggotaList: Anggota[]) {
  const sampleRows = anggotaList.map(a => ({
    'Nama Anggota': a.namaLengkap,
    'Simpanan Pokok': 500000,
    'Simpanan Wajib': 100000,
    'Simpanan Sukarela': 50000
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Simpanan');
  XLSX.writeFile(workbook, 'Template_Upload_Simpanan_KWB.xlsx');
}

export function downloadPinjamanUangTemplate(anggotaList: Anggota[]) {
  const sampleRows = (anggotaList.length > 0 ? anggotaList : []).map(a => ({
    'Nama Anggota': a.namaLengkap,
    'Tanggal Pinjam (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
    'Jumlah Pinjaman': 5000000,
    'Tenor Bulan': 10,
    'Bunga Persen': 1.0,
    'Keterangan': 'Keperluan darurat keluarga'
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Pinjaman Uang');
  XLSX.writeFile(workbook, 'Template_Upload_Pinjaman_Uang_KWB.xlsx');
}

export function downloadPinjamanBarangTemplate(anggotaList: Anggota[]) {
  const sampleRows = (anggotaList.length > 0 ? anggotaList : []).map(a => ({
    'Nama Anggota': a.namaLengkap,
    'Tanggal Pinjam (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
    'Nama Barang': 'Laptop / Mesin Cuci / Kulkas',
    'Harga Barang': 4500000,
    'Tenor Bulan': 10,
    'Keterangan': 'Pengadaan alat elektronik'
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Pinjaman Barang');
  XLSX.writeFile(workbook, 'Template_Upload_Pinjaman_Barang_KWB.xlsx');
}

// 8. Excel Reader Helper
export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
