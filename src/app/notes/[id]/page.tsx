"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";

export default function CollaborativeNotesPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params?.id as string;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Halo! Saya StudySync AI Tutor. Ada yang bisa saya bantu dengan materi buku ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!noteId) return;

    const fetchNote = async () => {
      const { data, error } = await supabase.from('notes').select('*').eq('id', noteId).single();
      if (data) {
        setNote(data);
      } else {
        router.push('/notes');
      }
      setLoading(false);
    };

    fetchNote();
  }, [noteId, router]);

  const handleSendMessage = async () => {
    if (!input.trim() || isAiLoading) return;
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await response.json();
      if (response.ok && data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Pesan Error: " + data.error }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi masalah koneksi jaringan." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveNote = async (newContent: string) => {
    if (!note) return;
    setSaving(true);
    await supabase.from('notes').update({ content: newContent, last_edited: 'Baru saja' }).eq('id', note.id);
    setSaving(false);
  };

  const updateNoteMetadata = async (updates: any) => {
    if (!note) return;
    setSaving(true);
    const { error } = await supabase.from('notes').update({ ...updates, last_edited: 'Baru saja' }).eq('id', note.id);
    if (!error) {
      setNote((prev: any) => ({ ...prev, ...updates }));
    }
    setSaving(false);
  };

  const handleNextPage = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollContainerRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -scrollContainerRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <LoadingScreen message="Membuka Catatan..." />;
  }

  return (
    <div className="bg-[#f0f2f5] text-on-background font-body selection:bg-primary-container selection:text-on-primary-container overflow-hidden h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="flex-none w-full z-50 bg-white shadow-sm flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-4">
          <Link href="/notes" className="p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
               <span className="material-symbols-outlined">{note?.icon || 'menu_book'}</span>
             </div>
             <div>
               <input 
                 type="text"
                 className="text-sm font-bold tracking-tight bg-transparent border-none focus:ring-1 focus:ring-primary/20 rounded px-1 outline-none w-full"
                 value={note?.title || ''}
                 onChange={e => setNote((prev: any) => ({ ...prev, title: e.target.value }))}
                 onBlur={e => updateNoteMetadata({ title: e.target.value })}
               />
               <div className="flex items-center gap-2">
                 <select 
                   className="text-[10px] bg-surface-container-low border border-outline-variant/30 rounded px-1 text-on-surface-variant font-bold outline-none"
                   value={note?.subject || 'General'}
                   onChange={e => updateNoteMetadata({ subject: e.target.value })}
                 >
                   {['General', 'Biologi', 'Matematika', 'Sastra', 'Sejarah'].map(s => (
                     <option key={s} value={s}>{s}</option>
                   ))}
                 </select>
                 <span className="text-[10px] text-on-surface-variant font-medium">
                   {saving ? <span className="animate-pulse text-primary">Menyimpan...</span> : '• Tersimpan'}
                 </span>
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors">
            <span className="material-symbols-outlined text-[18px]">share</span>
            Bagikan
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Book Area */}
        <section className="flex-1 overflow-hidden relative flex flex-col items-center justify-center relative p-4 md:p-8">
          
          <div className="flex w-full max-w-5xl justify-between px-4 absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <button onClick={handlePrevPage} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center shadow-lg pointer-events-auto hover:scale-110 active:scale-95 transition-all text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button onClick={handleNextPage} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur border border-outline-variant/30 flex items-center justify-center shadow-lg pointer-events-auto hover:scale-110 active:scale-95 transition-all text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <p className="text-on-surface-variant/50 font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
             <span className="material-symbols-outlined text-sm">swipe</span>
             Navigasi Halaman
          </p>

          <div className="relative w-full max-w-4xl h-[70vh] bg-[#faf8f2] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm border border-[#e0dac1] flex overflow-hidden group">
            
            {/* Paper Texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none z-0"></div>

            {/* Book Spine (Middle Shadow) */}
            <div className="absolute top-0 bottom-0 left-1/2 w-16 -ml-8 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none mix-blend-multiply z-20"></div>

            {/* Content Container scrolling horizontally */}
            <div 
               ref={scrollContainerRef}
               className="w-full h-full overflow-x-hidden scroll-smooth relative z-10"
            >
              <div 
                 contentEditable 
                 suppressContentEditableWarning
                 onBlur={e => saveNote(e.currentTarget.innerHTML)}
                 className="h-full focus:outline-none text-on-surface leading-loose"
                 style={{
                   columnCount: 2,
                   columnGap: '60px',
                   columnFill: 'auto',
                   minHeight: '100%',
                   padding: '40px 50px',
                   fontSize: '15px'
                 }}
                 dangerouslySetInnerHTML={{ __html: note?.content || `<h1>Judul Bab 1</h1><p>Mulai ketikkan pemikiran Anda di buku ini...</p><p>Setiap paragraf yang melebih batas bawah akan otomatis meluncur ke halaman (kolom) berikutnya seperti sebuah lembaran buku cetak nyata.</p>` }}
              />
            </div>
            
          </div>
        </section>

        {/* Right Sidebar: AI Tutor Chat */}
        <aside className="hidden xl:flex flex-col w-80 bg-white border-l border-outline-variant/30 z-30">
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">smart_toy</span>
              <span className="font-bold text-sm">StudySync AI Tutor</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'} p-3 rounded-2xl text-[13px] font-medium max-w-[90%] whitespace-pre-wrap leading-relaxed shadow-sm border border-transparent ${msg.role !== 'user' && 'border-outline-variant/20'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex flex-col gap-1 items-start">
                <div className="bg-surface-container-low border border-outline-variant/20 p-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-outline animate-bounce rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-outline animate-bounce rounded-full" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-outline animate-bounce rounded-full" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20">
            <div className="relative">
              <textarea 
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3 pr-10 text-xs focus:border-primary outline-none focus:ring-4 focus:ring-primary/10 resize-none transition-all" 
                placeholder="Tanyakan hal detail seputar isi bukumu..." 
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button disabled={isAiLoading || !input.trim()} onClick={handleSendMessage} className="absolute right-2 bottom-2 p-1.5 bg-primary text-white rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </aside>
      </main>
      
    </div>
  );
}
