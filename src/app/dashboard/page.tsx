"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ShareLinkModal from "@/components/ShareLinkModal";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Widget AI State
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: "user", content: aiInput }] })
      });

      const data = await response.json();
      if (response.ok && data.message) {
        setAiResponse(data.message);
      } else {
        setAiResponse("Maaf, gagal menghubungi AI: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setAiResponse("Koneksi bermasalah.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });
        
      if (data) setAssignments(data);
      setLoading(false);
    };

    fetchAssignments();

    // Real-time subscription filtered by user_id
    const channel = supabase.channel(`realtime_assignments_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'assignments',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        fetchAssignments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (authLoading) {
    return <LoadingScreen message="Menyiapkan Dashboard Belajar..." />;
  }
  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed flex flex-col min-h-screen">
      {/* TopNavBar */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 border-b border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-black text-primary tracking-tighter font-headline">StudySync</Link>
          <span className="material-symbols-outlined text-primary text-xl">cloud</span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <nav className="flex gap-6">
            <Link href="/dashboard" className="font-headline font-bold text-sm tracking-widest uppercase text-primary hover:opacity-80 transition-opacity">Dashboard</Link>
            <Link href="/rooms" className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface opacity-60 hover:opacity-80 transition-opacity">Rooms</Link>
            <Link href="/notes/1" className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface opacity-60 hover:opacity-80 transition-opacity">AI Tutor</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-primary-container px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-primary text-sm">stars</span>
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Pro Plan</span>
          </div>
          <Link href="/settings">
            <button className="material-symbols-outlined text-on-surface opacity-60 hover:opacity-100 transition-opacity">account_circle</button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        {/* Trust Badge */}
        <div className="mb-10 flex items-center gap-3 bg-surface-container-low px-5 py-2.5 rounded-full border border-outline-variant/20 editorial-shadow">
          <div className="flex -space-x-2">
            <img alt="User 1" className="w-6 h-6 rounded-full border-2 border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXZ-PjeIP_L7rFZ98mYseExVWvDHSEPrkodN8uVx73tlCI0sQ7BhjqfIP5zj83cPUE0GPLRtiHs0Zi78aSe3Fy0cu6grpf-9NJSxNLzZitAVwmN8dgkDr8S0robdxHBQT3rctVF60w-VYoaSt_x9YhLWNBX2FzBPjJ9DmTos_ja-fBFgDAsMNtiUFxwIBPsgQb3YETS_GnFUmOEFD4zs2rFJQ-kFyXjf4VOIsFmLI5NnjonbQN5KwGU-esI7ZqQ2XixTt41VFscIY" />
            <img alt="User 2" className="w-6 h-6 rounded-full border-2 border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsPDeGFU7GBv7HNB6MuiNwMrdHnPwUJ7pq2pnyxQ4YRoWhgZMCqqJHlPO7tJZZTKU4AtJ3loSmVxcU57vGVAkvv-WGXVQF84p85v3VY8D_F7sSzaEIqX4WKq0KSmcnXEPToqdnmuEBccUqnGXYEW_XfnAi5dv4sqxBcz_frOZkHSm-9EEQp_raSfV2znod1aUGFEggMpwTgnHypjg_-EyAcM8eOF2in8z8lcmnabRuXdZkkzMQgFQYoglnvs4ismvEbS1P-XfFqoE" />
            <img alt="User 3" className="w-6 h-6 rounded-full border-2 border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhxxez0P6XlDlewpob_SHRwP9nu9YxnFv62ptAnpc4JRMWrJGsPK5_eXsy-nqpUm4iXrQ_5X0_-4lgQiWxDc-ezYsw4jKb4TwUywce21dRuUKw-C3TpHYsXIS66lAI9ANuKh7AIpXxg4lDZx8kcuZLxnpWKbadSxJEwtbkL1VUl-4mCm0cgC50m4JdsPyFuEZGOcWtbXV0c2xSaGv7iwXfXQ_5GKU9HmrkAHtgO5DjPd4iaX_wpyXuqz8yxA2rxnNzULNaAa_yZNU" />
          </div>
          <span className="font-label text-label-sm font-semibold text-on-surface/70 tracking-widest uppercase text-xs">50.000+ Pelajar telah bergabung</span>
        </div>

        {/* Central Headline */}
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-center mb-16 tracking-tight">
          Selamat Datang, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Pelajar'}</span>! <br />
          <span className="text-on-surface-variant/80 italic font-medium text-3xl md:text-4xl">Belajar Lebih Pintar Bersama StudySync.</span>
        </h1>

        {/* To-Do List (Assignments Real-time) */}
        <div className="w-full mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-black font-headline text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">assignment</span>
              Tugas Mendatang
            </h2>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full animate-in fade-in duration-1000">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgb(0,119,255,0.6)]"></span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Sync Database</span>
            </div>
          </div>

          {loading ? (
             <div className="flex justify-center py-12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm">
               <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
             </div>
          ) : assignments.length === 0 ? (
             <div className="bg-white border border-outline-variant/30 rounded-3xl p-12 text-center editorial-shadow">
               <span className="material-symbols-outlined text-on-surface-variant/30 text-6xl mb-4">task</span>
               <p className="font-bold text-on-surface-variant text-lg">Hore! Belum ada tugas.</p>
               <p className="text-sm text-on-surface-variant/70 mt-1">Data ditarik secara langsung dari Supabase Anda.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               {assignments.map((task: any) => (
                 <div key={task.id} className="bg-white border border-outline-variant/30 rounded-2xl p-6 hover:border-primary/40 transition-all shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,119,255,0.08)] group cursor-pointer flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-[10px] font-extrabold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg">{task.course_name}</span>
                     <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1.5 rounded-lg border ${new Date(task.due_date) < new Date() ? 'bg-error/10 text-error border-error/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                       {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                     </span>
                   </div>
                   <h3 className="font-extrabold text-xl text-on-surface mb-2 group-hover:text-primary transition-colors leading-tight font-headline">{task.title}</h3>
                   <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant/30">
                     <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1.5 uppercase tracking-wider">
                       <span className="material-symbols-outlined text-[16px]">schedule</span> 
                       {task.status}
                     </p>
                     <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">arrow_forward</span>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* Collaborative Editor Interface / AI Ask Box */}
        <div className="w-full relative mt-8">
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-lg overflow-hidden transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
            {/* Editor Header */}
            <div className="px-6 py-4 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <h3 className="font-headline font-bold text-sm text-on-surface">Tanya AI Tutor</h3>
              </div>
            </div>

            {/* Editor Body */}
            <div className="relative min-h-[150px] p-6 bg-surface-container-lowest flex flex-col">
              {aiResponse && (
                 <div className="mb-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 text-on-surface text-sm whitespace-pre-wrap leading-relaxed">
                   <div className="flex items-center gap-2 mb-2 font-bold text-primary">
                     <span className="material-symbols-outlined text-sm">robot_2</span> AI Tutor:
                   </div>
                   {aiResponse}
                 </div>
              )}
              {aiLoading && (
                 <div className="mb-4 p-4 bg-surface-variant/50 rounded-2xl text-on-surface text-sm flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                   AI sedang berpikir...
                 </div>
              )}
              <textarea 
                className="w-full flex-1 p-0 text-lg font-body bg-transparent border-none outline-none focus:ring-0 placeholder:text-on-surface/30 resize-none leading-relaxed" 
                placeholder="Tanyakan materi pelajaran atau masukkan teks untuk dianalisis..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
              />
            </div>

            {/* Editor Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                  <span className="hidden sm:inline">Attach</span>
                </button>
                <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">translate</span>
                  <span className="hidden sm:inline">Translate</span>
                </button>
              </div>
              <button 
                onClick={handleAskAI}
                disabled={aiLoading || !aiInput.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm tracking-wide shadow-md hover:shadow-lg hover:bg-primary-fixed hover:text-on-primary-fixed active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features Section (Replaced bottom cards) */}
        <div className="mt-16 w-full grid md:grid-cols-2 gap-6 pb-24 md:pb-0">
          {/* Study Room Management */}
          <Link href="/rooms" className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/20 hover:border-primary/40 transition-all cursor-pointer group editorial-shadow block">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">groups</span>
              </div>
              <span className="material-symbols-outlined text-primary/40 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-2">Study Room Management</h3>
            <p className="text-sm text-on-surface/60 leading-relaxed">Kelola grup belajar per mata pelajaran, sinkronisasi catatan real-time, dan undang teman dalam hitungan detik.</p>
          </Link>

          {/* AI Tutor Chat */}
          <Link href="/notes/2" className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/20 hover:border-primary/40 transition-all cursor-pointer group editorial-shadow block">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">forum</span>
              </div>
              <span className="material-symbols-outlined text-primary/40 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-2">Personal AI Tutor Chat</h3>
            <p className="text-sm text-on-surface/60 leading-relaxed">Tanya apapun tentang materi akademikmu. AI Tutor kami memahami konteks catatanmu untuk penjelasan yang personal.</p>
          </Link>
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-background/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-12px_40px_rgba(0,97,164,0.04)]">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-primary px-5 py-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
          <span className="font-body text-[10px] font-medium tracking-wider uppercase mt-1">Dashboard</span>
        </Link>
        <Link href="/notes" className="flex flex-col items-center justify-center text-on-surface opacity-40 hover:text-primary hover:opacity-100 transition-all px-5 py-2">
          <span className="material-symbols-outlined">auto_stories</span>
          <span className="font-body text-[10px] font-medium tracking-wider uppercase mt-1">Notes</span>
        </Link>
        <Link href="/rooms" className="flex flex-col items-center justify-center text-on-surface opacity-40 hover:text-primary hover:opacity-100 transition-all px-5 py-2">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-body text-[10px] font-medium tracking-wider uppercase mt-1">Rooms</span>
        </Link>
      </nav>

      {/* Footer */}
      <footer className="w-full py-16 px-8 flex flex-col items-center gap-6 text-center bg-surface-container-low mt-20 pb-32 md:pb-16 hidden md:flex">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl font-black text-primary tracking-tighter font-headline">StudySync</span>
        </div>
        <div className="flex gap-8 mb-4">
          <Link href="#" className="font-body text-[11px] uppercase tracking-widest text-on-surface opacity-50 hover:text-primary transition-colors">Pusat Bantuan</Link>
          <Link href="#" className="font-body text-[11px] uppercase tracking-widest text-on-surface opacity-50 hover:text-primary transition-colors">Kebijakan Privasi</Link>
          <Link href="#" className="font-body text-[11px] uppercase tracking-widest text-on-surface opacity-50 hover:text-primary transition-colors">Ketentuan Layanan</Link>
        </div>
        <p className="font-body text-[11px] uppercase tracking-widest text-on-surface opacity-30">© 2026 StudySync. Dibuat dengan ❤️ untuk pelajar Indonesia.</p>
      </footer>
    </div>
  );
}
