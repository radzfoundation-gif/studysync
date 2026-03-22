"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import CreateClassModal from "@/components/CreateClassModal";
import ShareLinkModal from "@/components/ShareLinkModal";
import ManualQuizBuilder from "@/components/ManualQuizBuilder";
import TeacherOnboarding from "@/components/TeacherOnboarding";
import LoadingScreen from "@/components/LoadingScreen";
import StatusModal from "@/components/StatusModal";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/context/AuthContext";

export default function TeacherDashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareClassName, setShareClassName] = useState('');
  
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
        const [classesRes, assignmentsRes] = await Promise.all([
          supabase.from('classes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('assignments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

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
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsCheckingOnboarding(false);
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
  }, [user]);

  if (authLoading || isCheckingOnboarding) {
    return <LoadingScreen message="Menyiapkan Ruang Guru..." />;
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

          {profile?.role === 'admin' && (
            <>
              <p className="px-3 text-[10px] font-black text-error uppercase tracking-widest mb-1 mt-6">Administrator</p>
              <Link href="/dashboard-admin" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-error-container/20 hover:text-error rounded-xl font-bold transition-all group w-full">
                <span className="material-symbols-outlined text-[18px] group-hover:text-error transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                Admin Dashboard
              </Link>
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
            {activeTab === 'overview' && <OverviewTab profile={profile} onCreateClass={() => setIsCreateModalOpen(true)} classesCount={classes.length} assignmentsCount={assignments.length} />}
            {activeTab === 'students' && <StudentsTab onShowStatus={showStatus} />}
            {activeTab === 'classes' && <ClassesTab 
                classesData={classes}
                onCreateClass={() => setIsCreateModalOpen(true)} 
                onShareClass={(name) => { setShareClassName(name); setIsShareModalOpen(true); }}
            />}
            {activeTab === 'assignments' && <AssignmentsTab pendingCount={assignments.length} />}
            {activeTab === 'quiz' && <QuizMakerTab onShareQuiz={(name) => { setShareClassName(name); setIsShareModalOpen(true); }} />}
            {activeTab === 'ai-assistant' && <AITab />}
            {activeTab === 'attendance' && <AttendanceTab classes={classes} />}
            {activeTab === 'complaints' && <ComplaintsTab onShowStatus={showStatus} />}
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 sm:px-4 pb-safe pt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-12px_40px_rgba(0,0,0,0.04)] text-[9px] font-bold text-outline uppercase tracking-wider">
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
      <ShareLinkModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} className={shareClassName} />
    </div>
  );
}

// --- Tab Components ---

function OverviewTab({ profile, onCreateClass, classesCount, assignmentsCount }: { profile: any, onCreateClass?: () => void, classesCount: number, assignmentsCount: number }) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner - Compact */}
      <div className="bg-gradient-to-r from-primary to-surface-tint rounded-2xl p-5 text-white shadow-lg shadow-primary/20 relative overflow-hidden flex items-center justify-between">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 w-full flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-headline mb-1">Selamat datang kembali, {profile?.full_name?.split(' ')[0] || 'Guru'}! 👋</h2>
            <p className="text-white/80 font-medium text-xs">Anda memiliki {assignmentsCount} tugas tertunda dan {classesCount} kelas aktif.</p>
          </div>
          <button 
            onClick={onCreateClass}
            className="hidden sm:flex bg-white text-primary px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all outline-none items-center gap-1 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Create Class
          </button>
        </div>
      </div>

      {/* Analytics Grid - Clean Blue & White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', count: '0', icon: 'people' },
          { label: 'Active Classes', count: classesCount.toString(), icon: 'meeting_room' },
          { label: 'Pending Action', count: assignmentsCount.toString(), icon: 'notification_important' },
          { label: 'Avg Score', count: '-', icon: 'trending_up' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,119,255,0.08)] transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all`}>
              <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black font-headline text-on-surface leading-none mb-1">{stat.count}</h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/30">
            <h3 className="font-bold font-headline text-sm">Recent Submissions</h3>
            <button className="text-xs text-primary font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-surface-container-lowest text-[10px] uppercase tracking-wider text-outline border-b border-outline-variant/20">
                  <th className="px-5 py-2.5 font-bold">Student</th>
                  <th className="px-5 py-2.5 font-bold">Class</th>
                  <th className="px-5 py-2.5 font-bold">Status</th>
                  <th className="px-5 py-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                 <tr>
                   <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant">Belum ada submisi tugas.</td>
                 </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI & Schedule */}
        <div className="space-y-6">
          {/* AI Assistant Hook */}
          <div className="bg-surface-container-lowest rounded-xl border border-primary/20 shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-bold text-sm text-primary">AI Copilot</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 font-medium leading-relaxed">
              Create a personalized quiz based on your latest Biology module notes.
            </p>
            <button className="w-full py-2 bg-primary text-white font-bold rounded-lg text-xs hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Generate Automatically
            </button>
          </div>

          {/* Schedule */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5">
            <h3 className="font-bold font-headline text-sm mb-3">Today's Schedule</h3>
            <div className="space-y-3">
                <div className="flex items-center justify-center py-6 text-on-surface-variant text-xs">
                  Tidak ada jadwal hari ini.
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddStudentModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({
    full_name: '',
    nisn: '',
    class_name: '',
    password: '123'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-black font-headline mb-6 flex items-center gap-3">
             <span className="material-symbols-outlined text-primary">person_add</span>
             Tambah Siswa Baru
          </h2>
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  placeholder="Masukkan nama siswa"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">NISN (ID Login)</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold tracking-widest"
                     placeholder="10 digit"
                     value={formData.nisn}
                     onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Kelas</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                     placeholder="Contoh: XII IPA 1"
                     value={formData.class_name}
                     onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                   />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Password Akses</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  placeholder="Password untuk siswa"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
             </div>
          </div>
          <div className="flex gap-3 mt-8">
             <button onClick={onClose} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-colors text-sm uppercase font-headline">Batal</button>
             <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm uppercase font-headline">Simpan data</button>
          </div>
       </div>
    </div>
  );
}

function EditStudentModal({ isOpen, onClose, onSave, student }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, student: any }) {
  const [formData, setFormData] = React.useState({
    full_name: '',
    nisn: '',
    class_name: '',
    password: ''
  });

  React.useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        nisn: student.nisn || '',
        class_name: student.class_name || '',
        password: student.password || ''
      });
    }
  }, [student]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-black font-headline mb-6 flex items-center gap-3 text-on-surface">
             <span className="material-symbols-outlined text-primary">edit_square</span>
             Edit Data Siswa
          </h2>
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">NISN</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-100 border border-outline-variant/50 rounded-xl text-sm font-bold tracking-widest text-on-surface-variant cursor-not-allowed"
                     value={formData.nisn}
                     readOnly
                     title="NISN tidak dapat diubah"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Kelas</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                     value={formData.class_name}
                     onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                   />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Update Password</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
             </div>
          </div>
          <div className="flex gap-3 mt-8">
             <button onClick={onClose} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-colors text-sm uppercase font-headline">Batal</button>
             <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm uppercase font-headline">Update data</button>
          </div>
       </div>
    </div>
  );
}

function StudentsTab({ onShowStatus }: { onShowStatus: (type: 'success' | 'error' | 'info', title: string, msg: string) => void }) {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [isImporting, setIsImporting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const classes = ['Semua Kelas', ...Array.from(new Set(students.map(s => s.class_name))).filter(Boolean)];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_data')
      .select('*')
      .order('full_name', { ascending: true });
    if (data) setStudents(data);
    setLoading(false);
  };

  const handleAddStudent = async (formData: any) => {
    if (!formData.nisn || !formData.full_name) return onShowStatus('error', 'Incomplete!', "NISN dan Nama wajib diisi!");
    
    // 1. Save to master database
    const { error } = await supabase.from('student_data').insert([{
      ...formData,
      school_name: profile?.school_name || "SMA N 1 Pupuan" // Default based on teacher profile
    }]);

    if (error) {
      onShowStatus('error', 'Gagal!', error.message);
      return;
    }

    onShowStatus('success', 'Berhasil!', "Berhasil menambah siswa: " + formData.full_name);
    setIsAddModalOpen(false);
    fetchStudents();
  };

  const handleEditStudent = async (formData: any) => {
    if (!selectedStudent) return;
    
    const { error } = await supabase
      .from('student_data')
      .update({
        full_name: formData.full_name,
        class_name: formData.class_name,
        password: formData.password
      })
      .eq('nisn', selectedStudent.nisn);

    if (error) {
      onShowStatus('error', 'Gagal Update!', error.message);
      return;
    }

    onShowStatus('success', 'Siswa Diperbarui', "Berhasil memperbarui data siswa.");
    setIsEditModalOpen(false);
    fetchStudents();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsImporting(true);
      const filename = e.target.files[0].name;
      // Simulate network request
      setTimeout(() => {
        setIsImporting(false);
        alert(`Berhasil mengimpor data absensi dari file: ${filename}`);
        e.target.value = ''; // reset input
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-xl font-headline">Student Directory</h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Tambah Manual
          </button>

          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-outline-variant/50 rounded-lg text-sm bg-surface text-on-surface outline-none focus:border-primary appearance-none cursor-pointer pr-10"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </div>
          </div>

          <label className={`border border-outline-variant/30 text-on-surface px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 ${isImporting ? 'bg-surface-container-highest cursor-wait opacity-70' : 'bg-surface-container hover:bg-surface-container-high cursor-pointer'}`}>
            <span className={`material-symbols-outlined text-[18px] ${isImporting ? 'animate-spin' : ''}`}>
              {isImporting ? 'sync' : 'upload_file'}
            </span>
            {isImporting ? 'Mengimpor...' : 'Impor Absen (.csv)'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isImporting} />
          </label>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/30">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
             <input type="text" placeholder="Cari siswa atau kelas..." className="w-full md:w-96 pl-10 pr-4 py-2 border border-outline-variant/50 rounded-lg bg-surface text-sm outline-none focus:border-primary transition-colors" />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-lowest text-[11px] uppercase tracking-wider text-outline border-b border-outline-variant/20">
                <th className="px-5 py-3 font-bold">Nama Siswa</th>
                <th className="px-5 py-3 font-bold">NIS</th>
                <th className="px-5 py-3 font-bold">Kelas</th>
                <th className="px-5 py-3 font-bold">Kehadiran</th>
                <th className="px-5 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
               {loading ? (
                 <tr><td colSpan={5} className="px-5 py-8 text-center"><span className="animate-spin material-symbols-outlined text-primary">sync</span></td></tr>
               ) : students.length === 0 ? (
                 <tr><td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant">Belum ada data siswa. Silakan tambah manual atau impor.</td></tr>
               ) : students
                   .filter(s => selectedClass === 'Semua Kelas' || s.class_name === selectedClass)
                   .map(student => (
                 <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                   <td className="px-5 py-4 font-bold text-on-surface">{student.full_name}</td>
                   <td className="px-5 py-4 font-mono text-xs tracking-widest text-primary">{student.nisn}</td>
                   <td className="px-5 py-4 text-xs font-bold text-on-surface-variant">{student.class_name}</td>
                   <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Aktif</span>
                   </td>
                   <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsEditModalOpen(true);
                        }}
                        className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                      >
                        edit
                      </button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
        <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddStudent} />
        <EditStudentModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleEditStudent} 
          student={selectedStudent} 
        />
      </div>
    </div>
  );
}

function ClassesTab({ classesData, onCreateClass, onShareClass }: { classesData: any[], onCreateClass?: () => void, onShareClass?: (name: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-xl font-headline">Classes & Study Rooms</h3>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgb(0,119,255,0.6)]"></span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
        <button onClick={onCreateClass} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Kelas Baru
        </button>
      </div>

      {classesData.length === 0 ? (
        <div className="bg-white border border-outline-variant/30 rounded-3xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-5xl mb-3">meeting_room</span>
          <p className="font-bold text-on-surface-variant text-lg">Belum ada kelas.</p>
          <p className="text-sm text-on-surface-variant/70 mt-1">Gunakan tombol Buat Kelas Baru untuk menambahkan.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classesData.map(cls => (
          <div key={cls.id} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,119,255,0.08)] hover:border-primary/30 transition-all flex flex-col group">
            <div className={`h-28 ${cls.theme_color || 'bg-primary'} p-5 flex flex-col justify-end relative overflow-hidden`}>
              {/* Abstract Lines Pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.25] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`abstract-lines-${cls.id}`} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                    <rect x="0" y="0" width="2" height="32" fill="#ffffff" />
                    <rect x="10" y="0" width="1" height="32" fill="#ffffff" />
                    <rect x="18" y="0" width="4" height="32" fill="#ffffff" />
                    <rect x="26" y="0" width="1" height="32" fill="#ffffff" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill={`url(#abstract-lines-${cls.id})`} />
              </svg>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
              <h4 className="text-white font-black text-xl mb-1 relative z-10 leading-tight drop-shadow-sm">{cls.name}</h4>
              <p className="text-white/90 text-xs font-semibold relative z-10 drop-shadow-sm">{cls.grade} • {cls.students} Siswa</p>
            </div>
            
            <div className="p-5 bg-surface-container-lowest flex flex-col gap-3">
              <button className="w-full py-2.5 bg-primary-container text-on-primary-container font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">assignment_add</span>
                Buat Tugas
              </button>
              
              <div className="flex gap-2 mt-1">
                <Link href={`/dashboard-teacher/rooms/${cls.id}`} className="flex-1">
                  <button className="w-full py-2.5 border border-outline-variant text-on-surface font-semibold rounded-xl text-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">cast_for_education</span>
                    Buka Room
                  </button>
                </Link>
                <button 
                  onClick={() => onShareClass?.(cls.name)}
                  title="Bagikan Tautan Kelas"
                  className="px-3 py-2.5 border border-outline-variant text-on-surface-variant hover:text-primary font-semibold rounded-xl text-sm hover:bg-primary-container/50 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

function AssignmentsTab({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 text-center">
      <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px]">assignment</span>
      </div>
      <h3 className="font-bold text-lg mb-2">Assignments Management</h3>
      <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">You have {pendingCount} pending submissions system-wide. Review answers, give feedback, and publish grades efficiently.</p>
      <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:shadow-md transition-all">Review Submissions</button>
    </div>
  );
}

function AITab() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
        <span className="material-symbols-outlined text-[32px]">smart_toy</span>
      </div>
      <h3 className="font-bold text-lg mb-2">Teaching AI Assistant</h3>
      <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">Leverage AI to generate lesson plans, automate grading, and answer common student questions 24/7.</p>
      <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:shadow-md transition-all">Open AI Chat</button>
    </div>
  );
}

function QuizMakerTab({ onShareQuiz }: { onShareQuiz?: (name: string) => void }) {
  const { user } = useAuth();
  const [generationStep, setGenerationStep] = useState<'idle' | 'generating' | 'result'>('idle');
  const [isBuildingManual, setIsBuildingManual] = useState(false);
  const [topic, setTopic] = useState("");
  const [generatingText, setGeneratingText] = useState('Menganalisis matriks topik...');
  const [progress, setProgress] = useState(0);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  const [quizzes, setQuizzes] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchQuizzes = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setQuizzes(data);
      setLoadingQuizzes(false);
    };
    fetchQuizzes();
    
    const channel = supabase.channel(`realtime_quizzes_teacher_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes', filter: `user_id=eq.${user.id}` }, () => {
        fetchQuizzes();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  React.useEffect(() => {
    let interval: any;
    if (generationStep === 'generating') {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 100));
      }, 150); // 100% in 3 seconds
    }
    return () => clearInterval(interval);
  }, [generationStep]);

  const handleGenerateAI = () => {
    if(!topic) return alert("Masukkan topik kuis terlebih dahulu!");
    setGenerationStep('generating');
    
    setTimeout(() => setGeneratingText('Menyusun ragam soal & distraktor...'), 1000);
    setTimeout(() => setGeneratingText('Memvalidasi kunci jawaban...'), 2000);
    
    setTimeout(() => {
      setGenerationStep('result');
      setGeneratingText('Menganalisis matriks topik...'); // reset
    }, 3000);
  };

  const pushToSupabaseQuizzes = async (title: string, questionsData: any) => {
    if (!user) return;
    const payload = {
      title,
      questions: questionsData || [],
      user_id: user.id
    };
    const { error } = await supabase.from('quizzes').insert([payload]);
    if (error) alert("Kesalahan menyimpan kuis: " + error.message);
  };

  const pushToSupabase = async (title: string, count: number) => {
    if (!user) return;
    const payload = {
      title,
      course_name: "Quiz/Assessment",
      due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      status: "Pending",
      user_id: user.id
    };
    const { error } = await supabase.from('assignments').insert([payload]);
    if (error) alert("Kesalahan mengunggah kuis ke assignments: " + error.message);
  };

  const handleSaveQuiz = () => {
    // Note: ai generated quiz state was removed, so we mock saving it or ideally use proper generated state.
    pushToSupabaseQuizzes(`Kuis AI: ${topic}`, []);
    pushToSupabase(`Kuis AI: ${topic}`, 3);
    setGenerationStep('idle');
    setTopic('');
  };

  const handleSaveManual = (title: string, count: number) => {
    pushToSupabaseQuizzes(title, []);
    pushToSupabase(title, count);
    setIsBuildingManual(false);
  };

  if (isBuildingManual) {
    return <ManualQuizBuilder onSave={handleSaveManual} onCancel={() => setIsBuildingManual(false)} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h3 className="font-bold text-2xl font-headline tracking-tight text-on-surface">Quiz & Assessment Builder 🎮</h3>
        <p className="text-sm font-medium text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
          Buat kuis yang interaktif untuk ruang kelas Anda. Biarkan AI menyusun soal secara instan berdasarkan materi pelajaran, atau bangun teka-teki manual yang menantang akal budi siswa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate with AI Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-primary/20 shadow-[0_8px_30px_rgb(0,119,255,0.08)] relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,119,255,0.15)] transition-all flex flex-col min-h-[380px]">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-center">
            {generationStep === 'idle' && (
              <div className="flex flex-col h-full justify-between animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-5 border border-primary/20">
                    <span className="material-symbols-outlined text-[32px] animate-pulse">auto_awesome</span>
                  </div>
                  <h4 className="text-on-surface font-black text-2xl mb-2 font-headline tracking-tight">AI Auto-Generator</h4>
                  <p className="text-on-surface-variant text-sm font-medium mb-6 leading-relaxed">Instan menyusun soal kuis multi-pilihan & esai dari materi spesifik. Ketik topik yang Anda mau:</p>
                  <input 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Sel Tumbuhan & Histologi..."
                    className="w-full px-5 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium shadow-inner"
                  />
                </div>
                <button 
                  onClick={handleGenerateAI}
                  className="mt-6 w-full py-4 bg-primary text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 outline-none hover:-translate-y-1 hover:shadow-primary/40 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">magic_button</span>
                  Generate Kuis AI
                </button>
              </div>
            )}

            {generationStep === 'generating' && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40 transition-transform hover:scale-110">
                    <span className="material-symbols-outlined text-[36px] animate-spin">model_training</span>
                  </div>
                </div>
                <h4 className="text-primary font-black text-xl mb-2 font-headline animate-pulse tracking-tight">Menyusun Kuis Pintar...</h4>
                <p className="text-on-surface-variant text-sm font-medium h-6 transition-all duration-300">{generatingText}</p>
                
                <div className="w-full bg-surface-container-high rounded-full h-2 mt-8 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-150 ease-linear shadow-[0_0_10px_rgb(0,119,255,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {generationStep === 'result' && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                    <span className="material-symbols-outlined text-[28px]">verified</span>
                  </div>
                  <div>
                    <h4 className="font-black font-headline text-on-surface leading-tight text-xl mb-1">Kuis Berhasil Disusun!</h4>
                    <p className="text-xs text-on-surface-variant font-bold text-green-600/90 tracking-wide uppercase">10 Soal • Tingkat Menengah</p>
                  </div>
                </div>
                
                <div className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 mb-5 overflow-y-auto max-h-[160px] custom-scrollbar shadow-inner text-sm space-y-4">
                  <div className="pb-4 border-b border-outline-variant/40">
                    <p className="font-bold text-on-surface mb-2 leading-relaxed">1. Apa entitas yang membedakan sel prokariotik dan sel eukariotik?</p>
                    <div className="space-y-1">
                      <p className="text-on-surface-variant text-xs flex items-center gap-2 bg-green-50 px-2 py-1.5 rounded-lg border border-green-200">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> <span className="font-bold text-green-700">A. Membran inti</span> <span className="ml-auto material-symbols-outlined text-[14px] text-green-600">check</span>
                      </p>
                      <p className="text-on-surface-variant/70 text-xs flex items-center gap-2 px-2 py-1">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span> B. Dinding sel
                      </p>
                    </div>
                  </div>
                  <div className="pb-4 border-b border-outline-variant/40">
                    <p className="font-bold text-on-surface mb-2 leading-relaxed">2. Organel yang bertugas dalam sintesis protein adalah?</p>
                    <div className="space-y-1">
                      <p className="text-on-surface-variant/70 text-xs flex items-center gap-2 px-2 py-1">
                        <span className="w-2 h-2 rounded-full bg-outline-variant"></span> A. Lisosom
                      </p>
                      <p className="text-on-surface-variant text-xs flex items-center gap-2 bg-green-50 px-2 py-1.5 rounded-lg border border-green-200">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> <span className="font-bold text-green-700">B. Ribosom</span> <span className="ml-auto material-symbols-outlined text-[14px] text-green-600">check</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <button className="w-full text-primary text-xs font-bold text-center mt-1 py-1 hover:underline outline-none">Gulir untuk melihat 8 soal lainnya...</button>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button onClick={() => { setGenerationStep('idle'); setTopic(''); setProgress(0); }} className="px-5 py-3.5 bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface font-bold rounded-xl text-sm transition-all outline-none shrink-0 border border-transparent hover:border-outline-variant/30">
                    Hapus
                  </button>
                  <button onClick={handleSaveQuiz} className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:shadow-[0_8px_30px_rgb(0,119,255,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all outline-none flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">library_add</span>
                    Simpan & Publikasikan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Creation Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border-2 border-dashed border-outline-variant/60 hover:border-primary/40 transition-colors flex flex-col justify-center items-center text-center group cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden min-h-[380px]">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
           <div className="relative z-10 w-16 h-16 bg-surface-container text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 rounded-3xl flex items-center justify-center mb-5 rotate-[10deg] group-hover:rotate-0 shadow-sm">
             <span className="material-symbols-outlined text-[36px]">edit_document</span>
           </div>
           <h4 className="relative z-10 text-on-surface font-black text-2xl mb-2 font-headline tracking-tight">Buat Manual Klasik</h4>
           <p className="relative z-10 text-on-surface-variant text-sm font-medium mb-8 max-w-xs leading-relaxed">Rancang soal kuis interaktif Anda sendiri secara teliti, tentukan poin jawaban yang presisi, dan sisipkan media gambar.</p>
           <button 
             onClick={() => setIsBuildingManual(true)}
             className="relative z-10 px-8 py-3.5 bg-surface-container font-bold text-on-surface hover:bg-primary hover:text-white rounded-full text-sm transition-all shadow-sm outline-none active:scale-95"
           >
             Mulai dari Kosong
           </button>
        </div>
      </div>

      {/* Quiz Library */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 lg:p-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <h4 className="font-bold font-headline text-lg mb-5 text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">collections_bookmark</span>
          Pustaka Kuis Anda
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingQuizzes ? (
            <div className="col-span-full py-10 flex justify-center">
              <span className="material-symbols-outlined flex animate-spin text-primary text-3xl">sync</span>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="col-span-full py-10 text-center border border-outline-variant/30 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">inventory_2</span>
              <p className="text-on-surface-variant font-bold">Kuis masih kosong</p>
            </div>
          ) : (
            quizzes.map(q => (
              <div key={q.id} className="p-5 border border-outline-variant/40 rounded-2xl bg-surface hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group flex flex-col cursor-pointer pb-4">
                <h5 className="font-black text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors text-[16px]">{q.title}</h5>
                <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-6">
                  <span className="flex items-center gap-1.5 border border-outline-variant/30 px-2 py-1 rounded-md"><span className="material-symbols-outlined text-[14px]">format_list_bulleted</span> {(q.questions?.[0] ? q.questions.length : 10)} Soal</span>
                  <span className="flex items-center gap-1.5 border border-outline-variant/30 px-2 py-1 rounded-md"><span className="material-symbols-outlined text-[14px]">play_arrow</span> {q.plays || 0} Kali</span>
                </div>
                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => onShareQuiz?.(q.title)}
                    className="flex-1 py-2.5 bg-primary-container/40 hover:bg-primary text-primary hover:text-white font-bold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5 outline-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span> Bagikan
                  </button>
                  <Link href="/quiz">
                    <button className="w-[44px] shrink-0 h-[44px] border border-outline-variant/50 hover:bg-primary hover:border-primary hover:text-white text-on-surface-variant font-bold rounded-xl transition-all flex items-center justify-center outline-none shadow-sm hover:shadow-md">
                      <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
function AttendanceTab({ classes }: { classes: any[] }) {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          classes (
            name
          )
        `)
        .order('joined_at', { ascending: false });

      if (data) {
        setAttendanceData(data);
        setFilteredData(data);
      }
      setLoading(false);
    };

    fetchAttendance();

    // Subscribe to changes
    const channel = supabase.channel('realtime_attendance_admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, (payload) => {
        setAttendanceData(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedClass === 'Semua Kelas') {
      setFilteredData(attendanceData);
    } else {
      setFilteredData(attendanceData.filter(a => a.class_name === selectedClass || a.classes?.name === selectedClass));
    }
  }, [selectedClass, attendanceData]);

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ["Nama Siswa", "NISN", "Kelas Atribut", "No. Absen", "Waktu Hadir", "Link Foto Bukti"];
    const rows = filteredData.map(row => [
      row.student_name,
      row.nisn || "-",
      row.class_name || row.classes?.name || "Umum",
      row.student_number || "-",
      new Date(row.joined_at).toLocaleString('id-ID'),
      row.photo_url || "-"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_${selectedClass.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-xl font-headline">Laporan Absensi Siswa</h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-outline-variant/50 rounded-xl text-sm bg-white text-on-surface outline-none focus:border-primary appearance-none cursor-pointer pr-10 shadow-sm"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </div>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Ekspor ke CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low/30 text-[10px] uppercase tracking-wider text-outline border-b border-outline-variant/20">
                <th className="px-6 py-4 font-black">Absen / NISN</th>
                <th className="px-6 py-4 font-black">Nama Siswa</th>
                <th className="px-6 py-4 font-black text-center">Bukti Foto</th>
                <th className="px-6 py-4 font-black">Kelas</th>
                <th className="px-6 py-4 font-black">Waktu Hadir</th>
                <th className="px-6 py-4 font-black text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    Belum ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary text-xs tracking-tight">#{row.student_number || '-'}</p>
                      {row.nisn && <p className="text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-tighter">NISN: {row.nisn}</p>}
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface">{row.student_name}</td>
                    <td className="px-6 py-4 flex justify-center">
                      {row.photo_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-outline-variant shadow-sm cursor-zoom-in hover:scale-110 transition-transform bg-black/5">
                          <img 
                            src={row.photo_url} 
                            alt="Bukti Kehadiran" 
                            className="w-full h-full object-cover"
                            onClick={() => window.open(row.photo_url, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant/30">
                          <span className="material-symbols-outlined text-[20px]">no_photography</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-on-surface-variant">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-surface-container text-[10px] font-black uppercase tracking-tighter">
                        {row.class_name || row.classes?.name || 'Umum'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                      {new Date(row.joined_at).toLocaleString('id-ID', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Hadir
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ComplaintsTab({ onShowStatus }: { onShowStatus: (type: 'success' | 'error' | 'info', title: string, msg: string) => void }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setComplaints(data);
    setLoading(false);
  };

  const handleReply = async (id: string) => {
    const text = replyText[id];
    if (!text) return onShowStatus('error', 'Pesan Kosong', 'Harap isi balasan Anda.');

    const { error } = await supabase
      .from('student_complaints')
      .update({ 
        reply: text,
        status: 'Selesai'
      })
      .eq('id', id);
    
    if (error) {
      onShowStatus('error', 'Gagal Membalas', error.message);
    } else {
      onShowStatus('success', 'Terkirim!', 'Balasan Anda telah tersimpan dan dapat dilihat siswa.');
      fetchComplaints();
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('student_complaints')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchComplaints();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center text-on-surface">
          <h3 className="font-bold text-xl font-headline">Student Complaints</h3>
          <button onClick={fetchComplaints} className="material-symbols-outlined p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">refresh</button>
       </div>

       <div className="grid grid-cols-1 gap-4 text-on-surface">
          {loading ? (
             <div className="py-20 text-center text-on-surface-variant"><span className="animate-spin material-symbols-outlined text-primary">sync</span></div>
          ) : complaints.length === 0 ? (
             <div className="bg-white rounded-2xl p-10 border border-outline-variant/30 text-center text-on-surface-variant font-medium">
                Belum ada keluhan yang masuk.
             </div>
          ) : complaints.map(item => (
             <div key={item.id} className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-xs">
                         {item.student_name?.substring(0, 2) || "S"}
                      </div>
                      <div>
                         <h4 className="font-bold text-on-surface">{item.subject}</h4>
                         <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{item.student_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <select 
                     value={item.status} 
                     onChange={(e) => updateStatus(item.id, e.target.value)}
                     className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-outline-variant outline-none cursor-pointer ${
                        item.status === 'Baru' ? 'bg-error-container/20 text-error' : 
                        item.status === 'Diproses' ? 'bg-primary-container/20 text-primary' : 'bg-green-100 text-green-700'
                     }`}
                   >
                      <option value="Baru">Baru</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Selesai">Selesai</option>
                   </select>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed bg-slate-50 p-4 rounded-xl border border-outline-variant/10 italic mb-4">
                   "{item.message}"
                </p>

                {/* Reply Section */}
                <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3">
                    {item.reply ? (
                        <div className="bg-primary-container/10 p-4 rounded-xl border border-primary/10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">reply</span> 
                                Balasan Anda:
                            </p>
                            <p className="text-sm text-on-surface font-medium">{item.reply}</p>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Tulis balasan untuk siswa..."
                                className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                value={replyText[item.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [item.id]: e.target.value })}
                            />
                            <button 
                                onClick={() => handleReply(item.id)}
                                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                Balas
                            </button>
                        </div>
                    )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}
