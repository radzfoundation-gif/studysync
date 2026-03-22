"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function SettingsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [studentSchoolData, setStudentSchoolData] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      if (profile.role === 'student' && profile.nisn) {
        fetchStudentSchoolData(profile.nisn);
      }
    }
  }, [profile]);

  const fetchStudentSchoolData = async (nisnNum: string) => {
    const { data } = await supabase
      .from('student_data')
      .select('*')
      .eq('nisn', nisnNum)
      .single();
    if (data) setStudentSchoolData(data);
  };

  if (authLoading) return <LoadingScreen message="Memuat Pengaturan..." />;
  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    
    if (error) {
      alert("Gagal menyimpan profil: " + error.message);
    } else {
      // Reload page to refresh profile context
      window.location.reload();
    }
    setIsSaving(false);
  };

  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || user.email || 'User')}&background=0ea5e9&color=fff&size=256`;
  const roleDisplay = profile?.role === 'teacher' ? 'Guru (Teacher)' : 'Siswa (Student)';

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-0 font-body">
      {/* TopAppBar */}
      <header className="bg-transparent sticky top-0 w-full z-50 flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-primary font-headline">Pengaturan</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-8 px-4 pb-12">
        {/* Profile Header */}
        <section className="bg-surface-container-lowest rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center gap-6 border border-outline-variant/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative group cursor-pointer z-10">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-md">
              <img alt="Profile Avatar" className="w-full h-full object-cover" src={avatarUrl} />
            </div>
          </div>
          <div className="text-center md:text-left flex-1 z-10">
            <h2 className="text-2xl font-bold font-headline text-on-surface">{profile?.full_name || 'Pengguna Tanpa Nama'}</h2>
            <p className="text-on-surface-variant font-medium">{user.email}</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-primary-container text-on-primary-container text-xs font-semibold rounded-full uppercase tracking-wider">
              Role: {roleDisplay}
            </div>

            {studentSchoolData && (
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Data Sekolah Terverifikasi</p>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                   <div>
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-0.5">Sekolah</p>
                      <p className="text-xs font-bold text-on-surface">{studentSchoolData.school_name}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-0.5">Kelas</p>
                      <p className="text-xs font-bold text-on-surface">{studentSchoolData.class_name}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-0.5">NISN</p>
                      <p className="text-xs font-black text-primary tracking-[0.2em]">{studentSchoolData.nisn}</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Account Settings */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                <h3 className="text-lg font-bold font-headline">Akun Saya</h3>
              </div>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving || fullName === profile?.full_name}
                className="text-sm font-bold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface-variant">Nama Lengkap</label>
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-transparent" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface-variant">Alamat Email</label>
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-outline-variant opacity-60 bg-surface-container-lowest cursor-not-allowed" 
                  type="email" 
                  value={user.email || ""} 
                  disabled 
                />
                <span className="text-[10px] text-on-surface-variant">Email tidak dapat diubah dari halaman ini.</span>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              <h3 className="text-lg font-bold font-headline">Preferensi</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Notifikasi Email</p>
                  <p className="text-xs text-on-surface-variant">Kabar terbaru & pengingat</p>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative p-0.5 cursor-pointer transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 transition-transform"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-sm">Mode Gelap (Dark Mode)</p>
                  <p className="text-xs text-on-surface-variant">Sistem default: Terang</p>
                </div>
                <div className="w-10 h-5 bg-surface-variant border border-outline-variant rounded-full relative p-0.5 cursor-pointer transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 transition-transform shadow-sm"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="md:col-span-2 bg-error-container/20 border border-error/20 rounded-xl p-6 mt-4">
            <h3 className="text-lg font-bold font-headline text-error mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span> Zona Berbahaya
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="font-bold">Keluar atau Hapus Akun</p>
                <p className="text-sm text-on-surface-variant">Sesi Anda di perangkat ini akan diakhiri secara aman.</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button onClick={handleLogout} className="flex-1 md:flex-none px-6 py-2 border border-error/50 text-error font-semibold rounded-lg hover:bg-error/10 transition-colors text-center shadow-sm bg-white">
                  Keluar (Logout)
                </button>
              </div>
            </div>
          </section>

        </div>
        {/* Logout Section */}
        <section className="bg-white rounded-[32px] p-8 md:p-10 border border-outline-variant/30 shadow-sm">
          <h2 className="text-xl font-bold font-headline mb-6 text-on-surface">Keluar Sesi</h2>
          <p className="text-sm text-on-surface-variant font-medium mb-8 leading-relaxed">
            Pastikan Anda telah menyimpan semua perubahan sebelum keluar dari akun StudySync Anda.
          </p>
          <button 
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
            className="w-full sm:w-auto px-10 py-4 bg-error-container text-on-error-container rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-error hover:text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-error/5"
          >
            <span className="material-symbols-outlined">logout</span>
            Keluar Sekarang
          </button>
        </section>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-2 pb-safe bg-background/90 backdrop-blur-md border-t border-outline-variant/10 shadow-lg rounded-t-xl z-50">
        <Link href={profile?.role === 'teacher' ? "/dashboard-teacher" : "/dashboard"} className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:opacity-70 transition-colors">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-1">Beranda</span>
        </Link>
        <Link href="/rooms" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:opacity-70 transition-colors">
          <span className="material-symbols-outlined">group</span>
          <span className="text-[10px] font-medium mt-1">Kelas</span>
        </Link>
        <div className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-xl px-4 py-1.5 active:opacity-70 transition-colors">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          <span className="text-[10px] font-bold mt-1">Pengaturan</span>
        </div>
      </nav>
    </div>
  );
}
