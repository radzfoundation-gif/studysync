"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";

export default function StaffLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      if (profile?.role === "staff" || profile?.role === "admin") {
        router.push("/dashboard-staff");
        return;
      }
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard-staff&role=staff`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Gagal login dengan Google: " + error.message);
      setIsGoogleLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Memuat..." />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-tertiary/5 via-surface to-surface-container-low flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-white flex items-center justify-center shadow-lg shadow-tertiary/30">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-on-surface mb-2">Portal Tata Usaha</h1>
          <p className="text-sm text-on-surface-variant">Masuk untuk mengelola data sekolah</p>
        </div>

        <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-xl shadow-tertiary/10 overflow-hidden">
          <div className="p-6 space-y-4">
            <p className="text-center text-xs text-on-surface-variant mb-4">
              Masuk dengan akun Google sekolah untuk akses Tata Usaha
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full py-3.5 bg-white border border-outline-variant/40 hover:bg-surface-container text-on-surface rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <span className="w-5 h-5 border-2 border-outline/30 border-t-primary rounded-full animate-spin"></span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Lanjutkan dengan Google
            </button>
          </div>

          <div className="px-6 py-4 bg-surface-container/30 border-t border-outline-variant/20">
            <p className="text-center text-[10px] text-on-surface-variant">
              Hanya staff resmi sekolah yang memiliki akses.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-tertiary transition-colors">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}