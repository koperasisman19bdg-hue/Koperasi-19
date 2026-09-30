import { UploadedPosisiKeuanganData, UploadedPHUData } from '../types';

export const INITIAL_POSISI_KEUANGAN_LPJ: UploadedPosisiKeuanganData = {
  id: 'posisi_keuangan_lpj_2025',
  tahunBerjalan: '2025',
  tahunLalu: '2024',
  terakhirDiperbarui: '2026-09-28',
  asetLancar: [
    { no: 1, namaAkun: 'Kas', nilaiBerjalan: 5747047, nilaiLalu: 13760000 },
    { no: 2, namaAkun: 'Bank', nilaiBerjalan: 371038686, nilaiLalu: 525255417 },
    { no: 3, namaAkun: 'Piutang Uang Anggota', nilaiBerjalan: 566226683, nilaiLalu: 406112771 },
    { no: 4, namaAkun: 'Piutang Uang Tak Tertagih', nilaiBerjalan: 12879711, nilaiLalu: 12879711 },
    { no: 5, namaAkun: 'Penyusutan Piutang Uang tak tertagih', nilaiBerjalan: -11257902, nilaiLalu: -10507902 },
    { no: 6, namaAkun: 'Piutang Barang', nilaiBerjalan: 12141200, nilaiLalu: 27538000 },
    { no: 7, namaAkun: 'Kas Pertokoan', nilaiBerjalan: 2839660, nilaiLalu: 7324000 },
    { no: 8, namaAkun: 'Persediaan Barang Pertokoan', nilaiBerjalan: 8565023, nilaiLalu: 3292950 },
    { no: 9, namaAkun: 'Persediaan Kaos OR, Batik, raket dll', nilaiBerjalan: 0, nilaiLalu: 7440000 },
    { no: 10, namaAkun: 'Penyusutan PSAS', nilaiBerjalan: 0, nilaiLalu: -7440000 },
    { no: 11, namaAkun: 'Persediaan PSAS dan atribut', nilaiBerjalan: 60979000, nilaiLalu: 72466500 }
  ],
  penyertaan: [
    { no: 1, namaAkun: 'Simpanan Pokok PKPRI', nilaiBerjalan: 2000000, nilaiLalu: 2000000 },
    { no: 2, namaAkun: 'Simpanan Wajib PKPRI', nilaiBerjalan: 36888400, nilaiLalu: 36888400 },
    { no: 3, namaAkun: 'Simpanan Wajib Khusus PKPRI', nilaiBerjalan: 1416000, nilaiLalu: 1416000 },
    { no: 4, namaAkun: 'Simpanan Sukarela PKPRI', nilaiBerjalan: 369600, nilaiLalu: 369600 },
    { no: 5, namaAkun: 'Simpanan Lain - Lain PKPRI', nilaiBerjalan: 127825, nilaiLalu: 127825 },
    { no: 6, namaAkun: 'Simpan UKS PKPRI', nilaiBerjalan: 275875, nilaiLalu: 275875 }
  ],
  asetTetap: [
    { no: 1, namaAkun: 'Peralatan', nilaiBerjalan: 28488000, nilaiLalu: 28488000 },
    { no: 2, namaAkun: 'Akumulasi Penyusutan Peralatan', nilaiBerjalan: -17540099, nilaiLalu: -16840099 },
    { no: 3, namaAkun: 'Gedung Kantin dan Rehabilitasi', nilaiBerjalan: 176120000, nilaiLalu: 176120000 },
    { no: 4, namaAkun: 'Akumulasi Penyusutan dan rehabilitasi', nilaiBerjalan: -74122780, nilaiLalu: -68122780 }
  ],
  liabilitas: [
    { no: 1, namaAkun: 'Simpanan Sukarela Anggota', nilaiBerjalan: 258474290, nilaiLalu: 257696547 },
    { no: 2, namaAkun: 'Dana Sosial', nilaiBerjalan: 15332613, nilaiLalu: 13269555 },
    { no: 3, namaAkun: 'Dana Pendidikan', nilaiBerjalan: 6509953, nilaiLalu: 9572054 },
    { no: 4, namaAkun: 'Dana Pensiun dan Kematian (DPDK)', nilaiBerjalan: 599916, nilaiLalu: 1023916 },
    { no: 5, namaAkun: 'Dana Pembangunan Daerah Kerja', nilaiBerjalan: 3218381, nilaiLalu: 9780482 },
    { no: 6, namaAkun: 'Dana 12 Juli', nilaiBerjalan: 8858000, nilaiLalu: 5558000 }
  ],
  ekuitas: [
    { no: 1, namaAkun: 'Simpanan Pokok Anggota', nilaiBerjalan: 33000000, nilaiLalu: 31000000 },
    { no: 2, namaAkun: 'Simpanan Wajib Anggota', nilaiBerjalan: 681979430, nilaiLalu: 713005250 },
    { no: 3, namaAkun: 'Dana Cadangan', nilaiBerjalan: 108993547, nilaiLalu: 104180489 },
    { no: 4, namaAkun: 'Hibah', nilaiBerjalan: 5000000, nilaiLalu: 5000000 }
  ],
  shuTahunBerjalan: {
    nilaiBerjalan: 61215799,
    nilaiLalu: 68757975
  }
};

export const INITIAL_PHU_LPJ: UploadedPHUData = {
  id: 'phu_lpj_2025',
  tahunBerjalan: '2025',
  tahunLalu: '2024',
  terakhirDiperbarui: '2026-09-28',
  pendapatan: [
    { no: 1, namaAkun: 'Pendapatan USP', nilaiBerjalan: 59823151, nilaiLalu: 64651745 },
    { no: 2, namaAkun: 'Administrasi USP', nilaiBerjalan: 6444370, nilaiLalu: 5320209 },
    { no: 3, namaAkun: 'Pendapatan Usaha lainnya', nilaiBerjalan: 10000000, nilaiLalu: 18000000 },
    { no: 4, namaAkun: 'Pendapatan Barang', nilaiBerjalan: 7667850, nilaiLalu: 7436000 },
    { no: 5, namaAkun: 'Pendapatan laba PSAS', nilaiBerjalan: 20000000, nilaiLalu: 43000000 },
    { no: 6, namaAkun: 'Pendapatan Sewa Kantin', nilaiBerjalan: 37000000, nilaiLalu: 51000000 },
    { no: 7, namaAkun: 'Pendapatan Pertokoan', nilaiBerjalan: 28000000, nilaiLalu: 28421500 },
    { no: 8, namaAkun: 'Pendapatan Bunga Bank', nilaiBerjalan: 595516, nilaiLalu: 697425 },
    { no: 9, namaAkun: 'SHU PKPRI', nilaiBerjalan: 0, nilaiLalu: 0 }
  ],
  beban: [
    { no: 1, namaAkun: 'Transportasi', nilaiBerjalan: 1000000, nilaiLalu: 1750000 },
    { no: 2, namaAkun: 'ATK', nilaiBerjalan: 750000, nilaiLalu: 1850000 },
    { no: 3, namaAkun: 'Pembelian meja kursi kantin', nilaiBerjalan: 2905061, nilaiLalu: 1250000 },
    { no: 4, namaAkun: 'Biaya perbaikan dan pemeliharaan kantin', nilaiBerjalan: 7000000, nilaiLalu: 3300000 },
    { no: 5, namaAkun: 'Gaji Karyawan', nilaiBerjalan: 10000000, nilaiLalu: 9000000 },
    { no: 6, namaAkun: 'Perjalanan Dinas Pengurus', nilaiBerjalan: 300000, nilaiLalu: 1200000 },
    { no: 7, namaAkun: 'THR Pengurus dan anggota koperasi', nilaiBerjalan: 21650000, nilaiLalu: 20750000 },
    { no: 8, namaAkun: 'Penyusutan Pertokoan', nilaiBerjalan: 750000, nilaiLalu: 750000 },
    { no: 9, namaAkun: 'Penyusutan Piutang Tak Tertagih', nilaiBerjalan: 750000, nilaiLalu: 750000 },
    { no: 10, namaAkun: 'Pajak', nilaiBerjalan: 600000, nilaiLalu: 900000 },
    { no: 11, namaAkun: 'Biaya-biaya Bank', nilaiBerjalan: 441025, nilaiLalu: 476904 },
    { no: 12, namaAkun: 'Biaya Penyusutan Pembangunan kantin', nilaiBerjalan: 6000000, nilaiLalu: 6000000 },
    { no: 13, namaAkun: 'Biaya Penyusutan Peralatan', nilaiBerjalan: 700000, nilaiLalu: 700000 },
    { no: 14, namaAkun: 'Insentif Pengurus', nilaiBerjalan: 1500000, nilaiLalu: 1500000 },
    { no: 15, namaAkun: 'Insentif Pembina Intern', nilaiBerjalan: 1000000, nilaiLalu: 1000000 },
    { no: 16, namaAkun: 'Insentif Pembina ekstern', nilaiBerjalan: 1500000, nilaiLalu: 1000000 },
    { no: 17, namaAkun: 'Insentif Pengawas (3 orang)', nilaiBerjalan: 3000000, nilaiLalu: 2250000 },
    { no: 18, namaAkun: 'Biaya Rapat Anggota (RAT)', nilaiBerjalan: 15000000, nilaiLalu: 12500000 },
    { no: 19, namaAkun: 'Biaya Persiapan RAT', nilaiBerjalan: 3600000, nilaiLalu: 3500000 },
    { no: 20, namaAkun: 'Pemilihan pengurus dan pengawas baru', nilaiBerjalan: 750000, nilaiLalu: 0 },
    { no: '20b', namaAkun: 'Rapat MOU', nilaiBerjalan: 0, nilaiLalu: 0 },
    { no: 21, namaAkun: 'Partisipasi Kegiatan Sekolah', nilaiBerjalan: 2010000, nilaiLalu: 0 },
    { no: 22, namaAkun: 'Insentif Pengurus (3 orang) @100.000/bln', nilaiBerjalan: 3600000, nilaiLalu: 3600000 },
    { no: 23, namaAkun: 'Kontribusi Seragam, kantin dan toko ke Sekolah', nilaiBerjalan: 7859002, nilaiLalu: 10792000 },
    { no: 24, namaAkun: 'Kekurangan Amnesti Pajak', nilaiBerjalan: 0, nilaiLalu: 0 },
    { no: 25, namaAkun: 'Kekurangan pembayaran pajak', nilaiBerjalan: 0, nilaiLalu: 0 },
    { no: 26, namaAkun: 'Tabungan RAT tahun usaha 2025', nilaiBerjalan: 12000000, nilaiLalu: 0 },
    { no: 27, namaAkun: 'Biaya RAT di luar', nilaiBerjalan: 0, nilaiLalu: 50000000 },
    { no: 28, namaAkun: 'Pembayaran Listrik, sampah dan air', nilaiBerjalan: 1600000, nilaiLalu: 1500000 },
    { no: 29, namaAkun: 'Pengelolaan kantin', nilaiBerjalan: 700000, nilaiLalu: 700000 },
    { no: 30, namaAkun: 'Biaya pasang KWH dan instalasi', nilaiBerjalan: 0, nilaiLalu: 2750000 },
    { no: 31, namaAkun: 'Seragam batik anggota', nilaiBerjalan: 1350000, nilaiLalu: 10000000 }
  ],
  distribusiSHU: [
    { namaPos: 'Cadangan Dana', persentase: 5, nilaiBerjalan: 3060790, nilaiLalu: 4813058 },
    { namaPos: 'Jasa Penyimpan', persentase: 30, nilaiBerjalan: 18364740, nilaiLalu: 22002552 },
    { namaPos: 'Jasa Peminjam Uang', persentase: 34, nilaiBerjalan: 20813372, nilaiLalu: 22002552 },
    { namaPos: 'Jasa Peminjam Barang', persentase: 6, nilaiBerjalan: 3672948, nilaiLalu: 1375160 },
    { namaPos: 'Pengurus Pegawai', persentase: 10, nilaiBerjalan: 6121580, nilaiLalu: 6875798 },
    { namaPos: 'Dana Sosial', persentase: 5, nilaiBerjalan: 3060790, nilaiLalu: 4813058 },
    { namaPos: 'Dana Pendidikan', persentase: 5, nilaiBerjalan: 3060790, nilaiLalu: 3437899 },
    { namaPos: 'Dana Pembangunan Daerah Kerja', persentase: 5, nilaiBerjalan: 3060790, nilaiLalu: 3437899 }
  ]
};
