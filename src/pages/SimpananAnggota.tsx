import React, { useState } from 'react';
import { Anggota, SimpananRecord } from '../types';
import { StorageService } from '../utils/storage';
import {
  exportSimpananToExcel,
  downloadSimpananTemplate,
  parseExcelFile,
  formatRupiah
} from '../utils/exportExcel';
import { exportSimpananToPdf } from '../utils/exportPdf';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  Banknote,
  Coins,
  Shield,
  X
} from 'lucide-react';

interface SimpananAnggotaProps {
  anggotaList: Anggota[];
  simpananList: SimpananRecord[];
  onDataChanged: () => void;
}

export const SimpananAnggota: React.FC<SimpananAnggotaProps> = ({
  anggotaList,
  simpananList,
  onDataChanged
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Upload Excel states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Manual Edit Modal states
  const [editingRecord, setEditingRecord] = useState<SimpananRecord | null>(null);
  const [editPokok, setEditPokok] = useState(0);
  const [editWajib, setEditWajib] = useState(0);
  const [editSukarela, setEditSukarela] = useState(0);

  // Delete Confirmation Modal states
  const [deleteTarget, setDeleteTarget] = useState<SimpananRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Totals
  const totalPokok = simpananList.reduce((acc, curr) => acc + (curr.simpananPokok || 0), 0);
  const totalWajib = simpananList.reduce((acc, curr) => acc + (curr.simpananWajib || 0), 0);
  const totalSukarela = simpananList.reduce((acc, curr) => acc + (curr.simpananSukarela || 0), 0);
  const grandTotalSimpanan = totalPokok + totalWajib + totalSukarela;

  const filteredList = simpananList.filter((s) =>
    s.namaAnggota.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nomorAnggota.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manual Edit Submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    StorageService.updateSimpanan(editingRecord.id, {
      simpananPokok: Number(editPokok || 0),
      simpananWajib: Number(editWajib || 0),
      simpananSukarela: Number(editSukarela || 0)
    });

    setEditingRecord(null);
    setToastNotification(`Data simpanan "${editingRecord.namaAnggota}" berhasil diperbarui.`);
    onDataChanged();
    setTimeout(() => setToastNotification(null), 4000);
  };

  const openEditModal = (rec: SimpananRecord) => {
    setEditingRecord(rec);
    setEditPokok(rec.simpananPokok);
    setEditWajib(rec.simpananWajib);
    setEditSukarela(rec.simpananSukarela);
  };

  const handleDeleteClick = (rec: SimpananRecord) => {
    setDeleteTarget(rec);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const targetName = deleteTarget.namaAnggota;
      StorageService.deleteSimpanan(deleteTarget.id);
      setToastNotification(`Data simpanan "${targetName}" berhasil dihapus.`);
      setDeleteTarget(null);
      onDataChanged();
      setTimeout(() => setToastNotification(null), 4000);
    } catch (err: any) {
      alert('Gagal menghapus data simpanan: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload Excel Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    try {
      const data = await parseExcelFile(file);
      if (!data || data.length === 0) {
        setUploadError('File Excel kosong atau format tidak sesuai.');
        return;
      }

      // Check matching names with Data Keanggotaan
      const validatedRows = data.map((row) => {
        // Try multiple probable column keys
        const rowName =
          row['Nama Anggota'] ||
          row['Nama Lengkap'] ||
          row['Nama'] ||
          row['nama_anggota'] ||
          '';

        const matchedAnggota = anggotaList.find(
          (a) =>
            a.namaLengkap.trim().toLowerCase() === String(rowName).trim().toLowerCase() ||
            a.namaLengkap.toLowerCase().includes(String(rowName).toLowerCase().trim())
        );

        const pokok = Number(row['Simpanan Pokok'] || row['Pokok'] || 0);
        const wajib = Number(row['Simpanan Wajib'] || row['Wajib'] || 0);
        const sukarela = Number(row['Simpanan Sukarela'] || row['Sukarela'] || 0);

        return {
          originalName: rowName,
          matchedAnggota,
          isMatched: !!matchedAnggota,
          simpananPokok: isNaN(pokok) ? 0 : pokok,
          simpananWajib: isNaN(wajib) ? 0 : wajib,
          simpananSukarela: isNaN(sukarela) ? 0 : sukarela
        };
      });

      setParsedRows(validatedRows);
    } catch (err: any) {
      setUploadError('Gagal membaca file Excel: ' + (err.message || 'Format tidak valid'));
    }
  };

  const handleApplyUpload = () => {
    let updatedCount = 0;
    const currentList = [...simpananList];

    parsedRows.forEach((row) => {
      if (row.isMatched && row.matchedAnggota) {
        const existingIdx = currentList.findIndex(
          (s) => s.anggotaId === row.matchedAnggota.id
        );

        if (existingIdx !== -1) {
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            simpananPokok: row.simpananPokok || currentList[existingIdx].simpananPokok,
            simpananWajib: row.simpananWajib || currentList[existingIdx].simpananWajib,
            simpananSukarela: row.simpananSukarela || currentList[existingIdx].simpananSukarela,
            terakhirUpdate: new Date().toISOString().split('T')[0]
          };
          updatedCount++;
        }
      }
    });

    StorageService.saveSimpanan(currentList);
    setUploadSuccess(`Berhasil memperbarui data simpanan untuk ${updatedCount} anggota!`);
    setTimeout(() => {
      setIsUploadModalOpen(false);
      setParsedRows([]);
      setUploadSuccess('');
      onDataChanged();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3 Categories of Simpanan + Total Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Simpanan Pokok */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Simpanan Pokok</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatRupiah(totalPokok)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dibayar sekali saat masuk</div>
        </div>

        {/* Simpanan Wajib */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Simpanan Wajib</span>
            <Coins className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-700 mt-1 tabular-nums">
            {formatRupiah(totalWajib)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Iuran berkala per bulan</div>
        </div>

        {/* Simpanan Sukarela */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Simpanan Sukarela</span>
            <Banknote className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-700 mt-1 tabular-nums">
            {formatRupiah(totalSukarela)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tabungan sukarela anggota</div>
        </div>

        {/* Total Keseluruhan */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Total Aset Simpanan</span>
            <Banknote className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1 tabular-nums">
            {formatRupiah(grandTotalSimpanan)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Pokok + Wajib + Sukarela
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons: Upload Excel, Download Excel/PDF, Template */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => downloadSimpananTemplate(anggotaList)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            title="Download Template Excel yang siap diisi sesuai nama anggota"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => {
              setParsedRows([]);
              setUploadError('');
              setUploadSuccess('');
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            title="Upload file Excel untuk update Simpanan Pokok, Wajib, Sukarela"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Excel</span>
          </button>

          <button
            onClick={() => exportSimpananToPdf(filteredList)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => exportSimpananToExcel(filteredList)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table Simpanan */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-3 text-center">No</th>
                <th className="py-3.5 px-3">No. Anggota</th>
                <th className="py-3.5 px-4">Nama Lengkap Anggota</th>
                <th className="py-3.5 px-4 text-right">Simpanan Pokok</th>
                <th className="py-3.5 px-4 text-right">Simpanan Wajib</th>
                <th className="py-3.5 px-4 text-right">Simpanan Sukarela</th>
                <th className="py-3.5 px-4 text-right font-bold">Total Simpanan</th>
                <th className="py-3.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ditemukan data simpanan anggota.
                  </td>
                </tr>
              ) : (
                filteredList.map((rec, index) => {
                  const total =
                    (rec.simpananPokok || 0) +
                    (rec.simpananWajib || 0) +
                    (rec.simpananSukarela || 0);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-emerald-700">
                        {rec.nomorAnggota}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {rec.namaAnggota}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatRupiah(rec.simpananPokok)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-700">
                        {formatRupiah(rec.simpananWajib)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-700">
                        {formatRupiah(rec.simpananSukarela)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatRupiah(total)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md border border-slate-300 transition-colors shadow-2xs"
                            title="Ubah nominal simpanan"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rec)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                            title="Hapus data simpanan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredList.length > 0 && (
              <tfoot className="bg-slate-50/90 border-t border-slate-200 font-semibold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                    {formatRupiah(totalPokok)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-800">
                    {formatRupiah(totalWajib)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-800">
                    {formatRupiah(totalSukarela)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-emerald-800">
                    {formatRupiah(grandTotalSimpanan)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL UPLOAD EXCEL SIMPANAN */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Upload Excel Simpanan Anggota
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem mencocokkan data Nama Anggota di Excel dengan Data Keanggotaan Koperasi.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* Upload Input Area */}
              <div className="p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="excelFileInput"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                  <span className="font-semibold text-slate-700 text-xs">
                    Klik untuk memilih file Excel (.xlsx / .xls)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Kolom yang didukung: Nama Anggota, Simpanan Pokok, Simpanan Wajib, Simpanan Sukarela
                  </span>
                </label>
              </div>

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>
                      Preview Validasi Nama ({parsedRows.filter((r) => r.isMatched).length} cocok dari {parsedRows.length} baris)
                    </span>
                    <span className="text-emerald-700 font-mono">
                      {parsedRows.filter((r) => r.isMatched).length}/{parsedRows.length} Valid
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Nama di Excel</th>
                          <th className="py-2 px-3">Kesesuaian Anggota</th>
                          <th className="py-2 px-3 text-right">Pokok</th>
                          <th className="py-2 px-3 text-right">Wajib</th>
                          <th className="py-2 px-3 text-right">Sukarela</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row.isMatched ? 'bg-white' : 'bg-rose-50/50'}>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {row.originalName || '-'}
                            </td>
                            <td className="py-2 px-3">
                              {row.isMatched ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{row.matchedAnggota.nomorAnggota} ({row.matchedAnggota.namaLengkap})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Nama tidak ada di Data Anggota</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {formatRupiah(row.simpananPokok)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {formatRupiah(row.simpananWajib)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {formatRupiah(row.simpananSukarela)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0 || !parsedRows.some((r) => r.isMatched)}
                  onClick={handleApplyUpload}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Terapkan Update ke Simpanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL EDIT SIMPANAN */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Update Simpanan: {editingRecord.namaAnggota}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="text-slate-500 font-mono">
                No. Anggota: <span className="font-bold text-slate-800">{editingRecord.nomorAnggota}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Simpanan Pokok (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editPokok}
                  onChange={(e) => setEditPokok(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Simpanan Wajib (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editWajib}
                  onChange={(e) => setEditWajib(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Simpanan Sukarela (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editSukarela}
                  onChange={(e) => setEditSukarela(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tabular-nums"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 flex items-center justify-between font-medium">
                <span>Total Simpanan Baru:</span>
                <span className="font-mono font-bold text-sm">
                  {formatRupiah(Number(editPokok || 0) + Number(editWajib || 0) + Number(editSukarela || 0))}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingRecord;
                    setEditingRecord(null);
                    handleDeleteClick(toDelete);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Simpanan</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS SIMPANAN */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Hapus Data Simpanan
                  </h3>
                  <p className="text-xs text-rose-700 font-medium">
                    Konfirmasi penghapusan buku tabungan simpanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Nama Anggota:</span>
                  <span className="font-bold text-slate-900">{deleteTarget.namaAnggota}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Nomor Anggota:</span>
                  <span className="font-mono font-bold text-emerald-700">{deleteTarget.nomorAnggota}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Pokok</div>
                    <div className="font-bold text-slate-800 text-[11px] mt-0.5">{formatRupiah(deleteTarget.simpananPokok)}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Wajib</div>
                    <div className="font-bold text-teal-700 text-[11px] mt-0.5">{formatRupiah(deleteTarget.simpananWajib)}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Sukarela</div>
                    <div className="font-bold text-indigo-700 text-[11px] mt-0.5">{formatRupiah(deleteTarget.simpananSukarela)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
                  <span>Total Saldo Simpanan:</span>
                  <span className="font-mono text-emerald-800">
                    {formatRupiah((deleteTarget.simpananPokok || 0) + (deleteTarget.simpananWajib || 0) + (deleteTarget.simpananSukarela || 0))}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data buku simpanan untuk anggota <strong className="text-slate-900">{deleteTarget.namaAnggota}</strong>? Tindakan ini akan menghapus catatan simpanan pokok, wajib, dan sukarela anggota ini dari pembukuan simpanan.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Simpanan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
