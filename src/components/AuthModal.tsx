"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'student' | 'teacher';
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialRole = 'student', initialMode = 'login' }: AuthModalProps) {
  const [role, setRole] = useState<'student' | 'teacher'>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setFullName('');
    }
  }, [isOpen, initialRole, initialMode]);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    
    if (mode === 'register' && !fullName) {
      setError("Nama lengkap wajib diisi");
      return;
    }
    
    setLoading(true);

    try {
      if (mode === 'login') {
        if (role === 'teacher') {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) throw signInError;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (profile?.role === 'teacher') {
              localStorage.setItem('teacherSession', JSON.stringify({
                email: user.email,
                full_name: user.user_metadata?.full_name,
                id: user.id
              }));
              router.push('/dashboard-teacher');
            } else {
              await supabase.auth.signOut();
              throw new Error("Akun ini bukan akun Guru. Gunakan portal yang sesuai.");
            }
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) throw signInError;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            router.push('/dashboard');
          }
        }
      } else {
        if (role === 'teacher') {
          setError("Pendaftaran guru dilakukan oleh Tata Usaha. Hubungi admin sekolah.");
          setLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              role: role 
            }
          }
        });
        
        if (signUpError) throw signUpError;

        if (signUpData.user && !signUpData.session) {
          setShowSuccess(true);
          setLoading(false);
          return;
        }

        if (signUpData.session) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
          } catch (e) {
            console.error("Gagal mengirim email welcome", e);
          }
          router.push('/dashboard');
        }
      }

      setLoading(false);
      onClose();

    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat otentikasi");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors z-10"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {showSuccess ? (
          <div className="p-10 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                mail
              </span>
            </div>
            <h3 className="text-2xl font-black text-on-surface mb-3 font-headline">
              Cek Email Anda!
            </h3>
            <p className="text-on-surface-variant font-medium leading-relaxed mb-8">
              Kami telah mengirimkan tautan verifikasi ke {email}. Silakan klik tautan tersebut untuk mengaktifkan akun StudySync Anda.
            </p>
            <button 
              onClick={onClose}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              Mengerti
            </button>
          </div>
        ) : (
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'teacher' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {role === 'teacher' ? 'school' : 'person'}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-on-surface font-headline mb-2 leading-tight tracking-tight">
                {mode === 'login' ? 'Selamat Datang!' : 'Buat Akun Baru'}
              </h2>
              <p className="text-on-surface-variant font-medium text-sm">
                {role === 'teacher' ? 'Masuk sebagai Guru' : 'Masuk sebagai Siswa'}
              </p>
            </div>

            <div className="flex bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-1 mb-6">
              <button 
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'teacher' ? 'bg-primary text-white shadow-md' : 'text-on-surface hover:bg-surface-container'}`}
              >
                Guru
              </button>
              <button 
                onClick={() => setRole('student')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'student' ? 'bg-blue-500 text-white shadow-md' : 'text-on-surface hover:bg-surface-container'}`}
              >
                Siswa
              </button>
            </div>

            <div className="flex bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-1 mb-6">
              <button 
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-surface text-on-surface shadow-md border border-outline-variant/30' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                Masuk
              </button>
              <button 
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-surface text-on-surface shadow-md border border-outline-variant/30' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                Daftar
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-error-container/20 border border-error/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[18px]">error</span>
                <p className="text-xs text-error font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-3">
                {mode === 'register' && (
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nama Lengkap" 
                    className="w-full px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 text-sm" 
                  />
                )}
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
                    {role === 'teacher' ? 'Email' : 'Email'}
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={role === 'teacher' ? "email@studysync.sch.id" : "Alamat Email"} 
                    className="w-full px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="w-full px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 text-sm" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-3.5 ${role === 'teacher' ? 'bg-primary' : 'bg-blue-500'} text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memproses...
                  </>
                ) : (
                  mode === 'login' ? 'Masuk' : 'Daftar Sekarang'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 rounded-xl bg-tertiary-container/20 border border-tertiary/20">
              <p className="text-center text-[11px] text-tertiary font-bold">
                Staff Tata Usaha?
              </p>
              <Link 
                href="/auth/staff"
                onClick={onClose}
                className="mt-2 flex items-center justify-center gap-2 py-2 bg-tertiary text-white rounded-lg font-bold text-xs hover:bg-tertiary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                Login Portal Tata Usaha
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] font-medium text-on-surface-variant/70 leading-relaxed">
              {role === 'teacher' 
                ? 'Akun guru dibuat oleh Tata Usaha sekolah.'
                : 'Dengan melanjutkan, Anda menyetujui Ketentuan & Privasi kami.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}