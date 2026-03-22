"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function NotesIndexPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNote = async () => {
    if (!user) return;
    setIsCreating(true);
    const { data, error } = await supabase.from('notes').insert([{
      title: "Catatan Baru",
      subject: "General",
      is_shared: false,
      user_id: user.id
    }]).select();

    if (error) {
      alert("Gagal membuat catatan: " + error.message);
      setIsCreating(false);
    } else if (data && data[0]) {
      router.push(`/notes/${data[0].id}`);
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;

    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      alert("Gagal menghapus catatan: " + error.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setNotes(data);
      setLoading(false);
    };

    fetchNotes();

    const channel = supabase.channel(`realtime_notes_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading || loading) {
    return <LoadingScreen message="Menyiapkan Perpustakaan..." />;
  }

  const [activeTab, setActiveTab] = useState('All Notes');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const filteredNotes = notes.filter(note => {
    if (activeFolder) return note.subject === activeFolder;
    if (activeTab === 'Shared with Me') return note.shared;
    if (activeTab === 'Favorites') return false;
    if (activeTab === 'Trash') return false;
    return true;
  });

  const getTabClass = (tabName: string) => {
    return activeTab === tabName && !activeFolder
      ? "flex items-center gap-3 bg-primary/10 text-primary rounded-xl px-4 py-3 font-semibold transition-all cursor-pointer"
      : "flex items-center gap-3 text-on-surface/70 hover:bg-surface-container hover:text-on-surface rounded-xl px-4 py-3 font-medium transition-all cursor-pointer";
  };

  const getFolderClass = (folderName: string) => {
    return activeFolder === folderName
      ? "flex items-center justify-between border border-primary/20 bg-primary/10 text-primary rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer"
      : "flex items-center justify-between text-on-surface/70 hover:bg-surface-container hover:text-on-surface rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer";
  };

  return (
    <div className="bg-background text-on-surface min-h-screen font-body pb-24 md:pb-0">
      {/* TopNavBar */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/20 shadow-sm transition-all">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto font-headline text-sm tracking-tight">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black text-primary tracking-tighter">StudySync</Link>
            <div className="hidden md:flex gap-8">
              <Link href="/dashboard" className="text-on-surface/60 hover:text-primary font-bold transition-colors uppercase tracking-widest text-[11px]">Dashboard</Link>
              <Link href="/rooms" className="text-on-surface/60 hover:text-primary font-bold transition-colors uppercase tracking-widest text-[11px]">Rooms</Link>
              <Link href="/notes" className="text-primary font-extrabold border-b-2 border-primary pb-1 uppercase tracking-widest text-[11px]">Resource Library</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex bg-surface-container-low px-4 py-2 rounded-full items-center gap-3 border border-outline-variant/20 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface/40 text-[18px]">search</span>
              <input className="bg-transparent border-none outline-none focus:ring-0 text-sm w-48 placeholder:text-on-surface/40" placeholder="Search notes..." type="text" />
            </div>
            <Link href="/settings" className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm hover:scale-105 transition-transform uppercase">
              {profile?.full_name?.substring(0, 2) || (user?.email?.substring(0, 2) || 'S')}
            </Link>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto px-6 pt-10 pb-20 gap-8">
        
        {/* Left Sidebar Menu */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 font-headline">
          <button 
            onClick={handleCreateNote}
            disabled={isCreating}
            className="bg-primary text-white w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mb-8 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className={`material-symbols-outlined text-xl ${isCreating ? 'animate-spin' : ''}`}>
               {isCreating ? 'sync' : 'add'}
            </span>
            {isCreating ? 'Membuka...' : 'Create New Note'}
          </button>
          
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2 px-4">Library</div>
            <div onClick={() => { setActiveTab('All Notes'); setActiveFolder(null); }} className={getTabClass('All Notes')}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              All Notes
            </div>
            <div onClick={() => { setActiveTab('Shared with Me'); setActiveFolder(null); }} className={getTabClass('Shared with Me')}>
              <span className="material-symbols-outlined">folder_shared</span>
              Shared with Me
            </div>
            <div onClick={() => { setActiveTab('Favorites'); setActiveFolder(null); }} className={getTabClass('Favorites')}>
              <span className="material-symbols-outlined">star</span>
              Favorites
            </div>
            <div onClick={() => { setActiveTab('Trash'); setActiveFolder(null); }} className={getTabClass('Trash')}>
              <span className="material-symbols-outlined">delete</span>
              Trash
            </div>
          </div>

          <div className="mt-12">
            <div className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-4 px-4">Folders</div>
            <div className="flex flex-col gap-1">
              {['Biologi', 'Matematika', 'Sastra', 'Sejarah'].map((folder) => (
                <div key={folder} onClick={() => { setActiveFolder(folder); setActiveTab(''); }} className={getFolderClass(folder)}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary/60 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                    {folder}
                  </div>
                  <span className="material-symbols-outlined text-xs opacity-0 hover:opacity-100 transition-opacity">more_vert</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tighter">My Notes</h1>
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-1 border border-outline-variant/30">
              <button className="p-2 rounded-md bg-white text-primary shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button className="p-2 rounded-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
              <div className="w-px h-6 bg-outline-variant/30 mx-1"></div>
              <button className="p-2 rounded-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">sort</span> Sort
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-16 flex justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">search_off</span>
                <p className="font-bold text-on-surface-variant text-lg">Tidak ada catatan di sini</p>
                <p className="text-sm text-on-surface-variant/70">Coba pilih folder atau menu lain.</p>
              </div>
            ) : (
            filteredNotes.map(note => (
               <Link href={`/notes/${note.id}`} key={note.id} className="group bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col h-48 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500"></div>
                 
                 <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                     <span className="material-symbols-outlined text-[24px]">{note.icon || 'description'}</span>
                   </div>
                   <div className="flex gap-1 items-center">
                     <button 
                       onClick={(e) => handleDeleteNote(e, note.id)}
                       className="text-on-surface-variant/40 hover:text-error transition-colors p-1"
                     >
                       <span className="material-symbols-outlined text-[18px]">delete</span>
                     </button>
                     <button className="text-on-surface-variant/40 hover:text-primary transition-colors p-1">
                       <span className="material-symbols-outlined text-[18px]">more_vert</span>
                     </button>
                   </div>
                 </div>
                 
                 <h3 className="font-headline font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors relative z-10 line-clamp-2">
                   {note.title}
                 </h3>
                 
                 <div className="mt-auto flex items-center justify-between text-xs font-semibold text-on-surface-variant relative z-10">
                   <span className="bg-surface-container-high px-2 py-1 rounded-md">{note.subject}</span>
                   <div className="flex items-center gap-3">
                     {note.is_shared && <span className="material-symbols-outlined text-[14px] text-primary">groups</span>}
                     <span>{note.last_edited || 'Just now'}</span>
                   </div>
                 </div>
               </Link>
            )))}
          </div>
        </main>
      </div>

      {/* Basic Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button onClick={handleCreateNote} disabled={isCreating} className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 active:scale-95 transition-transform disabled:opacity-70 outline-none">
          <span className={`material-symbols-outlined text-3xl ${isCreating ? 'animate-spin' : ''}`}>
             {isCreating ? 'sync' : 'edit'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation (BottomNavBar) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-2 pb-safe bg-background/90 backdrop-blur-md border-t border-outline-variant/10 shadow-lg rounded-t-xl z-50">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:opacity-70 transition-colors">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-1">Home</span>
        </Link>
        <Link href="/notes" className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-xl px-4 py-1.5 active:opacity-70 transition-colors">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <span className="text-[10px] font-bold mt-1">Library</span>
        </Link>
        <Link href="/rooms" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:opacity-70 transition-colors">
          <span className="material-symbols-outlined">groups</span>
          <span className="text-[10px] font-medium mt-1">Groups</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:opacity-70 transition-colors">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
