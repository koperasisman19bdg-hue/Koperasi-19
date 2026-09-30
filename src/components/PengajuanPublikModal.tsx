import React, { useState } from 'react';
import { Anggota } from '../types';
import { StorageService } from '../utils/storage';
import { formatRupiah } from '../utils/exportExcel';
import {
  Sparkles,
  Send,
  X,
  Banknote,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PengajuanPublikModalProps {
  anggotaList: Anggota[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const PengajuanPublikModal: React.FC<PengajuanPublikModalProps> = ({
  anggotaList,
  isOpen,
  onClose,
  onSubmitSuccess
}) => {
  const [selectedAnggotaId, setSelectedAnggotaId] = useState(anggotaList[0]?.id || '');
  const [jenisPinjaman, setJenisPinjaman] = useState<'Uang' | 'Barang'>('Uang');
  const [jumlahUang, setJumlahUang] = useState<number>(5000000);
  const [namaBarang, setNamaBarang] = useState('');
  const [estimasiHargaBarang, setEstimasiHargaBarang] = useState<number>(3500000);
  const [tenorBulan, setTenorBulan] = useState<number>(10);
  const [keperluan, setKeperluan] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const anggota = anggotaList.find((a) => a.id === selectedAnggotaId);
    if (!anggota) {
      alert('Pilih anggota pemohon terlebih dahulu!');
      return;
    }

    if (!keperluan.trim()) {
      alert('Harap isi keperluan peminjaman.');
      return;
    }

    StorageService.addPengajuan({
      anggotaId: anggota.id,
      namaAnggota: anggota.namaLengkap,
      nomorAnggota: anggota.nomorAnggota,
      jenisPinjaman,
      jumlahUang: jenisPinjaman === 'Uang' ? Number(jumlahUang) : undefined,
      namaBarang: jenisPinjaman === 'Barang' ? namaBarang : undefined,
      estimasiHargaBarang: jenisPinjaman === 'Barang' ? Number(estimasiHargaBarang) : undefined,
      tenorBulan: Number(tenorBulan),
      keperluan,
      tanggalPengajuan: new Date().toISOString().split('T')[0]
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      onSubmitSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Formulir Pengajuan Peminjaman Anggota
              </h3>
              <p className="text-[11px] text-emerald-200">
                Koperasi Warga Bahagia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Pengajuan Berhasil Dikirim!
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Pengajuan Anda telah diteruskan ke notifikasi pengurus koperasi untuk dilakukan verifikasi dan persetujuan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Pilih Anggota */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Nama Anggota Pemohon *
              </label>
              <select
                value={selectedAnggotaId}
                onChange={(e) => setSelectedAnggotaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {anggotaList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nomorAnggota} - {a.namaLengkap} ({a.jenisKepegawaian})
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Pinjaman */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Jenis Pinjaman yang Diajukan *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisPinjaman('Uang')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    jenisPinjaman === 'Uang'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <div className="text-left">
                    <div>Pinjaman Uang</div>
                    <div className="text-[10px] text-slate-400 font-normal">Tunai via rekening/kas</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisPinjaman('Barang')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    jenisPinjaman === 'Barang'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-5 h-5 text-teal-600" />
                  <div className="text-left">
                    <div>Pinjaman Barang</div>
                    <div className="text-[10px] text-slate-400 font-normal">Elektronik, ATK, dll</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Input conditional fields */}
            {jenisPinjaman === 'Uang' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Uang yang Diajukan (Rp) *
                </label>
                <input
                  type="number"
                  min={500000}
                  step={500000}
                  required
                  value={jumlahUang}
                  onChange={(e) => setJumlahUang(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Barang yang Diajukan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laptop Asus VivoBook / Kulkas 2 Pintu"
                    value={namaBarang}
                    onChange={(e) => setNamaBarang(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Harga Barang (Rp) *
                  </label>
                  <input
                    type="number"
                    min={200000}
                    required
                    value={estimasiHargaBarang}
                    onChange={(e) => setEstimasiHargaBarang(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Tenor */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jangka Waktu Cicilan (Tenor Bulan) *
              </label>
              <select
                value={tenorBulan}
                onChange={(e) => setTenorBulan(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value={3}>3 Bulan</option>
                <option value={6}>6 Bulan</option>
                <option value={10}>10 Bulan</option>
                <option value={12}>12 Bulan (1 Tahun)</option>
                <option value={18}>18 Bulan</option>
                <option value={24}>24 Bulan (2 Tahun)</option>
              </select>
            </div>

            {/* Keperluan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alasan / Keperluan Peminjaman *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan kebutuhan dana atau pengadaan barang ini..."
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Estimasi Ringkasan */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700">
              <span>Perkiraan Angsuran / Bulan:</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {formatRupiah(
                  jenisPinjaman === 'Uang'
                    ? Math.round(jumlahUang / tenorBulan + (jumlahUang * 1) / 100)
                    : Math.round(estimasiHargaBarang / tenorBulan)
                )}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Pengajuan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
