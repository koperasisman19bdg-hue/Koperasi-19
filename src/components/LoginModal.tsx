import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import defaultLogoImg from '../assets/images/lambang_koperasi.jpg';
import { StorageService } from '../utils/storage';

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
    const current = StorageService.getPengaturan();
    setPengaturan(current);
  }, []);

  const currentLogo = pengaturan.logoUrl || defaultLogoImg;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const activePengaturan = StorageService.getPengaturan();
      const validUser = activePengaturan.username || 'Warga Bahagia';
      const validPass = activePengaturan.password || '19';

      if (username.trim() === validUser.trim() && password === validPass) {
        StorageService.login();
        onSuccess();
      } else {
        setError('Username atau Password salah!');
      }
      setIsLoading(false);
    }, 250);
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

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-500/30 text-[11px] text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Autentikasi Pengurus Terverifikasi</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
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
        </form>
      </div>
    </div>
  );
};
