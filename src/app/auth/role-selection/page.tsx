"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import Link from "next/link";

export default function RoleSelectionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const selectRole = async (selectedRole: "student" | "teacher") => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          role: selectedRole,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || 'User'
        });

      if (profileError) throw profileError;

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { role: selectedRole },
      });

      if (authError) throw authError;

      // Redirect to correct dashboard
      const nextPath = selectedRole === "teacher" ? "/dashboard-teacher" : "/dashboard";
      router.push(nextPath);
    } catch (error: any) {
      alert("Gagal memperbarui peran: " + error.message);
      setLoading(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return <LoadingScreen message="Menyiapkan Sesi..." />;
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 font-body overflow-hidden bg-white">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_0%_0%,_#f0f9ff_0%,_transparent_50%),_radial-gradient(circle_at_100%_100%,_#e0f2fe_0%,_transparent_50%)] opacity-70"></div>
      
      {/* Batik Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ 
          backgroundImage: "url('/images/batik_background.png')", 
          backgroundSize: '1000px',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          filter: 'grayscale(100%) brightness(0.9)'
        }}
      ></div>

      <div className="w-full max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-16">
          <div className="flex flex-col items-center gap-2 mb-8">
            <span className="text-4xl font-black text-primary tracking-tighter font-headline drop-shadow-sm">StudySync</span>
            <div className="h-1.5 w-16 bg-primary/20 rounded-full"></div>
          </div>
          <h1 className="text-4xl font-black text-on-surface font-headline mb-4 tracking-tight">Pilih Peran Anda</h1>
          <p className="text-on-surface-variant font-bold text-lg max-w-lg mx-auto">
            Selamat datang di StudySync! Untuk memberikan pengalaman terbaik, beri tahu kami siapa Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {/* Card Teacher */}
          <button 
            onClick={() => selectRole("teacher")}
            disabled={loading}
            className="group relative bg-white rounded-[48px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden disabled:opacity-50"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            
            <h2 className="text-2xl font-black text-on-surface font-headline mb-4 group-hover:text-primary transition-colors">Saya adalah Guru</h2>
            <p className="text-on-surface-variant font-medium text-sm leading-relaxed mb-8">
              Saya ingin membuat kelas, membagikan materi, dan memandu siswa belajar menggunakan AI.
            </p>
            
            <div className="mt-auto px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 group-hover:scale-105 transition-all">
              Mulai Mengajar
            </div>
          </button>

          {/* Card Student */}
          <button 
            onClick={() => selectRole("student")}
            disabled={loading}
            className="group relative bg-white rounded-[48px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden disabled:opacity-50"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 -rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            
            <h2 className="text-2xl font-black text-on-surface font-headline mb-4 group-hover:text-primary transition-colors">Saya adalah Siswa</h2>
            <p className="text-on-surface-variant font-medium text-sm leading-relaxed mb-8">
              Saya ingin mencatat, berdiskusi di ruang belajar, dan meningkatkan nilai dengan AI Tutor.
            </p>
            
            <div className="mt-auto px-8 py-3 bg-slate-100 text-on-surface font-black text-xs uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all rounded-2xl">
              Mulai Belajar
            </div>
          </button>
        </div>

        <div className="mt-16 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                Pilihan ini akan menentukan fitur dashboard Anda. <br /> Anda dapat mengubahnya nanti di pengaturan akun.
            </p>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-primary animate-pulse tracking-widest uppercase text-xs">Menyiapkan Ruang Anda...</p>
            </div>
        </div>
      )}
    </div>
  );
}
