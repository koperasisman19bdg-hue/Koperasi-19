export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type JenisKepegawaian = 'PNS' | 'PPPK' | 'Non ASN' | 'Purna Bakti';

export interface Anggota {
  id: string;
  nomorAnggota: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  tempatTanggalLahir: string;
  alamatLengkap: string;
  tahunMasuk: number;
  jenisKepegawaian: JenisKepegawaian;
  fotoUrl?: string;
  noHp?: string;
  jabatan?: string;
}

export interface JurnalItem {
  id: string;
  tanggal: string;
  saldoAwal: number;
  uraianKegiatan: string;
  debet: number; // Pemasukan
  kredit: number; // Pengeluaran
  saldoAkhir: number; // Saldo Awal + Debet - Kredit
  kategori?: string;
  keterangan?: string;
}

export interface SimpananRecord {
  id: string;
  anggotaId: string;
  namaAnggota: string;
  nomorAnggota: string;
  simpananPokok: number;
  simpananWajib: number;
  simpananSukarela: number;
  terakhirUpdate: string;
  riwayat?: {
    id: string;
    tanggal: string;
    jenis: 'Pokok' | 'Wajib' | 'Sukarela';
    jumlah: number;
    keterangan: string;
  }[];
}

export type StatusPinjaman = 'Aktif' | 'Lunas' | 'Menunggu' | 'Ditolak';

export interface PinjamanUang {
  id: string;
  anggotaId: string;
  namaAnggota: string;
  nomorAnggota: string;
  tanggalPinjam: string;
  jumlahPinjaman: number;
  tenorBulan: number;
  bungaPersen: number; // e.g. 1% per bulan
  angsuranPerBulan: number;
  totalDibayar: number;
  sisaPinjaman: number;
  status: StatusPinjaman;
  keterangan?: string;
}

export interface PinjamanBarang {
  id: string;
  anggotaId: string;
  namaAnggota: string;
  nomorAnggota: string;
  tanggalPinjam: string;
  namaBarang: string;
  hargaBarang: number;
  tenorBulan: number;
  angsuranPerBulan: number;
  totalDibayar: number;
  sisaPinjaman: number;
  status: StatusPinjaman;
  keterangan?: string;
}

export interface PengajuanPinjaman {
  id: string;
  anggotaId: string;
  namaAnggota: string;
  nomorAnggota: string;
  jenisPinjaman: 'Uang' | 'Barang';
  jumlahUang?: number;
  namaBarang?: string;
  estimasiHargaBarang?: number;
  tenorBulan: number;
  keperluan: string;
  tanggalPengajuan: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  catatanAdmin?: string;
  dibaca: boolean;
}

export interface PembukuanTokoItem {
  id: string;
  tanggal: string;
  saldoAwal: number;
  uraianKegiatan: string;
  debet: number; // Pemasukan
  kredit: number; // Pengeluaran
  saldoAkhir: number; // Saldo Awal + Debet - Kredit
  kategori?: string;
}

export interface PembukuanSeragamItem {
  id: string;
  tanggal: string;
  saldoAwal: number;
  uraianKegiatan: string;
  debet: number; // Pemasukan
  kredit: number; // Pengeluaran
  saldoAkhir: number; // Saldo Awal + Debet - Kredit
  kategori?: string;
}

export interface PengaturanAkun {
  username: string;
  password: string;
  namaAdmin: string;
  emailAdmin: string;
  noHpAdmin: string;
  namaKoperasi: string;
  instansiInduk?: string; // e.g. 'PEMERINTAH DAERAH PROVINSI JAWA BARAT / DINAS PENDIDIKAN / SMA NEGERI 19 BANDUNG'
  badanHukum: string;
  alamatKoperasi: string;
  teleponKoperasi: string;
  emailKoperasi?: string;
  websiteKoperasi?: string;
  tampilkanLogoKop?: boolean;
  tampilkanLogoKiriKop?: boolean;
  tampilkanLogoKananKop?: boolean;
  warnaGarisKop?: 'emerald' | 'navy' | 'slate' | 'gold';
  catatanKakiKop?: string;
  namaKetua: string;
  nipKetua?: string;
  namaBendahara: string;
  nipBendahara?: string;
  namaSekretaris?: string;
  nipSekretaris?: string;
  logoUrl: string; // Logo Kiri / Logo Utama
  logoKananUrl?: string; // Logo Kanan Kop Surat (misal Lambang Koperasi Indonesia / Logo SMAN 19 Bandung)
  terakhirDiperbarui?: string;
}

// -------------------------------------------------------------
// AI FINANCIAL REPORT GENERATION TYPES (FITUR KE-7: SAK EP KOMPARATIF)
// -------------------------------------------------------------
export interface ArusKasItem {
  keterangan: string;
  jumlah: number; // Nominal Tahun Berjalan
  jumlahLalu?: number; // Nominal Tahun Sebelumnya (Komparatif SAK EP)
}

export interface ArusKasReport {
  periode: string;
  tahunBerjalan?: string;
  tahunSebelumnya?: string;
  aktivitasOperasi: ArusKasItem[];
  totalKasOperasi: number;
  totalKasOperasiLalu?: number;
  aktivitasInvestasi: ArusKasItem[];
  totalKasInvestasi: number;
  totalKasInvestasiLalu?: number;
  aktivitasPendanaan: ArusKasItem[];
  totalKasPendanaan: number;
  totalKasPendanaanLalu?: number;
  kenaikanBersihKas: number;
  kenaikanBersihKasLalu?: number;
  saldoKasAwal: number;
  saldoKasAwalLalu?: number;
  saldoKasAkhir: number;
  saldoKasAkhirLalu?: number;
}

export interface PerubahanEkuitasReport {
  periode: string;
  tahunBerjalan?: string;
  tahunSebelumnya?: string;
  simpananPokokAwal: number;
  simpananPokokAwalLalu?: number;
  penambahanPokok: number;
  penambahanPokokLalu?: number;
  simpananPokokAkhir: number;
  simpananPokokAkhirLalu?: number;
  simpananWajibAwal: number;
  simpananWajibAwalLalu?: number;
  penambahanWajib: number;
  penambahanWajibLalu?: number;
  simpananWajibAkhir: number;
  simpananWajibAkhirLalu?: number;
  danaCadanganAwal: number;
  danaCadanganAwalLalu?: number;
  penambahanCadangan: number;
  penambahanCadanganLalu?: number;
  danaCadanganAkhir: number;
  danaCadanganAkhirLalu?: number;
  modalPenyertaanDonasi?: number;
  modalPenyertaanDonasiLalu?: number;
  shuTahunBerjalan: number;
  shuTahunBerjalanLalu?: number;
  pembagianShu: number;
  pembagianShuLalu?: number;
  totalEkuitasAwal: number;
  totalEkuitasAwalLalu?: number;
  totalEkuitasAkhir: number;
  totalEkuitasAkhirLalu?: number;
}

export interface CALKPosRincian {
  namaAkun: string;
  saldo: number; // Saldo Tahun Berjalan
  saldoLalu?: number; // Saldo Tahun Sebelumnya (Komparatif SAK EP)
  penjelasan: string;
}

export interface CALKReport {
  periode: string;
  tahunBerjalan?: string;
  tahunSebelumnya?: string;
  gambaranUmum: string;
  kebijakanAkuntansi: string[];
  penjelasanPosKeuangan: CALKPosRincian[];
  analisisKesehatan: {
    rasioLikuiditas: string;
    rasioSolvabilitas: string;
    rasioRentabilitas: string;
    evaluasiKinerja: string;
    rekomendasiStrategis: string[];
  };
}

export interface PosisiKeuanganItem {
  pos: string;
  kodeAkun?: string;
  tahunBerjalan: number;
  tahunSebelumnya: number;
  catatanCalk?: string;
}

export interface PosisiKeuanganReport {
  periode: string;
  tahunBerjalan?: string;
  tahunSebelumnya?: string;
  asetLancar: {
    kas: number;
    kasLalu: number;
    bank: number;
    bankLalu: number;
    totalKasDanBank: number;
    totalKasDanBankLalu: number;
    piutangUangAnggota: number;
    piutangUangAnggotaLalu: number;
    piutangBarang: number;
    piutangBarangLalu: number;
    persediaanPertokoan: number;
    persediaanPertokoanLalu: number;
    persediaanPsasAtribut: number;
    persediaanPsasAtributLalu: number;
    totalPersediaan: number;
    totalPersediaanLalu: number;
    totalAsetLancar: number;
    totalAsetLancarLalu: number;
  };
  asetTidakLancar: {
    asetTetapInventaris: number;
    asetTetapInventarisLalu: number;
    akumulasiPenyusutan: number;
    akumulasiPenyusutanLalu: number;
    nilaiBukuAsetTetap: number;
    nilaiBukuAsetTetapLalu: number;
    totalAsetTidakLancar: number;
    totalAsetTidakLancarLalu: number;
  };
  totalAset: number;
  totalAsetLalu: number;
  liabilitasJangkaPendek: {
    simpananSukarela: number;
    simpananSukarelaLalu: number;
    hutangUsahaPengadaan: number;
    hutangUsahaPengadaanLalu: number;
    bebanAkrualHonor: number;
    bebanAkrualHonorLalu: number;
    totalLiabilitas: number;
    totalLiabilitasLalu: number;
  };
  ekuitas: {
    simpananPokok: number;
    simpananPokokLalu: number;
    simpananWajib: number;
    simpananWajibLalu: number;
    danaCadangan: number;
    danaCadanganLalu: number;
    hibahDonasi: number;
    hibahDonasiLalu: number;
    subtotalEkuitasSebelumShu: number;
    subtotalEkuitasSebelumShuLalu: number;
    shuTahunBerjalan: number;
    shuTahunBerjalanLalu: number;
    totalEkuitas: number;
    totalEkuitasLalu: number;
  };
  totalLiabilitasDanEkuitas: number;
  totalLiabilitasDanEkuitasLalu: number;
}

export interface PerhitunganHasilUsahaReport {
  periode: string;
  tahunBerjalan?: string;
  tahunSebelumnya?: string;
  pendapatan: {
    jasaPinjamanUang: number;
    jasaPinjamanUangLalu: number;
    jasaPinjamanBarang: number;
    jasaPinjamanBarangLalu: number;
    penjualanToko: number;
    penjualanTokoLalu: number;
    penjualanPsasSeragam: number;
    penjualanPsasSeragamLalu: number;
    pendapatanLain: number;
    pendapatanLainLalu: number;
    totalPendapatan: number;
    totalPendapatanLalu: number;
  };
  beban: {
    pokokTokoSeragam: number;
    pokokTokoSeragamLalu: number;
    operasionalDanHonor: number;
    operasionalDanHonorLalu: number;
    organisasiDanRat: number;
    organisasiDanRatLalu: number;
    penyusutanInventaris: number;
    penyusutanInventarisLalu: number;
    totalBeban: number;
    totalBebanLalu: number;
  };
  sisaHasilUsaha: number;
  sisaHasilUsahaLalu: number;
}

export interface RekonsiliasiItem {
  komponen: string;
  angkaLPJ: number | string;
  angkaSAKEP: number | string;
  selisih: number;
  status: 'COCOK' | 'SESUAI' | 'REKONSILIASI_SAH';
  keterangan: string;
}

export interface RekonsiliasiReport {
  keterangan: string;
  items: RekonsiliasiItem[];
  kesimpulan: string;
}

export interface GeneratedFinancialReport {
  id: string;
  tanggalDibuat: string;
  periode: string;
  sumberData: string;
  namaFileSumber?: string;
  ringkasanEksekutif: string;
  posisiKeuangan?: PosisiKeuanganReport;
  perhitunganHasilUsaha?: PerhitunganHasilUsahaReport;
  arusKas: ArusKasReport;
  perubahanEkuitas: PerubahanEkuitasReport;
  calk: CALKReport;
  rekonsiliasiLPJ?: RekonsiliasiReport;
}

// -------------------------------------------------------------
// FITUR KE-6: UPLOAD LAPORAN KEUANGAN (POSISI KEUANGAN & PHU LPJ)
// -------------------------------------------------------------
export interface AkunBarisLaporan {
  no: number | string;
  namaAkun: string;
  nilaiBerjalan: number;
  nilaiLalu: number;
  keterangan?: string;
}

export interface UploadedPosisiKeuanganData {
  id: string;
  tahunBerjalan: string;
  tahunLalu: string;
  terakhirDiperbarui: string;
  asetLancar: AkunBarisLaporan[];
  penyertaan: AkunBarisLaporan[];
  asetTetap: AkunBarisLaporan[];
  liabilitas: AkunBarisLaporan[];
  ekuitas: AkunBarisLaporan[];
  shuTahunBerjalan: {
    nilaiBerjalan: number;
    nilaiLalu: number;
  };
}

export interface DistribusiSHULPJItem {
  namaPos: string;
  persentase: number; // e.g. 5, 30, 34, 6, 10, 5, 5, 5
  nilaiBerjalan: number;
  nilaiLalu: number;
}

export interface UploadedPHUData {
  id: string;
  tahunBerjalan: string;
  tahunLalu: string;
  terakhirDiperbarui: string;
  pendapatan: AkunBarisLaporan[];
  beban: AkunBarisLaporan[];
  distribusiSHU: DistribusiSHULPJItem[];
}


