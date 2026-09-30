import {
  Anggota,
  JurnalItem,
  SimpananRecord,
  PinjamanUang,
  PinjamanBarang,
  PengajuanPinjaman,
  PembukuanTokoItem,
  PembukuanSeragamItem,
  PengaturanAkun
} from '../types';

export const INITIAL_ANGGOTA: Anggota[] = [];

export const INITIAL_JURNAL: JurnalItem[] = [];

export const INITIAL_SIMPANAN: SimpananRecord[] = [];

export const INITIAL_PINJAMAN_UANG: PinjamanUang[] = [];

export const INITIAL_PINJAMAN_BARANG: PinjamanBarang[] = [];

export const INITIAL_PENGAJUAN: PengajuanPinjaman[] = [];

export const INITIAL_TOKO: PembukuanTokoItem[] = [];

export const INITIAL_SERAGAM: PembukuanSeragamItem[] = [];

export const INITIAL_PENGATURAN_AKUN: PengaturanAkun = {
  username: 'Warga Bahagia',
  password: '19',
  namaAdmin: 'Pengurus Koperasi Warga Bahagia',
  emailAdmin: 'koperasi.sman19bdg@gmail.com',
  noHpAdmin: '0812-2301-9190',
  namaKoperasi: 'KOPERASI PEGAWAI "WARGA BAHAGIA"',
  instansiInduk: 'PEMERINTAH DAERAH PROVINSI JAWA BARAT\nDINAS PENDIDIKAN - SMA NEGERI 19 BANDUNG',
  badanHukum: 'Badan Hukum KPRI No. 19/BH/KWK/1998 · Tgl 19 Mei 1998',
  alamatKoperasi: 'Jl. Dago Asri No. 19, Kel. Dago, Kec. Coblong, Kota Bandung 40135',
  teleponKoperasi: '(022) 2501919',
  emailKoperasi: 'koperasi.sman19bdg@gmail.com',
  websiteKoperasi: 'sman19bdg.sch.id',
  tampilkanLogoKop: true,
  tampilkanLogoKiriKop: true,
  tampilkanLogoKananKop: true,
  warnaGarisKop: 'emerald',
  catatanKakiKop: 'Dokumen ini diterbitkan secara sah dan resmi oleh Sistem Informasi Manajemen Koperasi Pegawai SMAN 19 Bandung.',
  namaKetua: 'Drs. H. Ahmad Sudrajat, M.Pd.',
  nipKetua: '19680512 199403 1 004',
  namaBendahara: 'Hj. Siti Rohmah, S.Pd., M.M.',
  nipBendahara: '19740920 199802 2 001',
  namaSekretaris: 'Dra. Hj. Neneng Suryani, M.M.Pd.',
  nipSekretaris: '19710315 199601 2 002',
  logoUrl: '', // Logo Kiri (Fallback ke default lambang_koperasi.jpg atau logo yang diunggah)
  logoKananUrl: '', // Logo Kanan Kop Surat (Fallback ke lambang_koperasi.jpg atau logo sekolah)
  terakhirDiperbarui: '2026-09-23'
};
