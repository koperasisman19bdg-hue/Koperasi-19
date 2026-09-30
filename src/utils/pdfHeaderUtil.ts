import jsPDF from 'jspdf';
import { StorageService } from './storage';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';

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

// In-memory cache for converted Data URLs of static asset images
let cachedDefaultLogoDataUrl: string = '';
let cachedDefaultLogoImgEl: HTMLImageElement | null = null;
const imageCache = new Map<string, string>();

// Helper to convert any image URL/asset into a base64 Data URL using a temporary canvas
export function convertImageToDataUrl(src: string): Promise<string> {
  if (!src) return Promise.resolve('');
  if (src.startsWith('data:image')) return Promise.resolve(src);
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          imageCache.set(src, dataUrl);
          resolve(dataUrl);
          return;
        }
      } catch (e) {
        console.warn('Canvas conversion failed for logo:', e);
      }
      resolve('');
    };
    img.onerror = () => {
      console.warn('Image failed to load for canvas conversion:', src);
      resolve('');
    };
    img.src = src;
  });
}

// Preload default logo on module load
if (typeof window !== 'undefined') {
  try {
    cachedDefaultLogoImgEl = new Image();
    cachedDefaultLogoImgEl.crossOrigin = 'Anonymous';
    cachedDefaultLogoImgEl.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = cachedDefaultLogoImgEl!.naturalWidth || 200;
        canvas.height = cachedDefaultLogoImgEl!.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(cachedDefaultLogoImgEl!, 0, 0);
          cachedDefaultLogoDataUrl = canvas.toDataURL('image/png');
          imageCache.set(defaultLogoImg, cachedDefaultLogoDataUrl);
        }
      } catch {}
    };
    cachedDefaultLogoImgEl.src = defaultLogoImg;
  } catch {}
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

function detectImageFormat(url: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (!url) return 'PNG';
  if (url.startsWith('data:image/png') || url.toLowerCase().includes('.png')) return 'PNG';
  if (url.startsWith('data:image/webp') || url.toLowerCase().includes('.webp')) return 'WEBP';
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg') || url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) return 'JPEG';
  return 'PNG';
}

/**
 * Safely adds an image (whether Data URL, Image element, or cached asset) to jsPDF document.
 */
function safeAddImageToDoc(doc: jsPDF, imageSource: string, x: number, y: number, w: number, h: number): boolean {
  if (!imageSource) return false;

  // 1. If it's already a Data URI
  if (imageSource.startsWith('data:image')) {
    try {
      const format = detectImageFormat(imageSource);
      doc.addImage(imageSource, format, x, y, w, h);
      return true;
    } catch (err) {
      try {
        // Fallback without explicit format parameter
        doc.addImage(imageSource, 'PNG', x, y, w, h);
        return true;
      } catch (e2) {
        console.warn('Gagal menambahkan data URL gambar ke PDF:', e2);
      }
    }
  }

  // 2. Check if we have cached Data URL in map
  if (imageCache.has(imageSource)) {
    try {
      const cached = imageCache.get(imageSource)!;
      doc.addImage(cached, 'PNG', x, y, w, h);
      return true;
    } catch {}
  }

  // 3. If defaultLogoDataUrl exists
  if (cachedDefaultLogoDataUrl) {
    try {
      doc.addImage(cachedDefaultLogoDataUrl, 'PNG', x, y, w, h);
      return true;
    } catch {}
  }

  // 4. Try using the loaded HTMLImageElement directly if available
  if (cachedDefaultLogoImgEl && cachedDefaultLogoImgEl.complete && cachedDefaultLogoImgEl.naturalWidth > 0) {
    try {
      doc.addImage(cachedDefaultLogoImgEl, 'PNG', x, y, w, h);
      return true;
    } catch {}
  }

  // 5. Try direct addImage as last resort
  try {
    const format = detectImageFormat(imageSource);
    doc.addImage(imageSource, format, x, y, w, h);
    return true;
  } catch (err) {
    console.warn('Gagal memuat logo PDF:', err);
    return false;
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

  // 1. Logo Kiri Kop Surat (Gunakan Logo Custom atau Fallback Lambang Koperasi)
  if (p.tampilkanLogoKiriKop !== false) {
    const leftLogo = p.logoUrl || cachedDefaultLogoDataUrl || defaultLogoImg;
    safeAddImageToDoc(doc, leftLogo, 14, 8, 18, 18);
  }

  // 2. Logo Kanan Kop Surat (Gunakan Logo Kanan atau Logo Sekolah / Logo Kiri)
  if (p.tampilkanLogoKananKop !== false) {
    const rightLogo = p.logoKananUrl || p.logoUrl || cachedDefaultLogoDataUrl || defaultLogoImg;
    safeAddImageToDoc(doc, rightLogo, 178, 8, 18, 18);
  }

  // 3. Instansi Induk (jika ada)
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

  // 4. Nama Koperasi
  const subtitle = customSubtitle || (p.namaKoperasi || 'KOPERASI WARGA BAHAGIA').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  doc.text(subtitle, 105, startY + 1, { align: 'center' });
  startY += 5.5;

  // 5. Badan Hukum
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(p.badanHukum || 'Badan Hukum Koperasi Pegawai Republik Indonesia - KPRI Warga Bahagia', 105, startY, { align: 'center' });
  startY += 4.2;

  // 6. Alamat & Kontak
  const contactParts: string[] = [];
  if (p.alamatKoperasi) contactParts.push(p.alamatKoperasi);
  if (p.teleponKoperasi) contactParts.push(`Telp: ${p.teleponKoperasi}`);
  if (p.emailKoperasi) contactParts.push(`Email: ${p.emailKoperasi}`);
  if (p.websiteKoperasi) contactParts.push(`Web: ${p.websiteKoperasi}`);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(contactParts.join(' · '), 105, startY, { align: 'center' });
  startY += 3.5;

  // 7. Garis Pembatas Kop Resmi (Double Lines)
  doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  doc.setLineWidth(0.8);
  doc.line(14, startY, 196, startY);
  doc.setLineWidth(0.2);
  doc.line(14, startY + 1.2, 196, startY + 1.2);
  startY += 7.5;

  // 8. Document Title
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

