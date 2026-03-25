"use client";

import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingScreen from "@/components/LoadingScreen";
import StatusModal from "@/components/StatusModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const OverviewTab = dynamic(() => import("@/components/dashboard-staff/OverviewTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-64"></div> });
const StudentsTab = dynamic(() => import("@/components/dashboard-staff/StudentsTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-80"></div> });
const TeachersTab = dynamic(() => import("@/components/dashboard-staff/TeachersTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-80"></div> });
const ClassesTab = dynamic(() => import("@/components/dashboard-staff/ClassesTab"), { loading: () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">{[1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-container rounded-2xl animate-pulse"></div>)}</div> });
const ReportsTab = dynamic(() => import("@/components/dashboard-staff/ReportsTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-48"></div> });

export default function StaffDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [verifiedRole, setVerifiedRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  });

  const showStatus = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    assignments: 0
  });

  useEffect(() => {
    const verifyAccess = async () => {
      setIsVerifying(true);
      
      if (!user) {
        setVerifiedRole(null);
        setIsVerifying(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error);
        }
        
        setVerifiedRole(profileData?.role || null);
      } catch (error) {
        console.error("Error verifying role:", error);
        setVerifiedRole(null);
      }
      
      setIsVerifying(false);
    };

    if (authLoading) return;
    verifyAccess();
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || isVerifying) return;
    if (!user) return;
    const effective = verifiedRole || profile?.role;
    if (effective !== 'staff' && effective !== 'admin') return;

    const fetchStats = async () => {
      setLoadingProgress(20);
      try {
        const [sRes, tRes, cRes, aRes] = await Promise.all([
          supabase.from('student_data').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          supabase.from('assignments').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          students: sRes.count || 0,
          teachers: tRes.count || 0,
          classes: cRes.count || 0,
          assignments: aRes.count || 0
        });
        setLoadingProgress(100);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchStats();

    const channel = supabase.channel('realtime_staff_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_data' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, isVerifying, verifiedRole]);

  const effectiveRole = verifiedRole || profile?.role;

  if (authLoading || isVerifying) {
    return <LoadingScreen message="Menyiapkan Panel Tata Usaha..." progress={loadingProgress} />;
  }

  if (!user || (effectiveRole !== 'staff' && effectiveRole !== 'admin')) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface p-6">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-error mb-4">lock</span>
          <h1 className="text-2xl font-black text-on-surface mb-2">Akses Ditolak</h1>
          <p className="text-on-surface-variant mb-2">Halaman ini hanya dapat diakses oleh Tata Usaha.</p>
          <p className="text-xs text-error mb-6">Role saat ini: {effectiveRole || 'tidak ditemukan'}</p>
          
          <div className="flex flex-col gap-3">
            <Link href="/" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all">
              Kembali ke Beranda
            </Link>
            
            <button 
              onClick={async () => {
                if (!user) return;
                
                const userEmail = user.email || '';
                const userName = user.user_metadata?.full_name || 'Staff';
                
                const { error: delError } = await supabase.from('profiles').delete().eq('id', user.id);
                if (delError) {
                  console.warn('Delete error (ok):', delError.message);
                }
                
                const { error: insertError } = await supabase.from('profiles').insert({ 
                  id: user.id, 
                  role: 'staff',
                  email: userEmail,
                  full_name: userName
                });
                
                if (insertError) {
                  alert('Gagal: ' + insertError.message);
                } else {
                  alert('Role berhasil diperbaiki! Halaman akan dimuat ulang.');
                  window.location.reload();
                }
              }}
              className="px-6 py-3 bg-tertiary text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              Perbaiki Role → Staff
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', icon: 'dashboard', label: 'Overview' },
    { id: 'students', icon: 'school', label: 'Data Siswa' },
    { id: 'teachers', icon: 'groups', label: 'Data Guru' },
    { id: 'classes', icon: 'meeting_room', label: 'Kelas' },
    { id: 'reports', icon: 'assessment', label: 'Laporan' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body flex h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container text-sm">
      <aside className="w-56 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col hidden md:flex z-20">
        <div className="h-14 flex items-center px-5 border-b border-outline-variant/30 shrink-0">
          <Link href="/" className="text-xl font-black text-primary tracking-tighter font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            StudySync
          </Link>
        </div>

        <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
            {profile?.full_name?.substring(0, 2) || 'TU'}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface leading-none mb-1">{profile?.full_name || 'Staff User'}</p>
            <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Tata Usaha</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 mt-1">Menu</p>
          
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${activeTab === item.id ? 'bg-tertiary-container/40 text-tertiary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
            </button>
          ))}

          {(profile?.role === 'admin' || profile?.role === 'staff') && (
            <>
              <p className="px-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 mt-6">Akses Lain</p>
              <Link href="/dashboard-teacher" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl font-bold transition-all group w-full">
                <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">class</span>
                Dashboard Guru
              </Link>
            </>
          )}

          <p className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 mt-6">Settings</p>
          
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl font-semibold transition-all group w-full">
            <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">settings</span>
            Pengaturan
          </Link>
        </nav>

        <div className="p-3 border-t border-outline-variant/30 shrink-0">
          <button 
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container/20 rounded-xl font-bold transition-all w-full text-left"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-container-lowest md:bg-transparent">
        <header className="h-14 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-outline-variant/20 flex items-center justify-between px-6 z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h1 className="text-lg font-bold font-headline tracking-tight hidden sm:block capitalize">
              {menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-surface-container-low border border-outline-variant/30 rounded-full px-3 py-1.5 w-60 focus-within:border-tertiary focus-within:ring-2 focus-within:ring-tertiary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-full text-on-surface placeholder:text-on-surface-variant" />
            </div>
            <button className="relative p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors hidden sm:block">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<LoadingScreen message="Memuat Konten..." />}>
              {activeTab === 'overview' && <OverviewTab stats={stats} />}
              {activeTab === 'students' && <StudentsTab onShowStatus={showStatus} />}
              {activeTab === 'teachers' && <TeachersTab />}
              {activeTab === 'classes' && <ClassesTab />}
              {activeTab === 'reports' && <ReportsTab stats={stats} />}
            </Suspense>
          </div>
        </div>

        <StatusModal 
          isOpen={statusModal.isOpen} 
          onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
        />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 sm:px-4 pb-safe pt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-12_40px_rgba(0,0,0,0.04)] text-[9px] font-bold text-outline uppercase tracking-wider">
        {menuItems.slice(0, 5).map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center px-1 sm:px-3 py-2 ${activeTab === item.id ? 'text-tertiary' : 'text-on-surface-variant hover:text-tertiary transition-colors'}`}
          >
            <span className="material-symbols-outlined mb-1 text-[20px]" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
            <span className="scale-90 sm:scale-100 origin-bottom">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}