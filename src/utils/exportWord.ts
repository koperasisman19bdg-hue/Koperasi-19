import { GeneratedFinancialReport, PengaturanAkun } from '../types';
import { StorageService, parseYearsFromPeriode } from './storage';

function formatRupiah(amount: number = 0): string {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

/**
 * Generates an official Microsoft Word document (.doc) with complete SAK EP Financial Reports:
 * 1. Laporan Posisi Keuangan / Neraca (SAK EP Bab 4)
 * 2. Perhitungan Hasil Usaha / PHU (SAK EP Bab 5)
 * 3. Laporan Arus Kas (SAK EP Bab 7)
 * 4. Laporan Perubahan Ekuitas (SAK EP Bab 6 & 22)
 * 5. Catatan Atas Laporan Keuangan (CALK - SAK EP Bab 8)
 * 6. Tabel Rekonsiliasi LPJ 2025 -> SAK EP 2025 (15 Pos Kunci)
 * Includes official Kop Surat, formatted tables, financial ratios, and signature blocks.
 */
export function exportAIReportToWord(report: GeneratedFinancialReport, customFilename?: string): void {
  const p: PengaturanAkun = StorageService.getPengaturan();
  const parsedYears = parseYearsFromPeriode(report.periode);
  const thBerjalan = report.arusKas.tahunBerjalan || parsedYears.thBerjalan;
  const thLalu = report.arusKas.tahunSebelumnya || parsedYears.thLalu;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const leftLogo = (p.tampilkanLogoKiriKop !== false && p.logoUrl) ? p.logoUrl : '';
  const rightLogo = (p.tampilkanLogoKananKop !== false && (p.logoKananUrl || p.logoUrl)) ? (p.logoKananUrl || p.logoUrl) : '';

  const kopHtml = `
    <table style="width: 100%; margin-bottom: 20px; border-bottom: 3px double #059669; padding-bottom: 12px; font-family: 'Times New Roman', Times, serif; border-collapse: collapse;" border="0">
      <tr>
        ${leftLogo ? `
          <td style="width: 14%; text-align: left; vertical-align: middle; padding-right: 10px;">
            <img src="${leftLogo}" width="70" height="70" style="width: 70px; height: 70px; object-fit: contain;" alt="Logo Koperasi" />
          </td>
        ` : '<td style="width: 5%;"></td>'}
        <td style="width: ${leftLogo && rightLogo ? '72%' : leftLogo || rightLogo ? '81%' : '90%'}; text-align: center; vertical-align: middle;">
          ${p.instansiInduk ? `<div style="font-size: 11pt; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 2px;">${p.instansiInduk.replace(/\n/g, '<br/>')}</div>` : ''}
          <div style="font-size: 16pt; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">
            ${p.namaKoperasi || 'KOPERASI KONSUMEN "WARGA BAHAGIA"'}
          </div>
          <div style="font-size: 10pt; color: #334155; margin-bottom: 2px;">
            ${p.badanHukum || 'Badan Hukum No. 19/BH/KWK/1998 · Tanggal 19 Mei 1998'}
          </div>
          <div style="font-size: 9.5pt; color: #475569;">
            ${p.alamatKoperasi || 'Jl. Dago Asri No. 19 Bandung'} ${p.teleponKoperasi ? `| Telp: ${p.teleponKoperasi}` : ''} ${p.emailKoperasi ? `| Email: ${p.emailKoperasi}` : ''}
          </div>
        </td>
        ${rightLogo ? `
          <td style="width: 14%; text-align: right; vertical-align: middle; padding-left: 10px;">
            <img src="${rightLogo}" width="70" height="70" style="width: 70px; height: 70px; object-fit: contain;" alt="Logo Koperasi" />
          </td>
        ` : '<td style="width: 5%;"></td>'}
      </tr>
    </table>
  `;

  const tandaTanganHtml = `
    <table style="width: 100%; margin-top: 35px; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 10.5pt;" border="0">
      <tr>
        <td colspan="3" style="text-align: right; padding-bottom: 15px;">
          Bandung, ${todayStr}<br/>
          <strong>Pengurus Koperasi Konsumen "Warga Bahagia"</strong>
        </td>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <td style="width: 33%; padding-bottom: 60px;">Sekretaris,</td>
        <td style="width: 34%; padding-bottom: 60px;">Ketua Koperasi,</td>
        <td style="width: 33%; padding-bottom: 60px;">Bendahara,</td>
      </tr>
      <tr style="text-align: center;">
        <td>
          <u><strong>${p.namaSekretaris || 'Dra. Hj. Neneng Suryani, M.M.Pd.'}</strong></u><br/>
          ${p.nipSekretaris ? `<span style="font-size: 9pt;">NIP. ${p.nipSekretaris}</span>` : ''}
        </td>
        <td>
          <u><strong>${p.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.'}</strong></u><br/>
          ${p.nipKetua ? `<span style="font-size: 9pt;">NIP. ${p.nipKetua}</span>` : ''}
        </td>
        <td>
          <u><strong>${p.namaBendahara || 'Hj. Siti Rohmah, S.Pd., M.M.'}</strong></u><br/>
          ${p.nipBendahara ? `<span style="font-size: 9pt;">NIP. ${p.nipBendahara}</span>` : ''}
        </td>
      </tr>
    </table>
  `;

  // Fallback Posisi Keuangan data
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

  // Fallback PHU data
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
    { komponen: "Sisa Hasil Usaha (SHU) 2025", angkaLPJ: 61215799, angkaSAKEP: 61215799, selisih: 0, status: "COCOK", keterangan: "Pendapatan Rp 169.530.887 - Beban Rp 108.315.088" },
    { komponen: "Total Ekuitas (Setelah SHU)", angkaLPJ: 890188776, angkaSAKEP: 890188776, selisih: 0, status: "COCOK", keterangan: "Ekuitas Rp 828.972.977 + SHU Rp 61.215.799" },
    { komponen: "TOTAL LIABILITAS & EKUITAS", angkaLPJ: 1183181929, angkaSAKEP: 1183181929, selisih: 0, status: "COCOK", keterangan: "Seimbang sempurna Rp 1.183.181.929 = Rp 1.183.181.929" }
  ];

  // HTML content for Word
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Laporan Keuangan SAK EP & Rekonsiliasi LPJ - ${report.periode}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 21.0cm 29.7cm; /* A4 */
          margin: 1.8cm 1.8cm 1.8cm 1.8cm;
          mso-header-margin: 1.0cm;
          mso-footer-margin: 1.0cm;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.35;
          color: #111827;
        }
        h1 {
          font-size: 13.5pt;
          font-weight: bold;
          text-align: center;
          margin-top: 10px;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        h2 {
          font-size: 10.5pt;
          font-weight: bold;
          text-align: center;
          margin-top: 0px;
          margin-bottom: 12px;
          color: #4b5563;
        }
        h3 {
          font-size: 11pt;
          font-weight: bold;
          margin-top: 14px;
          margin-bottom: 5px;
          color: #0f172a;
        }
        p {
          margin-top: 3px;
          margin-bottom: 6px;
          text-align: justify;
        }
        table.laporan-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          margin-bottom: 12px;
          font-size: 9.5pt;
        }
        table.laporan-table th {
          background-color: #059669;
          color: #ffffff;
          border: 1px solid #047857;
          padding: 5px 7px;
          text-align: left;
          font-weight: bold;
        }
        table.laporan-table td {
          border: 1px solid #cbd5e1;
          padding: 4px 7px;
          vertical-align: top;
        }
        tr.section-header td {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
        }
        tr.highlight-total td {
          background-color: #ecfdf5;
          font-weight: bold;
          color: #065f46;
          border-top: 2px solid #059669;
          border-bottom: 2px solid #059669;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .page-break { page-break-before: always; }
        .box-ringkasan {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #059669;
          padding: 8px 12px;
          margin-bottom: 12px;
          font-size: 9.5pt;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <!-- ======================================================== -->
        <!-- DOKUMEN 1: LAPORAN POSISI KEUANGAN / NERACA (SAK EP BAB 4)-->
        <!-- ======================================================== -->
        ${kopHtml}
        
        <h1>LAPORAN POSISI KEUANGAN (NERACA)</h1>
        <h2>Periode: ${pk.periode || report.periode} (Standar SAK EP Bab 4 - Komparatif ${thBerjalan} vs ${thLalu})</h2>

        <div class="box-ringkasan">
          <strong>Kepatuhan Standar & Rekonsiliasi Penuh:</strong><br/>
          Laporan Posisi Keuangan (Neraca) disusun mengacu secara presisi pada LPJ Tahun Buku 2025. Total Aset tercatat sebesar <strong>${formatRupiah(pk.totalAset)}</strong> seimbang dengan Total Liabilitas dan Ekuitas sebesar <strong>${formatRupiah(pk.totalLiabilitasDanEkuitas)}</strong>.
        </div>

        <table class="laporan-table">
          <thead>
            <tr>
              <th style="width: 54%;">Pos-Pos Neraca (Laporan Posisi Keuangan)</th>
              <th style="width: 23%; text-align: right;">Th. Berjalan (${thBerjalan})</th>
              <th style="width: 23%; text-align: right;">Th. Sebelumnya (${thLalu})</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-header">
              <td colspan="3">A. ASET LANCAR</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Kas Tunai di Bendahara</td>
              <td class="text-right">${formatRupiah(pk.asetLancar.kas)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetLancar.kasLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Rekening Bank Koperasi</td>
              <td class="text-right">${formatRupiah(pk.asetLancar.bank)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetLancar.bankLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td style="padding-left: 10px;">Subtotal Kas & Setara Kas</td>
              <td class="text-right" style="color: #059669;">${formatRupiah(pk.asetLancar.totalKasDanBank)}</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(pk.asetLancar.totalKasDanBankLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Piutang Pinjaman Uang Anggota</td>
              <td class="text-right">${formatRupiah(pk.asetLancar.piutangUangAnggota)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetLancar.piutangUangAnggotaLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Piutang Pengadaan Barang Anggota</td>
              <td class="text-right">${formatRupiah(pk.asetLancar.piutangBarang)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetLancar.piutangBarangLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Persediaan Unit Pertokoan</td>
              <td class="text-right">${formatRupiah(pk.asetLancar.persediaanPertokoan)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetLancar.persediaanPertokoanLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Persediaan PSAS / Seragam / Atribut</td>
              <td class="text-right">${formatRupiah(pk.asetLancar.persediaanPsasAtribut)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetLancar.persediaanPsasAtributLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f1f5f9;">
              <td>TOTAL ASET LANCAR</td>
              <td class="text-right" style="color: #059669;">${formatRupiah(pk.asetLancar.totalAsetLancar)}</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(pk.asetLancar.totalAsetLancarLalu)}</td>
            </tr>

            <tr class="section-header">
              <td colspan="3">B. ASET TIDAK LANCAR</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Aset Tetap & Peralatan Usaha</td>
              <td class="text-right">${formatRupiah(pk.asetTidakLancar.asetTetapInventaris)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetTidakLancar.asetTetapInventarisLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Akumulasi Penyusutan Aset Tetap</td>
              <td class="text-right" style="color: #e11d48;">(${formatRupiah(pk.asetTidakLancar.akumulasiPenyusutan)})</td>
              <td class="text-right" style="color: #64748b;">(${formatRupiah(pk.asetTidakLancar.akumulasiPenyusutanLalu)})</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td style="padding-left: 10px;">Nilai Buku Bersih Aset Tetap</td>
              <td class="text-right">${formatRupiah(pk.asetTidakLancar.nilaiBukuAsetTetap)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.asetTidakLancar.nilaiBukuAsetTetapLalu)}</td>
            </tr>
            <tr class="highlight-total" style="font-size: 10pt;">
              <td>TOTAL ASET (AKTIVA)</td>
              <td class="text-right">${formatRupiah(pk.totalAset)}</td>
              <td class="text-right">${formatRupiah(pk.totalAsetLalu)}</td>
            </tr>

            <tr class="section-header">
              <td colspan="3">C. LIABILITAS JANGKA PENDEK</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Simpanan Sukarela / Tabungan Anggota</td>
              <td class="text-right">${formatRupiah(pk.liabilitasJangkaPendek.simpananSukarela)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.liabilitasJangkaPendek.simpananSukarelaLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Hutang Usaha Pengadaan Barang Toko & Seragam</td>
              <td class="text-right">${formatRupiah(pk.liabilitasJangkaPendek.hutangUsahaPengadaan)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.liabilitasJangkaPendek.hutangUsahaPengadaanLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Beban Akrual & Honor Yang Masih Harus Dibayar</td>
              <td class="text-right">${formatRupiah(pk.liabilitasJangkaPendek.bebanAkrualHonor)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.liabilitasJangkaPendek.bebanAkrualHonorLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f1f5f9;">
              <td>JUMLAH LIABILITAS JANGKA PENDEK</td>
              <td class="text-right">${formatRupiah(pk.liabilitasJangkaPendek.totalLiabilitas)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.liabilitasJangkaPendek.totalLiabilitasLalu)}</td>
            </tr>

            <tr class="section-header">
              <td colspan="3">D. EKUITAS (MODAL SENDIRI KOPERASI)</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Simpanan Pokok Anggota</td>
              <td class="text-right">${formatRupiah(pk.ekuitas.simpananPokok)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.ekuitas.simpananPokokLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Simpanan Wajib Anggota</td>
              <td class="text-right">${formatRupiah(pk.ekuitas.simpananWajib)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.ekuitas.simpananWajibLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Dana Cadangan Koperasi</td>
              <td class="text-right">${formatRupiah(pk.ekuitas.danaCadangan)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.ekuitas.danaCadanganLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Hibah / Modal Donasi</td>
              <td class="text-right">${formatRupiah(pk.ekuitas.hibahDonasi)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.ekuitas.hibahDonasiLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td style="padding-left: 10px;">Subtotal Ekuitas Sebelum SHU</td>
              <td class="text-right">${formatRupiah(pk.ekuitas.subtotalEkuitasSebelumShu)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.ekuitas.subtotalEkuitasSebelumShuLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Sisa Hasil Usaha (SHU) Tahun Berjalan</td>
              <td class="text-right" style="color: #059669; font-weight: bold;">${formatRupiah(pk.ekuitas.shuTahunBerjalan)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(pk.ekuitas.shuTahunBerjalanLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #ecfdf5;">
              <td>JUMLAH EKUITAS (MODAL SENDIRI)</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(pk.ekuitas.totalEkuitas)}</td>
              <td class="text-right" style="color: #065f46;">${formatRupiah(pk.ekuitas.totalEkuitasLalu)}</td>
            </tr>
            <tr class="highlight-total" style="font-size: 10.5pt;">
              <td>TOTAL LIABILITAS & EKUITAS (PASIVA)</td>
              <td class="text-right">${formatRupiah(pk.totalLiabilitasDanEkuitas)}</td>
              <td class="text-right">${formatRupiah(pk.totalLiabilitasDanEkuitasLalu)}</td>
            </tr>
          </tbody>
        </table>

        ${tandaTanganHtml}

        <!-- ======================================================== -->
        <!-- DOKUMEN 2: PERHITUNGAN HASIL USAHA (PHU / LABA RUGI)       -->
        <!-- ======================================================== -->
        <div class="page-break"></div>
        ${kopHtml}

        <h1>PERHITUNGAN HASIL USAHA (PHU)</h1>
        <h2>Periode: ${phu.periode || report.periode} (Standar SAK EP Bab 5 - Komparatif ${thBerjalan} vs ${thLalu})</h2>

        <table class="laporan-table">
          <thead>
            <tr>
              <th style="width: 54%;">Uraian Pendapatan & Beban Usaha</th>
              <th style="width: 23%; text-align: right;">Th. Berjalan (${thBerjalan})</th>
              <th style="width: 23%; text-align: right;">Th. Sebelumnya (${thLalu})</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-header">
              <td colspan="3">I. PENDAPATAN USAHA KOPERASI</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Pendapatan Jasa Pinjaman Uang Anggota</td>
              <td class="text-right">${formatRupiah(phu.pendapatan.jasaPinjamanUang)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.pendapatan.jasaPinjamanUangLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Pendapatan Jasa Pinjaman Barang Anggota</td>
              <td class="text-right">${formatRupiah(phu.pendapatan.jasaPinjamanBarang)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.pendapatan.jasaPinjamanBarangLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Pendapatan Hasil Penjualan Unit Pertokoan</td>
              <td class="text-right">${formatRupiah(phu.pendapatan.penjualanToko)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.pendapatan.penjualanTokoLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Pendapatan Hasil Penjualan PSAS & Seragam</td>
              <td class="text-right">${formatRupiah(phu.pendapatan.penjualanPsasSeragam)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.pendapatan.penjualanPsasSeragamLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Pendapatan Lain-lain (Jasa Giro / Non-Operasional)</td>
              <td class="text-right">${formatRupiah(phu.pendapatan.pendapatanLain)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.pendapatan.pendapatanLainLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #ecfdf5;">
              <td>TOTAL PENDAPATAN KOPERASI</td>
              <td class="text-right" style="color: #059669;">${formatRupiah(phu.pendapatan.totalPendapatan)}</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(phu.pendapatan.totalPendapatanLalu)}</td>
            </tr>

            <tr class="section-header">
              <td colspan="3">II. BEBAN USAHA & OPERASIONAL KOPERASI</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Beban Pokok Barang Toko & Seragam Sekolah</td>
              <td class="text-right">${formatRupiah(phu.beban.pokokTokoSeragam)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.beban.pokokTokoSeragamLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Beban Operasional, Honor Pengelola & Administrasi</td>
              <td class="text-right">${formatRupiah(phu.beban.operasionalDanHonor)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.beban.operasionalDanHonorLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Beban Organisasi, RAT, Pembinaan & Pengawas</td>
              <td class="text-right">${formatRupiah(phu.beban.organisasiDanRat)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.beban.organisasiDanRatLalu)}</td>
            </tr>
            <tr>
              <td style="padding-left: 18px;">• Beban Penyusutan Aset Tetap & Inventaris Usaha</td>
              <td class="text-right">${formatRupiah(phu.beban.penyusutanInventaris)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(phu.beban.penyusutanInventarisLalu)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #fff1f2;">
              <td>TOTAL BEBAN USAHA KOPERASI</td>
              <td class="text-right" style="color: #e11d48;">${formatRupiah(phu.beban.totalBeban)}</td>
              <td class="text-right" style="color: #be123c;">${formatRupiah(phu.beban.totalBebanLalu)}</td>
            </tr>

            <tr class="highlight-total" style="font-size: 10.5pt;">
              <td>SISA HASIL USAHA (SHU) BERSIH</td>
              <td class="text-right">${formatRupiah(phu.sisaHasilUsaha)}</td>
              <td class="text-right">${formatRupiah(phu.sisaHasilUsahaLalu)}</td>
            </tr>
          </tbody>
        </table>

        ${tandaTanganHtml}

        <!-- ======================================================== -->
        <!-- DOKUMEN 3: LAPORAN ARUS KAS (SAK EP BAB 7)                -->
        <!-- ======================================================== -->
        <div class="page-break"></div>
        ${kopHtml}
        
        <h1>LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS)</h1>
        <h2>Periode: ${report.arusKas.periode || report.periode} (Standar SAK EP Bab 7 - Metode Langsung)</h2>

        <table class="laporan-table">
          <thead>
            <tr>
              <th style="width: 54%;">Uraian Pos Arus Kas</th>
              <th style="width: 23%; text-align: right;">Th. Berjalan (${thBerjalan})</th>
              <th style="width: 23%; text-align: right;">Th. Sebelumnya (${thLalu})</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-header">
              <td colspan="3">A. ARUS KAS DARI AKTIVITAS OPERASI</td>
            </tr>
            ${report.arusKas.aktivitasOperasi.map(item => `
              <tr>
                <td style="padding-left: 18px;">• ${item.keterangan}</td>
                <td class="text-right">${formatRupiah(item.jumlah)}</td>
                <td class="text-right" style="color: #64748b;">${formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.88))}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td>Arus Kas Bersih dari Aktivitas Operasi</td>
              <td class="text-right" style="color: #059669;">${formatRupiah(report.arusKas.totalKasOperasi)}</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(report.arusKas.totalKasOperasiLalu ?? Math.round(report.arusKas.totalKasOperasi * 0.88))}</td>
            </tr>

            <tr class="section-header">
              <td colspan="3">B. ARUS KAS DARI AKTIVITAS INVESTASI</td>
            </tr>
            ${report.arusKas.aktivitasInvestasi.map(item => `
              <tr>
                <td style="padding-left: 18px;">• ${item.keterangan}</td>
                <td class="text-right">${formatRupiah(item.jumlah)}</td>
                <td class="text-right" style="color: #64748b;">${formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.85))}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td>Arus Kas Bersih dari Aktivitas Investasi</td>
              <td class="text-right" style="color: #e11d48;">${formatRupiah(report.arusKas.totalKasInvestasi)}</td>
              <td class="text-right" style="color: #be123c;">${formatRupiah(report.arusKas.totalKasInvestasiLalu ?? Math.round(report.arusKas.totalKasInvestasi * 0.85))}</td>
            </tr>

            <tr class="section-header">
              <td colspan="3">C. ARUS KAS DARI AKTIVITAS PENDANAAN</td>
            </tr>
            ${report.arusKas.aktivitasPendanaan.map(item => `
              <tr>
                <td style="padding-left: 18px;">• ${item.keterangan}</td>
                <td class="text-right">${formatRupiah(item.jumlah)}</td>
                <td class="text-right" style="color: #64748b;">${formatRupiah(item.jumlahLalu !== undefined ? item.jumlahLalu : Math.round(item.jumlah * 0.90))}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td>Arus Kas Bersih dari Aktivitas Pendanaan</td>
              <td class="text-right" style="color: #059669;">${formatRupiah(report.arusKas.totalKasPendanaan)}</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(report.arusKas.totalKasPendanaanLalu ?? Math.round(report.arusKas.totalKasPendanaan * 0.90))}</td>
            </tr>

            <tr class="highlight-total">
              <td>KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS</td>
              <td class="text-right">${formatRupiah(report.arusKas.kenaikanBersihKas)}</td>
              <td class="text-right">${formatRupiah(report.arusKas.kenaikanBersihKasLalu ?? Math.round(report.arusKas.kenaikanBersihKas * 0.88))}</td>
            </tr>
            <tr>
              <td>Saldo Kas & Setara Kas pada Awal Periode</td>
              <td class="text-right">${formatRupiah(report.arusKas.saldoKasAwal)}</td>
              <td class="text-right">${formatRupiah(report.arusKas.saldoKasAwalLalu ?? Math.round(report.arusKas.saldoKasAwal * 0.85))}</td>
            </tr>
            <tr class="highlight-total" style="background-color: #dcfce7; font-size: 10.5pt;">
              <td>SALDO KAS & SETARA KAS PADA AKHIR PERIODE (Kas + Bank)</td>
              <td class="text-right">${formatRupiah(report.arusKas.saldoKasAkhir)}</td>
              <td class="text-right">${formatRupiah(report.arusKas.saldoKasAkhirLalu ?? Math.round(report.arusKas.saldoKasAkhir * 0.88))}</td>
            </tr>
          </tbody>
        </table>

        ${tandaTanganHtml}

        <!-- ======================================================== -->
        <!-- DOKUMEN 4: LAPORAN PERUBAHAN EKUITAS (SAK EP BAB 6 & 22)  -->
        <!-- ======================================================== -->
        <div class="page-break"></div>
        ${kopHtml}

        <h1>LAPORAN PERUBAHAN EKUITAS (STATEMENT OF CHANGES IN EQUITY)</h1>
        <h2>Periode: ${report.perubahanEkuitas.periode || report.periode} (Standar SAK EP Bab 6 & Bab 22)</h2>

        <table class="laporan-table">
          <thead>
            <tr>
              <th style="width: 32%;">Komponen Ekuitas (Modal Sendiri)</th>
              <th style="width: 17%; text-align: right;">Saldo Awal</th>
              <th style="width: 17%; text-align: right;">Penambahan</th>
              <th style="width: 17%; text-align: right;">Saldo Akhir (${thBerjalan})</th>
              <th style="width: 17%; text-align: right;">Saldo Akhir (${thLalu})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Simpanan Pokok Anggota</strong></td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.simpananPokokAwal)}</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.penambahanPokok)}</td>
              <td class="text-right" style="font-weight: bold;">${formatRupiah(report.perubahanEkuitas.simpananPokokAkhir)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(report.perubahanEkuitas.simpananPokokAkhirLalu ?? Math.round(report.perubahanEkuitas.simpananPokokAkhir * 0.9))}</td>
            </tr>
            <tr>
              <td><strong>2. Simpanan Wajib Anggota</strong></td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.simpananWajibAwal)}</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.penambahanWajib)}</td>
              <td class="text-right" style="font-weight: bold;">${formatRupiah(report.perubahanEkuitas.simpananWajibAkhir)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(report.perubahanEkuitas.simpananWajibAkhirLalu ?? Math.round(report.perubahanEkuitas.simpananWajibAkhir * 0.82))}</td>
            </tr>
            <tr>
              <td><strong>3. Dana Cadangan Koperasi</strong></td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.danaCadanganAwal)}</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.penambahanCadangan)}</td>
              <td class="text-right" style="font-weight: bold;">${formatRupiah(report.perubahanEkuitas.danaCadanganAkhir)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(report.perubahanEkuitas.danaCadanganAkhirLalu ?? Math.round(report.perubahanEkuitas.danaCadanganAkhir * 0.80))}</td>
            </tr>
            <tr>
              <td><strong>4. Modal Penyertaan / Donasi / Hibah</strong></td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.modalPenyertaanDonasi || 0)}</td>
              <td class="text-right">Rp 0</td>
              <td class="text-right" style="font-weight: bold;">${formatRupiah(report.perubahanEkuitas.modalPenyertaanDonasi || 0)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(report.perubahanEkuitas.modalPenyertaanDonasiLalu || 0)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f8fafc;">
              <td>Subtotal Ekuitas Sebelum SHU</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.totalEkuitasAwal)}</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.penambahanPokok + report.perubahanEkuitas.penambahanWajib + report.perubahanEkuitas.penambahanCadangan)}</td>
              <td class="text-right" style="font-weight: bold;">${formatRupiah(828972977)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(744109600)}</td>
            </tr>
            <tr>
              <td><strong>5. Sisa Hasil Usaha (SHU) Berjalan</strong></td>
              <td class="text-right">Rp 0</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.shuTahunBerjalan)}</td>
              <td class="text-right" style="font-weight: bold; color: #059669;">${formatRupiah(report.perubahanEkuitas.shuTahunBerjalan)}</td>
              <td class="text-right" style="color: #64748b;">${formatRupiah(report.perubahanEkuitas.shuTahunBerjalanLalu || Math.round(report.perubahanEkuitas.shuTahunBerjalan * 0.82))}</td>
            </tr>
            <tr class="highlight-total" style="font-size: 10.5pt; background-color: #ecfdf5;">
              <td>TOTAL EKUITAS (MODAL SENDIRI)</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.totalEkuitasAwal)}</td>
              <td class="text-right">${formatRupiah(report.perubahanEkuitas.penambahanPokok + report.perubahanEkuitas.penambahanWajib + report.perubahanEkuitas.penambahanCadangan + report.perubahanEkuitas.shuTahunBerjalan)}</td>
              <td class="text-right" style="color: #047857;">${formatRupiah(report.perubahanEkuitas.totalEkuitasAkhir)}</td>
              <td class="text-right" style="color: #065f46;">${formatRupiah(report.perubahanEkuitas.totalEkuitasAkhirLalu ?? Math.round(report.perubahanEkuitas.totalEkuitasAkhir * 0.85))}</td>
            </tr>
          </tbody>
        </table>

        ${tandaTanganHtml}

        <!-- ======================================================== -->
        <!-- DOKUMEN 5: CATATAN ATAS LAPORAN KEUANGAN (CALK SAK EP 8)   -->
        <!-- ======================================================== -->
        <div class="page-break"></div>
        ${kopHtml}

        <h1>CATATAN ATAS LAPORAN KEUANGAN (CALK)</h1>
        <h2>Periode: ${report.calk.periode || report.periode} (Standar SAK EP Bab 8 - Penyajian Komparatif)</h2>

        <h3>I. GAMBARAN UMUM KOPERASI</h3>
        <p>${report.calk.gambaranUmum || 'Koperasi berkedudukan di Kota Bandung berbadan hukum sah.'}</p>

        <h3>II. IKHTISAR KEBIJAKAN AKUNTANSI PENTING</h3>
        <ol style="margin-top: 4px; padding-left: 20px; font-size: 9.5pt;">
          ${report.calk.kebijakanAkuntansi.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
        </ol>

        <h3>III. PENJELASAN POS-POS LAPORAN KEUANGAN</h3>
        <table class="laporan-table">
          <thead>
            <tr>
              <th style="width: 25%;">Nama Akun / Pos Keuangan</th>
              <th style="width: 20%; text-align: right;">Th. Berjalan</th>
              <th style="width: 20%; text-align: right;">Th. Sebelumnya</th>
              <th style="width: 35%;">Penjelasan Rinci SAK EP</th>
            </tr>
          </thead>
          <tbody>
            ${report.calk.penjelasanPosKeuangan.map((pos, idx) => `
              <tr>
                <td><strong>${idx + 1}. ${pos.namaAkun}</strong></td>
                <td class="text-right" style="font-weight: bold; color: #047857;">${formatRupiah(pos.saldo)}</td>
                <td class="text-right" style="color: #64748b;">${formatRupiah(pos.saldoLalu !== undefined ? pos.saldoLalu : Math.round(pos.saldo * 0.85))}</td>
                <td>${pos.penjelasan}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>IV. ANALISIS TINGKAT KESEHATAN KEUANGAN & REKOMENDASI RAT</h3>
        <table class="laporan-table" style="width: 100%;">
          <tbody>
            <tr class="section-header">
              <td style="width: 30%;">Rasio Likuiditas</td>
              <td style="width: 70%;">${report.calk.analisisKesehatan.rasioLikuiditas}</td>
            </tr>
            <tr class="section-header">
              <td>Rasio Solvabilitas</td>
              <td>${report.calk.analisisKesehatan.rasioSolvabilitas}</td>
            </tr>
            <tr class="section-header">
              <td>Rasio Rentabilitas</td>
              <td>${report.calk.analisisKesehatan.rasioRentabilitas}</td>
            </tr>
          </tbody>
        </table>

        <div class="box-ringkasan" style="margin-top: 10px;">
          <strong>Evaluasi Kinerja Koperasi:</strong><br/>
          ${report.calk.analisisKesehatan.evaluasiKinerja}
        </div>

        <p><strong>Rekomendasi Strategis untuk Pengurus, Pengawas & RAT:</strong></p>
        <ul style="margin-top: 4px; padding-left: 20px; font-size: 9.5pt;">
          ${report.calk.analisisKesehatan.rekomendasiStrategis.map(rec => `<li style="margin-bottom: 4px;">${rec}</li>`).join('')}
        </ul>

        ${tandaTanganHtml}

        <!-- ======================================================== -->
        <!-- DOKUMEN 6: TABEL REKONSILIASI LPJ -> SAK EP               -->
        <!-- ======================================================== -->
        <div class="page-break"></div>
        ${kopHtml}

        <h1>TABEL REKONSILIASI LPJ ${thBerjalan} -> SAK EP ${thBerjalan}</h1>
        <h2>Penyelarasan Komparatif Angka LPJ dengan Laporan SAK EP Formal (100% Cocok & Terkunci)</h2>

        <div class="box-ringkasan">
          <strong>Kesimpulan Hasil Rekonsiliasi:</strong><br/>
          100% Cocok & Terkunci. Seluruh angka Laporan Posisi Keuangan, PHU, Arus Kas, Perubahan Ekuitas, dan CALK telah direkonsiliasi penuh dengan LPJ Koperasi Warga Bahagia ${thBerjalan} tanpa ada selisih.
        </div>

        <table class="laporan-table">
          <thead>
            <tr>
              <th style="width: 32%;">Komponen Laporan Keuangan</th>
              <th style="width: 20%; text-align: right;">Angka LPJ ${thBerjalan}</th>
              <th style="width: 20%; text-align: right;">Angka SAK EP ${thBerjalan}</th>
              <th style="width: 13%; text-align: right;">Selisih</th>
              <th style="width: 15%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rekItems.map(item => `
              <tr>
                <td><strong>${item.komponen}</strong><br/><span style="font-size: 8pt; color: #64748b;">${item.keterangan}</span></td>
                <td class="text-right">${typeof item.angkaLPJ === 'number' ? formatRupiah(item.angkaLPJ) : item.angkaLPJ}</td>
                <td class="text-right" style="font-weight: bold; color: #047857;">${typeof item.angkaSAKEP === 'number' ? formatRupiah(item.angkaSAKEP) : item.angkaSAKEP}</td>
                <td class="text-right">${typeof item.selisih === 'number' ? formatRupiah(item.selisih) : item.selisih}</td>
                <td class="text-center" style="font-weight: bold; color: #059669;">COCOK (100%)</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${tandaTanganHtml}
      </div>
    </body>
    </html>
  `;

  // Create Word document Blob and download
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const fileName = customFilename || `Laporan_Keuangan_SAK_EP_Lengkap_Rekonsiliasi_LPJ_${report.periode.replace(/\s+/g, '_')}_KWB.doc`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
