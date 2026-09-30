import React, { useState } from 'react';
import { JurnalItem } from '../types';
import { StorageService } from '../utils/storage';
import { exportJurnalToExcel, formatRupiah } from '../utils/exportExcel';
import { exportJurnalToPdf } from '../utils/exportPdf';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Settings2,
  CheckCircle2,
  X,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface JurnalUmumProps {
  jurnalList: JurnalItem[];
  onDataChanged: () => void;
}

export const JurnalUmum: React.FC<JurnalUmumProps> = ({ jurnalList, onDataChanged }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Saldo Awal Modal state
  const [isSaldoAwalModalOpen, setIsSaldoAwalModalOpen] = useState(false);
  const currentSaldoAwalKas = StorageService.getSaldoAwalKas();
  const [tempSaldoAwal, setTempSaldoAwal] = useState<number>(currentSaldoAwalKas);

  // Form Fields for New Transaction
  const latestBalance = jurnalList.length > 0 ? jurnalList[jurnalList.length - 1].saldoAkhir : currentSaldoAwalKas;
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [uraianKegiatan, setUraianKegiatan] = useState('');
  const [debet, setDebet] = useState<number>(0);
  const [kredit, setKredit] = useState<number>(0);

  // Real-time calculation: Saldo Akhir = Saldo Terakhir + Debet - Kredit
  const calculatedSaldoAkhir = latestBalance + Number(debet || 0) - Number(kredit || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraianKegiatan.trim()) {
      alert('Uraian kegiatan / transaksi wajib diisi!');
      return;
    }

    if (debet === 0 && kredit === 0) {
      alert('Masukkan nominal Debet (pemasukan) atau Kredit (pengeluaran)!');
      return;
    }

    StorageService.addJurnal({
      tanggal,
      uraianKegiatan,
      debet: Number(debet || 0),
      kredit: Number(kredit || 0)
    });

    // Reset Form for next entry
    setUraianKegiatan('');
    setDebet(0);
    setKredit(0);
    onDataChanged();
  };

  const handleSaveSaldoAwal = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.setSaldoAwalKas(Number(tempSaldoAwal) || 0);
    setIsSaldoAwalModalOpen(false);
    onDataChanged();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus transaksi jurnal ini? Saldo kas berikutnya akan disesuaikan otomatis.')) {
      StorageService.deleteJurnal(id);
      onDataChanged();
    }
  };

  // Filtered entries
  const filteredList = jurnalList.filter((item) => {
    const matchSearch =
      item.uraianKegiatan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDateStart = !filterStartDate || item.tanggal >= filterStartDate;
    const matchDateEnd = !filterEndDate || item.tanggal <= filterEndDate;

    return matchSearch && matchDateStart && matchDateEnd;
  });

  const totalDebet = filteredList.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKredit = filteredList.reduce((acc, curr) => acc + (curr.kredit || 0), 0);
  const currentKas = jurnalList.length > 0 ? jurnalList[jurnalList.length - 1].saldoAkhir : currentSaldoAwalKas;

  return (
    <div className="space-y-6">
      {/* KPI Cards: Saldo Awal (diisi sekali), Total Debet, Total Kredit, Saldo Akhir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Awal (Diisi sekali saat pembukaan laporan) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 relative group shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Saldo Awal Kas (Laporan)</span>
            <button
              onClick={() => {
                setTempSaldoAwal(StorageService.getSaldoAwalKas());
                setIsSaldoAwalModalOpen(true);
              }}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
              title="Atur Saldo Awal Kas Pembukaan Laporan"
            >
              <Settings2 className="w-3 h-3" />
              <span>Atur</span>
            </button>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-2 tabular-nums">
            {formatRupiah(currentSaldoAwalKas)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Diisi sekali saat awal periode</span>
          </div>
        </div>

        {/* 2. Total Debet (Pemasukan) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Debet (Pemasukan)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2 tabular-nums">
            +{formatRupiah(totalDebet)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi penerimaan kas</div>
        </div>

        {/* 3. Total Kredit (Pengeluaran) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Kredit (Pengeluaran)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 tabular-nums">
            -{formatRupiah(totalKredit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi pengeluaran kas</div>
        </div>

        {/* 4. Saldo Akhir Kas Koperasi */}
        <div className="bg-white p-4 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold">
            <span>Saldo Akhir Kas Koperasi</span>
            <Wallet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-2 tabular-nums">
            {formatRupiah(currentKas)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Saldo Awal + Debet - Kredit
          </div>
        </div>
      </div>

      {/* FORM INPUT JURNAL UMUM */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Form Input Transaksi Kas
            </h3>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Saldo Kas Saat Ini:</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {formatRupiah(latestBalance)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            {/* Tanggal */}
            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Uraian Kegiatan */}
            <div className="md:col-span-5">
              <label className="block font-semibold text-slate-700 mb-1">
                Uraian Kegiatan / Transaksi *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Penerimaan Simpanan Wajib / Biaya ATK Kantor"
                value={uraianKegiatan}
                onChange={(e) => setUraianKegiatan(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Debet atau Kredit */}
            <div className="md:col-span-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-emerald-800 mb-1">
                  Debet (Masuk)
                </label>
                <input
                  type="number"
                  min={0}
                  value={debet}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDebet(val);
                    if (val > 0) setKredit(0);
                  }}
                  className="w-full px-2.5 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums font-mono bg-emerald-50/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-rose-800 mb-1">
                  Kredit (Keluar)
                </label>
                <input
                  type="number"
                  min={0}
                  value={kredit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setKredit(val);
                    if (val > 0) setDebet(0);
                  }}
                  className="w-full px-2.5 py-2 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 tabular-nums font-mono bg-rose-50/30"
                />
              </div>
            </div>
          </div>

          {/* Real-time Calculation Preview & Submit Button */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">Estimasi Saldo Kas Akhir:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md text-sm border border-slate-200">
                {formatRupiah(calculatedSaldoAkhir)}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ({formatRupiah(latestBalance)} + {formatRupiah(debet)} - {formatRupiah(kredit)})
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan ke Jurnal Kas</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Download Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari uraian kegiatan / transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span className="text-[11px] text-slate-400">Dari:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-md text-xs"
            />
            <span className="text-[11px] text-slate-400">s/d:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-md text-xs"
            />
            {(filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Set Saldo Awal, Download PDF, Download Excel */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setTempSaldoAwal(StorageService.getSaldoAwalKas());
              setIsSaldoAwalModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            title="Atur Saldo Kas Awal Pembukaan Laporan"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Atur Saldo Awal</span>
          </button>
          <button
            onClick={() => exportJurnalToPdf(filteredList)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            title="Download Laporan Jurnal Kas format PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => exportJurnalToExcel(filteredList)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            title="Download Laporan Jurnal Kas format Excel .xlsx"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* TABEL BUKU KAS JURNAL UMUM */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-3 text-center">No</th>
                <th className="py-3.5 px-3">Tanggal</th>
                <th className="py-3.5 px-4">Uraian Kegiatan / Transaksi</th>
                <th className="py-3.5 px-4 text-right text-emerald-800">Debet (Masuk)</th>
                <th className="py-3.5 px-4 text-right text-rose-800">Kredit (Keluar)</th>
                <th className="py-3.5 px-4 text-right font-bold">Saldo Kas</th>
                <th className="py-3.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Belum ada transaksi jurnal kas yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 font-medium whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {item.uraianKegiatan}
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
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus baris transaksi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredList.length > 0 && (
              <tfoot className="bg-slate-50/95 border-t border-slate-200 font-semibold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-600">
                    TOTAL AKUMULASI PERIODE:
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800">
                    +{formatRupiah(totalDebet)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-800">
                    -{formatRupiah(totalKredit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-slate-900">
                    {formatRupiah(filteredList[filteredList.length - 1].saldoAkhir)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL: PENGATURAN SALDO AWAL KAS LAPORAN */}
      {isSaldoAwalModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Atur Saldo Awal Kas Laporan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Saldo pembukaan awal periode laporan keuangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaldoAwalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSaldoAwal} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900">Ketentuan Saldo Awal:</div>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Saldo awal hanya diisi sekali saat pembuatan / pembukaan laporan. Nilai ini menjadi titik awal perhitungan dan akan terus terakumulasi dengan saldo akhir setiap transaksi.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Saldo Awal Kas (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={tempSaldoAwal}
                  onChange={(e) => setTempSaldoAwal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  placeholder="Contoh: 45000000"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Terbaca: <strong>{formatRupiah(tempSaldoAwal || 0)}</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaldoAwalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Saldo Awal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
