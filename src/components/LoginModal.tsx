import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Cloud } from 'lucide-react';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import { StorageService } from '../utils/storage';
import { signInWithGoogleDrive } from '../services/googleDriveService';

interface LoginModalProps {
  onSuccess: () => void;
  onOpenPublicForm: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onOpenPublicForm }) => {
  const [pengaturan, setPengaturan] = useState(() => StorageService.getPengaturan());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPengaturan(StorageService.getPengaturan());
    };
    window.addEventListener('kwb-pengaturan-changed', handleUpdate);
    return () => {
      window.removeEventListener('kwb-pengaturan-changed', handleUpdate);
    };
  }, []);

  const currentLogo = pengaturan.logoUrl || defaultLogoImg;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await StorageService.authenticateAdmin(username, password);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Username atau Password salah!');
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke server. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogleDrive();
      StorageService.login();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Akun Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center overflow-hidden">
            <img
              src={currentLogo}
              alt="Logo Koperasi Warga Bahagia"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {pengaturan.namaKoperasi || 'Koperasi Warga Bahagia'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
            Portal Administrasi Pengurus & Manajemen Keuangan Koperasi
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-[10px] text-emerald-200 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Admin Tunggal Terpadu</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-900/60 border border-teal-500/40 text-[10px] text-teal-200 font-medium">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Sinkronisasi Real-Time Multi-Perangkat</span>
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed text-center">
            Perangkat lain yang masuk dengan username & password admin ini akan otomatis membuka <strong>data yang sama</strong> secara sinkron.
          </div>
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span>Memeriksa Akses...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-500 font-medium">atau masuk via</span>
            </div>
          </div>

          {/* Sign in with Google Button (per SKILL.md) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs border border-slate-300 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span>Masuk dengan Akun Google Drive</span>
          </button>
        </form>
      </div>
    </div>
  );
};
