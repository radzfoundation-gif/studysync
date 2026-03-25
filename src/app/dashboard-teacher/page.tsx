"use client";

import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import CreateClassModal from "@/components/CreateClassModal";
import ShareLinkModal from "@/components/ShareLinkModal";
import TeacherOnboarding from "@/components/TeacherOnboarding";
import LoadingScreen from "@/components/LoadingScreen";
import StatusModal from "@/components/StatusModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Lazy-load Tab Components
const OverviewTab = dynamic(() => import("@/components/dashboard-teacher/OverviewTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-64"></div> });
const StudentsTab = dynamic(() => import("@/components/dashboard-teacher/StudentsTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-80"></div> });
const ClassesTab = dynamic(() => import("@/components/dashboard-teacher/ClassesTab"), { loading: () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">{[1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-container rounded-2xl animate-pulse"></div>)}</div> });
const AssignmentsTab = dynamic(() => import("@/components/dashboard-teacher/AssignmentsTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-48"></div> });
const QuizMakerTab = dynamic(() => import("@/components/dashboard-teacher/QuizMakerTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-96"></div> });
const AttendanceTab = dynamic(() => import("@/components/dashboard-teacher/AttendanceTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-80"></div> });
const ComplaintsTab = dynamic(() => import("@/components/dashboard-teacher/ComplaintsTab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-64"></div> });
const AITab = dynamic(() => import("@/components/dashboard-teacher/AITab"), { loading: () => <div className="p-10 animate-pulse bg-surface-container rounded-2xl h-48"></div> });

export default function TeacherDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareClassName, setShareClassName] = useState('');
  const [shareId, setShareId] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  });

  const showStatus = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(err => {
      console.warn("Audio playback delayed until user interaction:", err.message);
    });
  };

  // Unlock audio on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.muted = true;
      audio.play().then(() => {
        console.log("Audio unlocked successfully");
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }).catch(() => {});
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsCheckingOnboarding(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingProgress(20);
        
        // Use profile from useAuth if available, otherwise just continue
        // We don't need to re-fetch it here
        setLoadingProgress(40);

        const [classesRes, assignmentsRes] = await Promise.all([
          supabase.from('classes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('assignments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        setLoadingProgress(80);

        if (classesRes.data) {
          setClasses(classesRes.data);
          const skipped = localStorage.getItem(`onboarding_skipped_${user.id}`);
          if (classesRes.data.length === 0 && !skipped) {
            setShowOnboarding(true);
          }
        }
        
        if (assignmentsRes.data) {
          setAssignments(assignmentsRes.data);
        }

        setLoadingProgress(100);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        // Beri waktu sejenak agar user melihat 100%
        setTimeout(() => {
          setIsCheckingOnboarding(false);
        }, 400);
      }
    };

    fetchData();

    const channelC = supabase.channel(`realtime_classes_teacher_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classes',
        filter: `user_id=eq.${user.id}`
      }, () => fetchData())
      .subscribe();
      
    const channelA = supabase.channel(`realtime_assignments_teacher_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'assignments',
        filter: `user_id=eq.${user.id}`
      }, () => fetchData())
      .subscribe();

    const channelComplaints = supabase.channel(`realtime_complaints_teacher`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'student_complaints'
      }, () => {
        playNotificationSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelC);
      supabase.removeChannel(channelA);
      supabase.removeChannel(channelComplaints);
    };
  }, [user, authLoading]);

  if (authLoading || isCheckingOnboarding) {
    return <LoadingScreen message="Menyiapkan Ruang Guru..." progress={loadingProgress} />;
  }

  if (showOnboarding) {
    return (
      <TeacherOnboarding 
        onComplete={() => {
           setShowOnboarding(false);
           window.location.reload();
        }} 
        onSkip={() => {
           localStorage.setItem(`onboarding_skipped_${user?.id}`, 'true');
           setShowOnboarding(false);
        }} 
      />
    );
  }

  const handleCreateClass = async (data: any) => {
    if (!user) return;
    const { error } = await supabase.from('classes').insert([{ ...data, user_id: user.id }]);
    if (error) {
      showStatus('error', 'Gagal Membuat Kelas', error.message);
    } else {
      // Refresh the classes list
      const { data: cData } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (cData) setClasses(cData);
    }
  };

  const menuItems = [
    { id: 'overview', icon: 'dashboard', label: 'Overview' },
    { id: 'students', icon: 'people', label: 'Students' },
    { id: 'classes', icon: 'meeting_room', label: 'Classes & Rooms' },
    { id: 'assignments', icon: 'assignment', label: 'Assignments', badge: assignments.length || undefined },
    { id: 'quiz', icon: 'sports_esports', label: 'Quiz Maker', badge: 'Baru' },
    { id: 'attendance', icon: 'assignment_turned_in', label: 'Absensi Siswa' },
    { id: 'complaints', icon: 'chat_error', label: 'Keluhan Siswa', badge: undefined },
    { id: 'ai-assistant', icon: 'smart_toy', label: 'AI Assistant' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body flex h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container text-sm">
      
      {/* Left Sidebar (Admin Style) - Compacted */}
      <aside className="w-56 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col hidden md:flex z-20">
        {/* Brand/Logo */}
        <div className="h-14 flex items-center px-5 border-b border-outline-variant/30 shrink-0">
          <Link href="/" className="text-xl font-black text-primary tracking-tighter font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            StudySync
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary-fixed flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
            {profile?.full_name?.substring(0, 2) || (user?.email?.substring(0, 2) || 'T')}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface leading-none mb-1">{profile?.full_name || 'Teacher User'}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Akun {profile?.role === 'teacher' ? 'Guru' : 'Admin'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 mt-1">Menu</p>
          
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${activeTab === item.id ? 'bg-primary-container/40 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.badge === 'Baru' ? 'bg-primary text-white border border-white/20' : 'bg-error text-white'}`}>{item.badge}</span>
              )}
            </button>
          ))}

          {(profile?.role === 'admin' || profile?.role === 'staff') && (
            <>
              <p className="px-3 text-[10px] font-black text-error uppercase tracking-widest mb-1 mt-6">Administrator</p>
              <Link href="/dashboard-admin" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-error-container/20 hover:text-error rounded-xl font-bold transition-all group w-full">
                <span className="material-symbols-outlined text-[18px] group-hover:text-error transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                Admin Dashboard
              </Link>
              {(profile?.role === 'admin' || profile?.role === 'staff') && (
                <Link href="/dashboard-staff" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-tertiary-container/20 hover:text-tertiary rounded-xl font-bold transition-all group w-full">
                  <span className="material-symbols-outlined text-[18px] group-hover:text-tertiary transition-colors">business</span>
                  Tata Usaha
                </Link>
              )}
            </>
          )}

          <p className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 mt-6">Settings</p>
          
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl font-semibold transition-all group w-full">
            <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">settings</span>
            Preferences
          </Link>
        </nav>

        {/* Logout (Bottom) */}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-container-lowest md:bg-transparent">
        
        {/* Top Header */}
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
            {/* Global Search - Compact */}
            <div className="hidden lg:flex items-center bg-surface-container-low border border-outline-variant/30 rounded-full px-3 py-1.5 w-60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-full text-on-surface placeholder:text-on-surface-variant" />
            </div>

            {/* Notifications */}
            <button className="relative p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors hidden sm:block">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<LoadingScreen message="Memuat Konten..." />}>
              {activeTab === 'overview' && <OverviewTab profile={profile} onCreateClass={() => setIsCreateModalOpen(true)} classesCount={classes.length} assignmentsCount={assignments.length} onTabChange={setActiveTab} />}
              {activeTab === 'students' && <StudentsTab onShowStatus={showStatus} />}
              {activeTab === 'classes' && <ClassesTab 
                  classesData={classes}
                  onCreateClass={() => setIsCreateModalOpen(true)} 
                  onShareClass={(name: string) => { setShareClassName(name); setIsShareModalOpen(true); }}
              />}
              {activeTab === 'assignments' && <AssignmentsTab />}
              {activeTab === 'quiz' && <QuizMakerTab classesData={classes} onShareQuiz={(name: string, id: string) => { setShareClassName(name); setShareId(id); setIsShareModalOpen(true); }} />}
              {activeTab === 'ai-assistant' && <AITab />}
              {activeTab === 'attendance' && <AttendanceTab classes={classes} />}
              {activeTab === 'complaints' && <ComplaintsTab onShowStatus={showStatus} />}
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

      {/* Mobile NavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 sm:px-4 pb-safe pt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-12_40px_rgba(0,0,0,0.04)] text-[9px] font-bold text-outline uppercase tracking-wider">
        {menuItems.slice(0, 5).map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center px-1 sm:px-3 py-2 ${activeTab === item.id ? 'text-primary' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
          >
            <div className="relative">
              <span className="material-symbols-outlined mb-1 text-[20px]" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              {item.badge && item.badge !== 'Baru' && <span className="absolute -top-1 -right-2 w-2 h-2 bg-error rounded-full block focus:outline-none"></span>}
              {item.badge === 'Baru' && <span className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full block animate-pulse"></span>}
            </div>
            <span className="scale-90 sm:scale-100 origin-bottom">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      <CreateClassModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateClass} />
      <ShareLinkModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} className={shareClassName} id={shareId} />
    </div>
  );
}
