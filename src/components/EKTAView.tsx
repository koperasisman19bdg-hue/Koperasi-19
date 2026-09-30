import React, { useRef, useState, useEffect } from 'react';
import { Anggota, PengaturanAkun } from '../types';
import { Printer, Download, X, QrCode, Shield, CheckCircle, Award, Sparkles, Building2, UserCheck } from 'lucide-react';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import { StorageService } from '../utils/storage';
import { exportEKAToPdf } from '../utils/exportPdf';

interface EKTAViewProps {
  anggota: Anggota;
  onClose: () => void;
}

export const EKTAView: React.FC<EKTAViewProps> = ({ anggota, onClose }) => {
  const [activeSide, setActiveSide] = useState<'depan' | 'belakang' | 'kedua'>('depan');
  const [pengaturan, setPengaturan] = useState<PengaturanAkun>(() => StorageService.getPengaturan());
  const cardRef = useRef<HTMLDivElement>(null);

  // Live synchronization with Pengaturan Akun
  useEffect(() => {
    const syncPengaturan = () => {
      setPengaturan(StorageService.getPengaturan());
    };

    window.addEventListener('kwb-pengaturan-changed', syncPengaturan);
    return () => {
      window.removeEventListener('kwb-pengaturan-changed', syncPengaturan);
    };
  }, []);

  const logoImg = pengaturan.logoUrl || defaultLogoImg;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportEKAToPdf(anggota);
  };

  // Generate QR Code payload for validation
  const qrCodeData = `${pengaturan.namaKoperasi || 'KWB'}|${anggota.nomorAnggota}|${anggota.namaLengkap}|${anggota.jenisKepegawaian}`;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Modal Topbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">
                E-KTA: Kartu Tanda Anggota Elektronik
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Tersinkron dengan Pengaturan Akun
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {anggota.namaLengkap} · <span className="font-mono font-bold text-slate-700">{anggota.nomorAnggota}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Side */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold text-slate-700">
              <button
                onClick={() => setActiveSide('depan')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeSide === 'depan' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tampak Depan
              </button>
              <button
                onClick={() => setActiveSide('belakang')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeSide === 'belakang' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tampak Belakang
              </button>
              <button
                onClick={() => setActiveSide('kedua')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeSide === 'kedua' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kedua Sisi
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Information Bar */}
        <div className="bg-emerald-50/60 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-[11px] text-emerald-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Koperasi: <strong>{pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}</strong></span>
            <span>·</span>
            <span>Ketua: <strong>{pengaturan.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.'}</strong></span>
          </div>
          <span className="text-[10px] text-emerald-700 hidden sm:inline">
            Status: {pengaturan.badanHukum || 'Badan Hukum Resmi'}
          </span>
        </div>

        {/* Card Stage / Preview Container */}
        <div className="p-6 md:p-8 bg-slate-100 flex flex-col items-center justify-center overflow-y-auto">
          <div ref={cardRef} className="print-area flex flex-col lg:flex-row gap-6 items-center justify-center">
            {/* CARD FRONT */}
            {(activeSide === 'depan' || activeSide === 'kedua') && (
              <div className="w-[480px] h-[300px] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-emerald-600/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 shrink-0">
                {/* Background artistic pattern & watermarks */}
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-600/20 blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Card Top Header (Fully Synced from Pengaturan Akun) */}
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3 relative z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg p-0.5 bg-white ring-1 ring-amber-400/50 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={logoImg}
                        alt="Logo Koperasi"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm tracking-wider uppercase text-amber-300 leading-tight truncate">
                        {pengaturan.namaKoperasi || 'KOPERASI WARGA BAHAGIA'}
                      </h4>
                      <p className="text-[10px] text-emerald-200 tracking-wider font-mono uppercase truncate max-w-[280px]">
                        {pengaturan.badanHukum || 'KPRI KOTA BANDUNG · JAWA BARAT'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100 border border-emerald-500/40 shadow-xs">
                      E-KTA RESMI
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="flex items-center gap-4 py-2 relative z-10">
                  {/* Photo with golden frame */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-32 rounded-xl overflow-hidden ring-2 ring-amber-400/70 shadow-md bg-emerald-950 flex items-center justify-center">
                      {anggota.fotoUrl ? (
                        <img
                          src={anggota.fotoUrl}
                          alt={anggota.namaLengkap}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-1 opacity-60" />
                          <span className="text-[9px] text-slate-300">Foto Anggota</span>
                        </div>
                      )}
                    </div>
                    {/* Pegawai badge overlay */}
                    <div className="absolute -bottom-2 -right-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-amber-400 text-slate-900 border border-white">
                      {anggota.jenisKepegawaian}
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="min-w-0 flex-1 space-y-1.5 text-xs">
                    <div>
                      <div className="text-[10px] text-emerald-300 uppercase font-mono tracking-wider">
                        Nomor Anggota
                      </div>
                      <div className="font-mono font-bold text-base text-amber-300 tracking-wider">
                        {anggota.nomorAnggota}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-emerald-300 uppercase font-mono tracking-wider">
                        Nama Lengkap
                      </div>
                      <div className="font-bold text-sm text-white truncate" title={anggota.namaLengkap}>
                        {anggota.namaLengkap}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-emerald-300 text-[10px] block">TTL</span>
                        <span className="text-slate-200 line-clamp-1" title={anggota.tempatTanggalLahir}>
                          {anggota.tempatTanggalLahir || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-300 text-[10px] block">Tahun Masuk</span>
                        <span className="text-slate-200 font-semibold">{anggota.tahunMasuk}</span>
                      </div>
                    </div>

                    {anggota.jabatan && (
                      <div className="text-[10px] text-emerald-200 truncate">
                        <span className="text-emerald-300">Jabatan: </span>
                        {anggota.jabatan}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-end justify-between border-t border-emerald-700/60 pt-2 relative z-10 text-[10px] text-emerald-200">
                  <div className="flex items-center gap-2">
                    {/* Simulated smart card chip */}
                    <div className="w-7 h-5 rounded bg-amber-400/80 border border-amber-300/80 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-3 border border-amber-600/50 rounded-xs" />
                    </div>
                    <div>
                      <span className="block text-[9px] text-emerald-300">STATUS KEANGGOTAAN</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        AKTIF & TERVERIFIKASI
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[9px] tracking-widest text-emerald-300">
                      BERLAKU SELAMA ANGGOTA AKTIF
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CARD BACK */}
            {(activeSide === 'belakang' || activeSide === 'kedua') && (
              <div className="w-[480px] h-[300px] rounded-2xl p-5 text-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-300 bg-white shrink-0">
                {/* Magnetic Stripe simulation */}
                <div className="w-full h-8 bg-slate-900 -mx-5 -mt-2 mb-2" />

                {/* Terms and provisions (Synced) */}
                <div className="space-y-1.5 text-[10px] text-slate-600 leading-relaxed px-1">
                  <div className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 flex items-center justify-between">
                    <span>Ketentuan Pemegang Kartu Tanda Anggota</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase truncate max-w-[200px]">
                      {pengaturan.namaKoperasi || 'KPRI WARGA BAHAGIA'}
                    </span>
                  </div>
                  <ol className="list-decimal pl-3.5 space-y-0.5">
                    <li>Kartu ini adalah bukti sah keanggotaan {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}.</li>
                    <li>Wajib dibawa saat melakukan transaksi simpanan, pinjaman, dan pertokoan.</li>
                    <li>Tidak dapat dipindahtangankan kepada pihak lain tanpa persetujuan pengurus.</li>
                    <li>Jika menemukan kartu ini harap mengembalikan ke kantor {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}.</li>
                  </ol>
                </div>

                {/* QR Code and Signatures (Synced from Pengaturan Akun) */}
                <div className="flex items-end justify-between border-t border-slate-200 pt-2 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-300 rounded-lg p-1 flex flex-col items-center justify-center">
                      <QrCode className="w-9 h-9 text-slate-800" />
                      <span className="text-[7px] font-mono text-slate-500 font-bold mt-0.5">VERIFIKASI</span>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-0.5 max-w-[170px]">
                      <div className="font-semibold text-slate-700">Kantor Sekretariat:</div>
                      <div className="line-clamp-2" title={pengaturan.alamatKoperasi}>
                        {pengaturan.alamatKoperasi || 'Jl. Dago Asri No. 19, Bandung'}
                      </div>
                      {pengaturan.teleponKoperasi && (
                        <div>Telp: {pengaturan.teleponKoperasi}</div>
                      )}
                      <div className="font-mono text-[9px] text-emerald-700 truncate" title={pengaturan.emailAdmin}>
                        {pengaturan.emailAdmin || 'koperasi.sman19bdg@gmail.com'}
                      </div>
                    </div>
                  </div>

                  {/* Ketua Pengurus Signature (Synced) */}
                  <div className="text-center text-[10px]">
                    <div className="text-slate-500">Pengurus Koperasi,</div>
                    <div className="text-slate-600 font-medium">Ketua {pengaturan.namaKoperasi || 'Koperasi'}</div>
                    <div className="my-1 font-serif italic text-slate-400 text-xs">
                      (Tertanda Resmi)
                    </div>
                    <div className="font-bold text-slate-900 border-t border-slate-300 pt-0.5 truncate max-w-[170px]">
                      {pengaturan.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      NIP/ID Terdaftar
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Seluruh data kartu (Logo, Nama Koperasi, Alamat, dan Tanda Tangan Ketua) tersinkron otomatis dari <strong>Pengaturan Akun</strong>.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              title="Unduh E-KTA resmi format PDF standar kartu ID CR80 (85.60 mm x 53.98 mm)"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Kartu</span>
            </button>
            <button
              onClick={handlePrint}
              title="Cetak langsung melalui printer browser"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
