"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import StatusModal from "@/components/StatusModal";



function ComplaintModal({ isOpen, onClose, studentName, nisn, onShowStatus }: { isOpen: boolean, onClose: () => void, studentName: string, nisn: string, onShowStatus: (type: 'success' | 'error', title: string, msg: string) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return alert("Subjek dan pesan wajib diisi!");

    setLoading(true);
    const { error } = await supabase.from('student_complaints').insert([{
      nisn,
      student_name: studentName,
      subject,
      message,
      status: 'Baru'
    }]);

    setLoading(false);
    if (error) {
      onShowStatus('error', 'Gagal!', error.message);
    } else {
      onShowStatus('success', 'Berhasil Dikirim!', "Keluhan Anda telah kami teruskan ke guru.");
      setSubject("");
      setMessage("");
      onClose();
      // Trigger refresh in parent if possible or via state sync
      window.dispatchEvent(new CustomEvent('refreshComplaints'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-black font-headline mb-2 flex items-center gap-3 text-on-surface">
          <span className="material-symbols-outlined text-error">campaign</span>
          Lapor Keluhan
        </h2>
        <p className="text-xs text-on-surface-variant font-medium mb-6">Sampaikan kendala teknis atau akademik Anda kepada guru.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Subjek / Judul</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
              placeholder="Contoh: Kendala Absensi, Materi Kurang Jelas"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Pesan Lengkap</label>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold min-h-[120px]"
              placeholder="Jelaskan secara detail kendala yang Anda alami..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-colors text-sm uppercase">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-error text-white font-bold rounded-xl hover:shadow-lg shadow-error/20 active:scale-95 transition-all text-sm uppercase disabled:opacity-50">
              {loading ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentHubPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // Login State
  const [nisn, setNisn] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

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
      }).catch(() => { });
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Dashboard Data State
  const [studentData, setStudentData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    if (profile?.role === 'siswa' || profile?.role === 'student') {
      // Parallelize student data and complaints fetch
      Promise.all([fetchStudentData(), fetchComplaints()]).finally(() => {
        setLoadingData(false);
      });
    } else {
      setLoadingData(false);
    }
  }, [user, profile]);

  useEffect(() => {
    const handleRefresh = () => fetchComplaints();
    window.addEventListener('refreshComplaints', handleRefresh);
    return () => window.removeEventListener('refreshComplaints', handleRefresh);
  }, [profile, nisn]); // Listen for changes in nisn too

  useEffect(() => {
    const userNisn = profile?.nisn || (nisn && nisn.length >= 4 ? nisn : localStorage.getItem('studysync_nisn'));
    if (!userNisn || userNisn === "000") return;

    const channel = supabase
      .channel(`student_replies_${userNisn}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_complaints',
          filter: `nisn=eq.${userNisn}`
        },
        (payload) => {
          if (payload.new.reply && payload.old.reply !== payload.new.reply) {
            playNotificationSound();
            fetchComplaints();
            showStatus('info', 'Balasan Diterima!', 'Guru Anda telah membalas keluhan Anda.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, nisn]);

  // Reactive fetch for guest mode
  useEffect(() => {
    if (!user && nisn.length >= 4) {
      const timer = setTimeout(() => fetchComplaints(), 800);
      return () => clearTimeout(timer);
    }
  }, [nisn, user]);

  const fetchComplaints = async () => {
    // Priority: profile.nisn > current input nisn (guest mode) > localStorage
    const userNisn = profile?.nisn || (nisn && nisn.length >= 4 ? nisn : localStorage.getItem('studysync_nisn'));
    if (!userNisn || userNisn === "000") {
      setComplaints([]);
      return;
    }

    const { data } = await supabase
      .from('student_complaints')
      .select('*')
      .eq('nisn', userNisn)
      .order('created_at', { ascending: false });

    if (data) setComplaints(data);
  };

  const fetchStudentData = async () => {
    try {
      // Get student-specific details from nisn stored in profile or localStorage
      const userNisn = profile?.nisn || localStorage.getItem('studysync_nisn');
      if (userNisn) {
        const { data, error } = await supabase
          .from('student_data')
          .select('*')
          .eq('nisn', userNisn)
          .single();

        if (data) setStudentData(data);
      }
    } catch (err: any) {
      console.error("Error fetching student data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleNisnLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn || !password) return setError("NISN dan password wajib diisi");

    setLoginLoading(true);
    setError("");

    try {
      const cleanNisn = nisn.trim();

      // 1. FIRST: Verify against local student_data (the "local" master DB)
      const { data: localStudent, error: localError } = await supabase
        .from('student_data')
        .select('*')
        .eq('nisn', cleanNisn)
        .single();

      if (localError || !localStudent) {
        throw new Error("NISN tidak terdaftar. Silakan hubungi guru Anda.");
      }

      // Check password locally
      if (localStudent.password && localStudent.password !== password) {
        throw new Error("Password salah. Silakan coba lagi.");
      }

      // 2. SECOND: Silent Supabase Auth Synchronization
      // We still use an internal email so features like Chat/RLS work perfectly.
      const internalEmail = `student_${cleanNisn}@studysync.id`;

      console.log("Internal sync for:", internalEmail);

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: password
      });

      if (signInError) {
        // If account doesn't exist in Supabase Auth yet, create it silently
        // This handles the transition from master data -> real session
        const { error: signUpError } = await supabase.auth.signUp({
          email: internalEmail,
          password: password,
          options: {
            data: {
              full_name: localStudent.full_name,
              role: 'student',
              nisn: cleanNisn
            }
          }
        });

        if (signUpError) {
          if (signUpError.status === 429) {
            throw new Error("Terlalu banyak percobaan. Supabase membatasi pendaftaran (Rate Limit). Silakan tunggu atau matikan Rate Limit di Dashboard Supabase.");
          }
          if (signUpError.status === 400) {
            throw new Error("Format identitas internal ditolak oleh Supabase. Pastikan email confirmation dimatikan di Dashboard.");
          }
          throw signUpError;
        }

        // After silent signup, sign in again or just use the data
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: password
        });
        if (retryError) throw retryError;

        if (retryData.user) {
          console.log("Silent signup and login successful");
          localStorage.setItem('studysync_nisn', cleanNisn);
          window.location.reload();
        }
      } else if (authData.user) {
        console.log("Existing account login successful");
        localStorage.setItem('studysync_nisn', cleanNisn);
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Login Error Details:", err);
      let customMsg = err.message;
      if (err.status === 429) customMsg = "Sistem sibuk (Rate Limit). Coba lagi dalam beberapa menit atau matikan pembatasan di Supabase Dashboard.";
      setError(customMsg || "Gagal login. Periksa kembali NISN dan password Anda.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (authLoading || loadingData) return <LoadingScreen message="Menyiapkan Ruang Belajar..." />;

  // NOT LOGGED IN VIEW (NISN Login)
  if (!user || profile?.role !== 'student') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 font-body overflow-hidden">
        {/* Background Batik Mega Mendung */}
        <div
          className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "url('/images/batik_background.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(1px)'
          }}
        ></div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <Link href="/" className="text-3xl font-black text-primary tracking-tighter mb-4 inline-block font-headline">StudySync</Link>
            <h1 className="text-2xl font-extrabold text-on-surface font-headline mb-2">Portal Siswa</h1>
            <p className="text-on-surface-variant font-medium text-sm">Masuk menggunakan NISN untuk memulai belajar.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-outline-variant/20">
            {error && (
              <div className="mb-6 p-4 bg-error-container/20 border border-error/20 rounded-xl flex items-center gap-3 text-error text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleNisnLogin} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider ml-1">Nomor Induk Siswa Nasional (NISN)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40 group-focus-within:text-primary transition-colors">badge</span>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan 10 digit NISN"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold tracking-widest"
                    value={nisn}
                    onChange={e => setNisn(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40 group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password Anda"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">login</span>
                    Masuk Sekarang
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="mt-8 w-full text-center bg-slate-50 hover:bg-slate-100 rounded-2xl p-5 border border-outline-variant/10 transition-all active:scale-95 group cursor-pointer"
            >
              <p className="text-[10px] text-on-surface-variant group-hover:text-primary font-bold uppercase tracking-widest leading-loose transition-colors">
                Lupa password? Hubungi guru bimbingan konseling <br /> atau wali kelas Anda untuk mereset akun.
              </p>
            </button>

            {/* Riwayat Keluhan (Guest View) */}
            {nisn.length >= 4 ? (
              complaints.length > 0 ? (
                <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <span className="material-symbols-outlined text-primary text-xl animate-pulse">history</span>
                    <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">Status Tiket Anda</p>
                  </div>
                  <div className="space-y-3">
                    {complaints.map(ticket => (
                      <div key={ticket.id} className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/20 shadow-sm relative overflow-hidden group hover:bg-white/80 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[11px] font-bold text-on-surface truncate pr-2">{ticket.subject}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${ticket.status === 'Baru' ? 'bg-error-container/20 text-error' :
                            ticket.status === 'Diproses' ? 'bg-primary-container/20 text-primary' : 'bg-green-100 text-green-700'
                            }`}>
                            {ticket.status}
                          </span>
                        </div>

                        {ticket.reply && (
                          <div className="mt-2 bg-primary/10 p-3 rounded-xl border border-primary/10">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-[12px]">reply</span>
                              Balasan Guru:
                            </p>
                            <p className="text-[10px] text-on-surface font-black italic line-clamp-2">"{ticket.reply}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-10 text-center animate-in fade-in duration-500">
                  <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-widest italic">Tidak ada keluhan aktif untuk NISN ini.</p>
                </div>
              )
            ) : nisn.length > 0 && (
              <div className="mt-8 text-center animate-in fade-in duration-500">
                <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">Ketik 10 digit NISN untuk cek riwayat bantuan...</p>
              </div>
            )}
          </div>

          <div className="mt-10 text-center relative z-10">
            <Link href="/" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali ke Beranda Umum
            </Link>
          </div>
        </div>

        <ComplaintModal
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          studentName="Calon Siswa"
          nisn={nisn || "000"}
          onShowStatus={showStatus}
        />

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
        />
      </div>
    );
  }

  // LOGGED IN DASHBOARD VIEW
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col">
      {/* Student Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/20 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/siswa" className="text-2xl font-black text-primary tracking-tighter font-headline">StudySync</Link>
          <div className="h-6 w-px bg-outline-variant/30 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <span className="material-symbols-outlined text-[16px] text-primary">school</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Ruang Siswa</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex gap-8">
            <Link href="/siswa" className="text-sm font-bold text-primary border-b-2 border-primary pb-1">Beranda</Link>
            <Link href="/rooms" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Kelas Diskusi</Link>
            <Link href="/notes" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Perpustakaan Saya</Link>
          </nav>

          <Link href="/settings" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm hover:scale-105 transition-transform uppercase border border-primary/20">
            {profile?.full_name?.substring(0, 2) || (user?.email?.substring(0, 2) || 'S')}
          </Link>

          <button
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
            className="flex flex-col items-center justify-center text-on-surface-variant hover:text-error transition-colors"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter hidden sm:block">Keluar</span>
          </button>
        </div>
      </header>

      {/* Floating Complaint Button */}
      <button
        onClick={() => setIsComplaintModalOpen(true)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-error text-white rounded-full shadow-2xl shadow-error/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        title="Laporkan Keluhan"
      >
        <span className="material-symbols-outlined text-[24px]">campaign</span>
        <span className="absolute right-full mr-4 bg-error text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest pointer-events-none shadow-xl border border-white/20">
          Ada Kendala? Lapor Disini
        </span>
      </button>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left Column: Greeting & Main Cards */}
          <div className="lg:col-span-2 space-y-10">

            {/* Dynamic Greeting */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-fixed rounded-[40px] blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white rounded-[32px] p-8 sm:p-10 border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
                  <span className="material-symbols-outlined text-primary text-5xl">school</span>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-black font-headline mb-2">Selamat Belajar, {profile?.full_name?.split(' ')[0]}!</h2>
                  <p className="text-on-surface-variant font-medium leading-relaxed">
                    Siap untuk mengeksplor materi hari ini? AI Tutor Room dan teman sekelasmu sudah menunggu.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                    <span className="bg-primary-container/30 text-on-primary-container text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/10 italic">
                      #PintarSetiapHari
                    </span>
                    <span className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/10">
                      {studentData?.school_name || "Sekolah StudySync"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat Keluhan & Bantuan */}
            <div className="space-y-6">
              <div className="flex justify-between items-center ml-2">
                <h3 className="text-xl font-black font-headline flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Riwayat Keluhan & Bantuan
                </h3>
                <button onClick={fetchComplaints} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-full transition-colors text-on-surface-variant">refresh</button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {complaints.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-12 text-center border border-outline-variant/30 shadow-sm transition-all hover:border-primary/20">
                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <span className="material-symbols-outlined text-primary/30 text-3xl">mail_outline</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest leading-loose">Belum ada riwayat keluhan.</p>
                    <p className="text-[10px] text-on-surface-variant/40 mt-1 uppercase tracking-tight font-black">Klik tombol kamera di bawah untuk melapor.</p>
                  </div>
                ) : complaints.map(ticket => (
                  <div key={ticket.id} className="bg-white rounded-[32px] p-6 border border-outline-variant/30 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-primary/10 hover:border-l-primary">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${ticket.status === 'Baru' ? 'bg-error-container/20 text-error' :
                          ticket.status === 'Diproses' ? 'bg-primary-container/20 text-primary' : 'bg-green-100 text-green-700'
                          }`}>
                          {ticket.status === 'Selesai' ? '✓' : '!'}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface mb-0.5">{ticket.subject}</h4>
                          <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none">
                            {new Date(ticket.created_at).toLocaleDateString()} • {ticket.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.reply && <span className="material-symbols-outlined text-primary text-[18px] animate-bounce" title="Ada balasan">mark_email_unread</span>}
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl text-sm text-on-surface-variant/80 italic border border-outline-variant/5">
                      "{ticket.message}"
                    </div>

                    {ticket.reply && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/20 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-primary text-[16px]">reply</span>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Balasan Guru:</p>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 relative">
                          <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Official Response</div>
                          <p className="text-sm text-on-surface font-bold leading-relaxed">{ticket.reply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Statistics & School Profile */}
          <div className="space-y-8">
            {/* School Profile Card */}
            <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-bl-[100px] -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary mb-6">Identitas Siswa</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Sekolah</p>
                    <p className="text-lg font-bold font-headline leading-tight">{studentData?.school_name || "Belum Atur Sekolah"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase mb-1">NISN</p>
                      <p className="text-sm font-bold tracking-widest text-primary">{profile?.nisn || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Kelas</p>
                      <p className="text-sm font-bold">{studentData?.class_name || "-"}</p>
                    </div>
                  </div>
                </div>

                <Link href="/settings" className="mt-8 block w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-center text-xs font-bold transition-all uppercase tracking-widest">
                  Lengkapi Data Sekolah
                </Link>
              </div>
            </div>

            {/* Learning Stats */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
                Statistik Belajar
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-on-surface-variant">Absensi Hadir</span>
                  <span className="font-black text-primary">85%</span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-on-surface-variant">Materi Selesai</span>
                  <span className="font-black text-primary">12 Bab</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-8 text-center text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest mt-20">
        © 2026 StudySync Indonesia • Belajar Dimana Saja
      </footer>
      <ComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        studentName={profile?.full_name || "Siswa"}
        nisn={profile?.nisn || localStorage.getItem('studysync_nisn') || "000"}
        onShowStatus={showStatus}
      />

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}
