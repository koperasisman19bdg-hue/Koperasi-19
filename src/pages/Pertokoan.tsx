import React, { useState } from 'react';
import { PembukuanTokoItem, PembukuanSeragamItem } from '../types';
import { StorageService } from '../utils/storage';
import {
  exportTokoToExcel,
  exportSeragamToExcel,
  formatRupiah
} from '../utils/exportExcel';
import { exportTokoToPdf, exportSeragamToPdf } from '../utils/exportPdf';
import {
  Store,
  Shirt,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet
} from 'lucide-react';

interface PertokoanProps {
  tokoList: PembukuanTokoItem[];
  seragamList: PembukuanSeragamItem[];
  onDataChanged: () => void;
}

export const Pertokoan: React.FC<PertokoanProps> = ({
  tokoList,
  seragamList,
  onDataChanged
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'toko' | 'seragam'>('toko');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Toko State
  const latestTokoBalance = tokoList.length > 0 ? tokoList[tokoList.length - 1].saldoAkhir : 0;
  const [tanggalToko, setTanggalToko] = useState(new Date().toISOString().split('T')[0]);
  const [saldoAwalToko, setSaldoAwalToko] = useState<number>(latestTokoBalance);
  const [uraianToko, setUraianToko] = useState('');
  const [debetToko, setDebetToko] = useState<number>(0);
  const [kreditToko, setKreditToko] = useState<number>(0);

  // Form Seragam State
  const latestSeragamBalance =
    seragamList.length > 0 ? seragamList[seragamList.length - 1].saldoAkhir : 0;
  const [tanggalSeragam, setTanggalSeragam] = useState(new Date().toISOString().split('T')[0]);
  const [saldoAwalSeragam, setSaldoAwalSeragam] = useState<number>(latestSeragamBalance);
  const [uraianSeragam, setUraianSeragam] = useState('');
  const [debetSeragam, setDebetSeragam] = useState<number>(0);
  const [kreditSeragam, setKreditSeragam] = useState<number>(0);

  // Calculations
  const calculatedSaldoAkhirToko =
    Number(saldoAwalToko || 0) + Number(debetToko || 0) - Number(kreditToko || 0);

  const calculatedSaldoAkhirSeragam =
    Number(saldoAwalSeragam || 0) + Number(debetSeragam || 0) - Number(kreditSeragam || 0);

  // Submit Toko
  const handleSubmitToko = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraianToko.trim()) {
      alert('Uraian kegiatan toko wajib diisi!');
      return;
    }

    StorageService.addToko({
      tanggal: tanggalToko,
      saldoAwal: Number(saldoAwalToko || 0),
      uraianKegiatan: uraianToko,
      debet: Number(debetToko || 0),
      kredit: Number(kreditToko || 0),
      saldoAkhir: calculatedSaldoAkhirToko
    });

    setUraianToko('');
    setDebetToko(0);
    setKreditToko(0);
    setSaldoAwalToko(calculatedSaldoAkhirToko);
    onDataChanged();
  };

  // Submit Seragam
  const handleSubmitSeragam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraianSeragam.trim()) {
      alert('Uraian kegiatan seragam wajib diisi!');
      return;
    }

    StorageService.addSeragam({
      tanggal: tanggalSeragam,
      saldoAwal: Number(saldoAwalSeragam || 0),
      uraianKegiatan: uraianSeragam,
      debet: Number(debetSeragam || 0),
      kredit: Number(kreditSeragam || 0),
      saldoAkhir: calculatedSaldoAkhirSeragam
    });

    setUraianSeragam('');
    setDebetSeragam(0);
    setKreditSeragam(0);
    setSaldoAwalSeragam(calculatedSaldoAkhirSeragam);
    onDataChanged();
  };

  const handleDeleteToko = (id: string) => {
    if (window.confirm('Hapus baris transaksi toko ini?')) {
      StorageService.deleteToko(id);
      onDataChanged();
    }
  };

  const handleDeleteSeragam = (id: string) => {
    if (window.confirm('Hapus baris transaksi seragam ini?')) {
      StorageService.deleteSeragam(id);
      onDataChanged();
    }
  };

  // Filtered
  const filteredToko = tokoList.filter((item) =>
    item.uraianKegiatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSeragam = seragamList.filter((item) =>
    item.uraianKegiatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary Metrics
  const totalDebetToko = filteredToko.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKreditToko = filteredToko.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const currentSaldoToko =
    tokoList.length > 0 ? tokoList[tokoList.length - 1].saldoAkhir : 0;

  const totalDebetSeragam = filteredSeragam.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKreditSeragam = filteredSeragam.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const currentSaldoSeragam =
    seragamList.length > 0 ? seragamList[seragamList.length - 1].saldoAkhir : 0;

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('toko')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'toko'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Pemasukan Toko</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {tokoList.length} Transaksi
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('seragam')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'seragam'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Pemasukan Seragam</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
            {seragamList.length} Transaksi
          </span>
        </button>
      </div>

      {/* SUBTAB 1: PEMASUKAN TOKO */}
      {activeSubTab === 'toko' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Pemasukan Toko</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupiah(totalDebetToko)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Penjualan makanan, ATK, dll</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Pengeluaran Toko</span>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-700 mt-1 tabular-nums">
                {formatRupiah(totalKreditToko)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Kulakan stok & operasional</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Saldo Kas Toko</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupiah(currentSaldoToko)}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                Saldo Awal + Debet - Kredit
              </div>
            </div>
          </div>

          {/* Form Pemasukan Toko */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Form Input Pembukuan Pemasukan Toko
                </h3>
              </div>
              <div className="text-xs text-slate-500">
                Formula: <span className="font-mono text-emerald-700 font-semibold">Saldo Akhir = Saldo Awal + Debet - Kredit</span>
              </div>
            </div>

            <form onSubmit={handleSubmitToko} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalToko}
                    onChange={(e) => setTanggalToko(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Saldo Awal (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={saldoAwalToko}
                    onChange={(e) => setSaldoAwalToko(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uraian Kegiatan Toko *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penjualan tunai harian / Kulakan snack"
                    value={uraianToko}
                    onChange={(e) => setUraianToko(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">
                    Debet (Pemasukan) Rp
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={debetToko}
                    onChange={(e) => setDebetToko(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg font-mono tabular-nums bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-rose-800 mb-1">
                    Kredit (Pengeluaran) Rp
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={kreditToko}
                    onChange={(e) => setKreditToko(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg font-mono tabular-nums bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-slate-500">Hasil Saldo Akhir:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatRupiah(calculatedSaldoAkhirToko)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Pembukuan Toko</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter & Download Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari uraian transaksi toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportTokoToPdf(filteredToko)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="Download Hasil Pembukuan Toko format PDF"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => exportTokoToExcel(filteredToko)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="Download Hasil Pembukuan Toko format Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Excel</span>
              </button>
            </div>
          </div>

          {/* Table Toko */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-3 text-center">No</th>
                    <th className="py-3.5 px-3">Tanggal</th>
                    <th className="py-3.5 px-4">Uraian Kegiatan Toko</th>
                    <th className="py-3.5 px-4 text-right">Saldo Awal</th>
                    <th className="py-3.5 px-4 text-right text-emerald-800">Debet (Masuk)</th>
                    <th className="py-3.5 px-4 text-right text-rose-800">Kredit (Keluar)</th>
                    <th className="py-3.5 px-4 text-right font-bold">Saldo Akhir</th>
                    <th className="py-3.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredToko.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Belum ada catatan pembukuan pemasukan toko.
                      </td>
                    </tr>
                  ) : (
                    filteredToko.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium whitespace-nowrap">{item.tanggal}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.uraianKegiatan}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatRupiah(item.saldoAwal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                          {item.debet > 0 ? `+${formatRupiah(item.debet)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-medium">
                          {item.kredit > 0 ? `-${formatRupiah(item.kredit)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatRupiah(item.saldoAkhir)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteToko(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredToko.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right">
                        TOTAL PEMBUKUAN TOKO:
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800">
                        +{formatRupiah(totalDebetToko)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-800">
                        -{formatRupiah(totalKreditToko)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-slate-900">
                        {formatRupiah(filteredToko[filteredToko.length - 1].saldoAkhir)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PEMASUKAN SERAGAM */}
      {activeSubTab === 'seragam' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Pemasukan Seragam</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupiah(totalDebetSeragam)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Penjualan seragam, kaos, atribut</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Pengeluaran Seragam</span>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-700 mt-1 tabular-nums">
                {formatRupiah(totalKreditSeragam)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Ongkos jahit, kain, bordir</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/30">
              <div className="flex items-center justify-between text-indigo-900 text-xs font-semibold">
                <span>Saldo Kas Seragam</span>
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupiah(currentSaldoSeragam)}
              </div>
              <div className="text-[11px] text-indigo-700 mt-1 font-medium">
                Saldo Awal + Debet - Kredit
              </div>
            </div>
          </div>

          {/* Form Pemasukan Seragam */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Form Input Pembukuan Pemasukan Seragam
                </h3>
              </div>
              <div className="text-xs text-slate-500">
                Formula: <span className="font-mono text-emerald-700 font-semibold">Saldo Akhir = Saldo Awal + Debet - Kredit</span>
              </div>
            </div>

            <form onSubmit={handleSubmitSeragam} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalSeragam}
                    onChange={(e) => setTanggalSeragam(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Saldo Awal (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={saldoAwalSeragam}
                    onChange={(e) => setSaldoAwalSeragam(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uraian Kegiatan Seragam *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penjualan seragam batik / Bayar konveksi"
                    value={uraianSeragam}
                    onChange={(e) => setUraianSeragam(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">
                    Debet (Pemasukan) Rp
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={debetSeragam}
                    onChange={(e) => setDebetSeragam(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg font-mono tabular-nums bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-rose-800 mb-1">
                    Kredit (Pengeluaran) Rp
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={kreditSeragam}
                    onChange={(e) => setKreditSeragam(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg font-mono tabular-nums bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-slate-500">Hasil Saldo Akhir:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatRupiah(calculatedSaldoAkhirSeragam)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Pembukuan Seragam</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter & Download Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari uraian transaksi seragam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportSeragamToPdf(filteredSeragam)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="Download Hasil Pembukuan Seragam format PDF"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => exportSeragamToExcel(filteredSeragam)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="Download Hasil Pembukuan Seragam format Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Excel</span>
              </button>
            </div>
          </div>

          {/* Table Seragam */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-3 text-center">No</th>
                    <th className="py-3.5 px-3">Tanggal</th>
                    <th className="py-3.5 px-4">Uraian Kegiatan Seragam</th>
                    <th className="py-3.5 px-4 text-right">Saldo Awal</th>
                    <th className="py-3.5 px-4 text-right text-emerald-800">Debet (Masuk)</th>
                    <th className="py-3.5 px-4 text-right text-rose-800">Kredit (Keluar)</th>
                    <th className="py-3.5 px-4 text-right font-bold">Saldo Akhir</th>
                    <th className="py-3.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSeragam.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Belum ada catatan pembukuan pemasukan seragam.
                      </td>
                    </tr>
                  ) : (
                    filteredSeragam.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium whitespace-nowrap">{item.tanggal}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.uraianKegiatan}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {formatRupiah(item.saldoAwal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                          {item.debet > 0 ? `+${formatRupiah(item.debet)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-medium">
                          {item.kredit > 0 ? `-${formatRupiah(item.kredit)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatRupiah(item.saldoAkhir)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteSeragam(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredSeragam.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right">
                        TOTAL PEMBUKUAN SERAGAM:
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800">
                        +{formatRupiah(totalDebetSeragam)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-800">
                        -{formatRupiah(totalKreditSeragam)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-slate-900">
                        {formatRupiah(filteredSeragam[filteredSeragam.length - 1].saldoAkhir)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
