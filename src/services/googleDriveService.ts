import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { StorageService } from '../utils/storage';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.metadata'
];

export const DRIVE_DATABASE_FILENAME = 'koperasi_warga_bahagia_database.json';

// Initialize Firebase App & Auth
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach(scope => provider.addScope(scope));

// In-Memory Token Cache (per SKILL.md: DO NOT store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
let driveFileId: string | null = null;
let lastDriveModifiedTime: string | null = null;
let isSyncingToDrive = false;
let isPullingFromDrive = false;
let autoSyncDebounceTimer: any = null;
let backgroundPollInterval: any = null;

export interface DriveSyncStatus {
  isConnected: boolean;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  fileId: string | null;
  fileName: string;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  statusMessage: string;
  error?: string | null;
}

let currentDriveStatus: DriveSyncStatus = {
  isConnected: false,
  user: null,
  fileId: null,
  fileName: DRIVE_DATABASE_FILENAME,
  lastSyncedAt: null,
  isSyncing: false,
  statusMessage: 'Belum terhubung ke Google Drive',
  error: null
};

function updateStatus(patch: Partial<DriveSyncStatus>) {
  currentDriveStatus = { ...currentDriveStatus, ...patch };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kwb-drive-status-changed', { detail: currentDriveStatus }));
  }
}

export function getDriveSyncStatus(): DriveSyncStatus {
  return currentDriveStatus;
}

export function getAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Initialize Auth State Listener on App Load
 */
export function initDriveAuth(
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      updateStatus({
        isConnected: true,
        user: {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        },
        statusMessage: `Terhubung sebagai ${user.email}`
      });
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        driveFileId = null;
        updateStatus({
          isConnected: false,
          user: null,
          fileId: null,
          statusMessage: 'Belum terhubung ke Google Drive'
        });
        if (onFailure) onFailure();
      }
    }
  });
}

/**
 * Sign In with Google & request Drive Scopes
 */
export async function signInWithGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    updateStatus({ isSyncing: true, statusMessage: 'Menghubungkan ke Akun Google...' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan Access Token Google Drive dari autentikasi.');
    }

    cachedAccessToken = credential.accessToken;
    const user = result.user;

    updateStatus({
      isConnected: true,
      user: {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      },
      statusMessage: `Berhasil terhubung ke ${user.email}`,
      error: null
    });

    // Start background sync & poll
    startDriveSync();

    // Find or create database file on Drive
    await syncWithGoogleDrive(false);

    return { user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    updateStatus({
      isConnected: false,
      isSyncing: false,
      statusMessage: 'Gagal terhubung ke Google Drive',
      error: error.message || 'Gagal masuk dengan Google'
    });
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign Out from Google Drive
 */
export async function signOutFromGoogleDrive(): Promise<void> {
  stopDriveSync();
  await signOut(auth);
  cachedAccessToken = null;
  driveFileId = null;
  lastDriveModifiedTime = null;
  updateStatus({
    isConnected: false,
    user: null,
    fileId: null,
    isSyncing: false,
    statusMessage: 'Akun Google Drive telah diputuskan',
    error: null
  });
}

/**
 * Find or Create the Single Master Database File in Google Drive
 */
export async function findOrCreateDriveDatabaseFile(): Promise<string> {
  if (!cachedAccessToken) {
    throw new Error('Tidak ada akses token Google Drive. Silakan masuk terlebih dahulu.');
  }

  // 1. Search for existing file
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_DATABASE_FILENAME}' and trashed=false&fields=files(id,name,modifiedTime,size)&spaces=drive`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${cachedAccessToken}` }
  });

  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`Gagal mencari berkas di Google Drive: ${err}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const id = searchData.files[0].id as string;
    driveFileId = id;
    lastDriveModifiedTime = searchData.files[0].modifiedTime;
    updateStatus({ fileId: driveFileId, fileName: DRIVE_DATABASE_FILENAME });
    return id;
  }

  // 2. File doesn't exist yet -> Create it with current database snapshot
  const currentSnapshot = await getCurrentLocalSnapshot();
  const metadata = {
    name: DRIVE_DATABASE_FILENAME,
    mimeType: 'application/json',
    description: 'Basis Data Tunggal Resmi Sistem Informasi Manajemen Koperasi Pegawai Warga Bahagia SMA Negeri 19 Bandung'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(currentSnapshot, null, 2) +
    closeDelimiter;

  const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Gagal membuat berkas database di Google Drive: ${err}`);
  }

  const createdFile = await createRes.json();
  const id = createdFile.id as string;
  driveFileId = id;
  lastDriveModifiedTime = createdFile.modifiedTime;
  updateStatus({
    fileId: driveFileId,
    lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
    statusMessage: 'Berkas database Google Drive berhasil dibuat'
  });

  return id;
}

/**
 * Fetch and Adopt the Database from Google Drive
 */
export async function pullDatabaseFromGoogleDrive(): Promise<boolean> {
  if (!cachedAccessToken) return false;
  if (isPullingFromDrive || isSyncingToDrive) return false;

  try {
    isPullingFromDrive = true;
    updateStatus({ isSyncing: true, statusMessage: 'Mengunduh data terbaru dari Google Drive...' });

    const fileId = driveFileId || (await findOrCreateDriveDatabaseFile());
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Gagal membaca isi berkas dari Google Drive: ${res.statusText}`);
    }

    const driveData = await res.json();

    if (driveData && typeof driveData === 'object') {
      // Adopt drive data into local storage and backend server
      await adoptDriveDataToLocalAndServer(driveData);

      // Get updated modifiedTime
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`, {
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        lastDriveModifiedTime = meta.modifiedTime;
      }

      updateStatus({
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        statusMessage: 'Data berhasil disinkronkan dari Google Drive',
        error: null
      });

      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Pull from Google Drive Error:', error);
    updateStatus({
      isSyncing: false,
      statusMessage: 'Gagal mengunduh dari Google Drive',
      error: error.message || 'Kendala sinkronisasi Google Drive'
    });
    return false;
  } finally {
    isPullingFromDrive = false;
  }
}

/**
 * Push current database snapshot to Google Drive
 */
export async function pushDatabaseToGoogleDrive(explicitConfirmation = false): Promise<boolean> {
  if (!cachedAccessToken) return false;
  if (isSyncingToDrive) return false;

  try {
    isSyncingToDrive = true;
    updateStatus({ isSyncing: true, statusMessage: 'Menyimpan data ke Google Drive...' });

    const fileId = driveFileId || (await findOrCreateDriveDatabaseFile());
    const currentSnapshot = await getCurrentLocalSnapshot();

    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(currentSnapshot, null, 2)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal memperbarui berkas Google Drive: ${err}`);
    }

    const updated = await res.json();
    lastDriveModifiedTime = updated.modifiedTime || new Date().toISOString();

    updateStatus({
      isSyncing: false,
      lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      statusMessage: 'Data tersimpan ke Google Drive',
      error: null
    });

    return true;
  } catch (error: any) {
    console.error('Push to Google Drive Error:', error);
    updateStatus({
      isSyncing: false,
      statusMessage: 'Gagal menyimpan ke Google Drive',
      error: error.message || 'Kendala penyimpanan Google Drive'
    });
    return false;
  } finally {
    isSyncingToDrive = false;
  }
}

/**
 * Check if another device updated the Drive file
 */
export async function checkDriveForRemoteChanges(): Promise<boolean> {
  if (!cachedAccessToken || !driveFileId || isSyncingToDrive || isPullingFromDrive) {
    return false;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=modifiedTime`, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });

    if (res.ok) {
      const meta = await res.json();
      if (lastDriveModifiedTime && meta.modifiedTime && meta.modifiedTime !== lastDriveModifiedTime) {
        // Drive file was modified by another device -> Pull latest!
        return await pullDatabaseFromGoogleDrive();
      }
    }
  } catch (e) {
    // Network/quota warning
  }
  return false;
}

/**
 * Debounced Trigger to Save to Google Drive after any local change
 */
export function notifyDataChangedForDriveSync() {
  if (!cachedAccessToken) return;

  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
  }

  autoSyncDebounceTimer = setTimeout(() => {
    pushDatabaseToGoogleDrive(false).catch(err => {
      console.warn('Auto-sync to Google Drive error:', err);
    });
  }, 1000);
}

/**
 * Full Sync with Google Drive (Pull or Push based on latest version)
 */
export async function syncWithGoogleDrive(forcePush = false): Promise<boolean> {
  if (!cachedAccessToken) return false;

  try {
    const fileId = driveFileId || (await findOrCreateDriveDatabaseFile());
    if (forcePush) {
      return await pushDatabaseToGoogleDrive(true);
    } else {
      return await pullDatabaseFromGoogleDrive();
    }
  } catch (err: any) {
    console.error('Sync With Google Drive error:', err);
    return false;
  }
}

/**
 * Start Auto Background Sync & Remote Change Polling
 */
export function startDriveSync() {
  stopDriveSync();

  // Listen for local changes to trigger debounce sync to Drive
  if (typeof window !== 'undefined') {
    window.addEventListener('kwb-data-changed', notifyDataChangedForDriveSync);
    window.addEventListener('kwb-pengaturan-changed', notifyDataChangedForDriveSync);
    window.addEventListener('kwb-uploaded-posisi-changed', notifyDataChangedForDriveSync);
    window.addEventListener('kwb-uploaded-phu-changed', notifyDataChangedForDriveSync);
    window.addEventListener('kwb-ai-reports-changed', notifyDataChangedForDriveSync);

    // Poll Drive for changes from other laptops/smartphones every 15 seconds
    backgroundPollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        checkDriveForRemoteChanges();
      }
    }, 15000);

    // Immediate check on tab focus or screen unlock
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkDriveForRemoteChanges();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
  }
}

export function stopDriveSync() {
  if (backgroundPollInterval) {
    clearInterval(backgroundPollInterval);
    backgroundPollInterval = null;
  }
  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
    autoSyncDebounceTimer = null;
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('kwb-data-changed', notifyDataChangedForDriveSync);
    window.removeEventListener('kwb-pengaturan-changed', notifyDataChangedForDriveSync);
    window.removeEventListener('kwb-uploaded-posisi-changed', notifyDataChangedForDriveSync);
    window.removeEventListener('kwb-uploaded-phu-changed', notifyDataChangedForDriveSync);
    window.removeEventListener('kwb-ai-reports-changed', notifyDataChangedForDriveSync);
  }
}

/**
 * Helper: Build complete database snapshot
 */
async function getCurrentLocalSnapshot(): Promise<any> {
  return {
    anggota: StorageService.getAnggota(),
    jurnal: StorageService.getJurnal(),
    simpanan: StorageService.getSimpanan(),
    pinjamanUang: StorageService.getPinjamanUang(),
    pinjamanBarang: StorageService.getPinjamanBarang(),
    pengajuan: StorageService.getPengajuan(),
    toko: StorageService.getToko(),
    seragam: StorageService.getSeragam(),
    pengaturan: StorageService.getPengaturan(),
    uploadedPosisiKeuangan: StorageService.getUploadedPosisiKeuangan(),
    uploadedPHU: StorageService.getUploadedPHU(),
    aiReports: StorageService.getAIReports(),
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Helper: Adopt incoming snapshot from Drive
 */
async function adoptDriveDataToLocalAndServer(driveData: any): Promise<void> {
  const KEY_MAP: Record<string, string> = {
    anggota: 'kwb_anggota',
    jurnal: 'kwb_jurnal_umum',
    simpanan: 'kwb_simpanan',
    pinjamanUang: 'kwb_pinjaman_uang',
    pinjamanBarang: 'kwb_pinjaman_barang',
    pengajuan: 'kwb_pengajuan',
    toko: 'kwb_pembukuan_toko',
    seragam: 'kwb_pembukuan_seragam',
    pengaturan: 'kwb_pengaturan_akun',
    uploadedPosisiKeuangan: 'kwb_uploaded_posisi_keuangan',
    uploadedPHU: 'kwb_uploaded_phu',
    aiReports: 'kwb_ai_financial_reports'
  };

  Object.entries(KEY_MAP).forEach(([prop, storageKey]) => {
    if (driveData[prop] !== undefined) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(driveData[prop]));
      } catch (e) {}
    }
  });

  // Sync to Express backend database as well so backend is in sync
  try {
    await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driveData)
    });
  } catch (e) {
    // Backend offline / static fallback
  }

  // Dispatch all UI events
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kwb-data-changed'));
    window.dispatchEvent(new Event('koperasi-data-changed'));
    window.dispatchEvent(new Event('kwb-pengaturan-changed'));
    window.dispatchEvent(new Event('kwb-uploaded-posisi-changed'));
    window.dispatchEvent(new Event('kwb-uploaded-phu-changed'));
    window.dispatchEvent(new Event('kwb-ai-reports-changed'));

    // Visual notification banner for multi-device sync
    window.dispatchEvent(new CustomEvent('kwb-remote-change', {
      detail: {
        entityName: 'Basis Data Google Drive',
        key: 'google_drive',
        timestamp: new Date().toISOString()
      }
    }));
  }
}
