import jsPDF from 'jspdf';
import { StorageService } from './storage';

export interface KopData {
  namaKoperasi: string;
  instansiInduk: string;
  badanHukum: string;
  alamatKoperasi: string;
  teleponKoperasi: string;
  emailKoperasi: string;
  websiteKoperasi: string;
  logoUrl: string;
  logoKananUrl: string;
  warnaGarisKop: string;
  tampilkanLogoKiriKop: boolean;
  tampilkanLogoKananKop: boolean;
}

export function getDividerColors(warna?: string): [number, number, number] {
  switch (warna) {
    case 'navy':
      return [30, 58, 138]; // blue-900
    case 'slate':
      return [51, 65, 85]; // slate-700
    case 'gold':
      return [180, 83, 9]; // amber-700
    case 'emerald':
    default:
      return [20, 83, 45]; // emerald-900
  }
}

/**
 * Draws the official cooperative letterhead (Kop Surat) dynamically from settings.
 * Returns the final calculated Y position after printing.
 */
export function drawOfficialKop(doc: jsPDF, title: string, customSubtitle?: string): number {
  const p = StorageService.getPengaturan();
  const dividerColor = getDividerColors(p.warnaGarisKop);
  let startY = 11;

  // 1. Logo Kiri & Logo Kanan Kop Surat
  if (p.tampilkanLogoKiriKop !== false && p.logoUrl && p.logoUrl.startsWith('data:image')) {
    try {
      doc.addImage(p.logoUrl, 'JPEG', 15, 9, 18, 18);
    } catch (e) {
      console.warn('Gagal memuat logo kiri PDF:', e);
    }
  }

  if (p.tampilkanLogoKananKop !== false) {
    const rightLogo = p.logoKananUrl || p.logoUrl;
    if (rightLogo && rightLogo.startsWith('data:image')) {
      try {
        doc.addImage(rightLogo, 'JPEG', 177, 9, 18, 18);
      } catch (e) {
        console.warn('Gagal memuat logo kanan PDF:', e);
      }
    }
  }

  // 2. Instansi Induk (jika ada)
  if (p.instansiInduk && p.instansiInduk.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const instansiLines = p.instansiInduk.split('\n');
    instansiLines.forEach((line) => {
      doc.text(line.trim().toUpperCase(), 105, startY, { align: 'center' });
      startY += 3.8;
    });
  }

  // 3. Nama Koperasi
  const subtitle = customSubtitle || (p.namaKoperasi || 'KOPERASI WARGA BAHAGIA').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  doc.text(subtitle, 105, startY + 1, { align: 'center' });
  startY += 5.5;

  // 4. Badan Hukum
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(p.badanHukum || 'Badan Hukum Koperasi Pegawai Republik Indonesia - KPRI Warga Bahagia', 105, startY, { align: 'center' });
  startY += 4.2;

  // 5. Alamat & Kontak
  const contactParts: string[] = [];
  if (p.alamatKoperasi) contactParts.push(p.alamatKoperasi);
  if (p.teleponKoperasi) contactParts.push(`Telp: ${p.teleponKoperasi}`);
  if (p.emailKoperasi) contactParts.push(`Email: ${p.emailKoperasi}`);
  if (p.websiteKoperasi) contactParts.push(`Web: ${p.websiteKoperasi}`);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(contactParts.join(' · '), 105, startY, { align: 'center' });
  startY += 3.5;

  // 6. Garis Pembatas Kop Resmi (Double Lines)
  doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  doc.setLineWidth(0.8);
  doc.line(14, startY, 196, startY);
  doc.setLineWidth(0.2);
  doc.line(14, startY + 1.2, 196, startY + 1.2);
  startY += 7.5;

  // 7. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 105, startY, { align: 'center' });
  startY += 4.5;

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${printDate}`, 105, startY, { align: 'center' });

  return startY + 4.5;
}

/**
 * Draws official cooperative sign-off blocks dynamically from settings.
 */
export function drawOfficialSignatures(doc: jsPDF, startY: number): number {
  const p = StorageService.getPengaturan();

  if (startY < 250) {
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Mengetahui,', 25, startY);
    doc.text(`Ketua ${p.namaKoperasi || 'Koperasi Warga Bahagia'}`, 25, startY + 4.5);
    doc.text('Bendahara Koperasi', 145, startY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`( ${p.namaKetua || 'Drs. H. Ahmad Sudrajat, M.Pd.'} )`, 25, startY + 23);
    if (p.nipKetua) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`NIP. ${p.nipKetua}`, 25, startY + 27);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`( ${p.namaBendahara || 'Hj. Siti Rohmah, S.Pd.'} )`, 145, startY + 23);
    if (p.nipBendahara) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`NIP. ${p.nipBendahara}`, 145, startY + 27);
    }
  }

  // Catatan Kaki Resmi (Footer Note)
  if (p.catatanKakiKop) {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(p.catatanKakiKop, 105, pageHeight - 8, { align: 'center' });
  }

  return startY + 30;
}
