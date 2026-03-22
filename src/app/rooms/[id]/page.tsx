"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AttendanceModal from "@/components/AttendanceModal";
import VideoCallOverlay from "@/components/VideoCallOverlay";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function RoomDetailsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([
    { role: 'assistant', content: 'Halo! Saya AI Tutor Ruangan ini. Ada yang bisa saya bantu terkait materi hari ini?' }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (data) {
        setRoom(data);
      } else {
        router.push('/rooms');
      }
      setLoading(false);
    };

    fetchRoom();
  }, [roomId, router]);

  useEffect(() => {
    if (!roomId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (data) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          sender: msg.sender_name,
          role: msg.sender_role,
          content: msg.content,
          file_url: msg.file_url,
          file_name: msg.file_name,
          time: new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formattedMessages);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, 
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => {
            // Check if message already exists (to prevent duplicates if the sender also received its own insert)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            
            return [...prev, {
              id: newMsg.id,
              sender: newMsg.sender_name,
              role: newMsg.sender_role,
              content: newMsg.content,
              file_url: newMsg.file_url,
              file_name: newMsg.file_name,
              time: new Date(newMsg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const messageData = {
      room_id: roomId,
      sender_name: profile?.full_name || localStorage.getItem('studysync_nisn') || user?.email?.split('@')[0] || "Siswa",
      sender_role: profile?.role || "student",
      content: chatInput
    };

    const { data, error } = await supabase
      .from('room_messages')
      .insert([messageData])
      .select();

    if (error) {
      console.error("Gagal mengirim pesan:", error.message || error);
      return;
    }
    
    setChatInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Send a message with the file
      const { error: insertError } = await supabase.from('room_messages').insert([{
        room_id: roomId,
        sender_name: profile?.full_name || localStorage.getItem('studysync_nisn') || user?.email?.split('@')[0] || "Siswa",
        sender_role: profile?.role || "student",
        content: `Berkas Terlampir: ${file.name}`,
        file_url: publicUrl,
        file_name: file.name
      }]);

      if (insertError) throw insertError;
    } catch (error: any) {
      console.error("Gagal mengunggah file:", error.message || error);
      alert("Gagal mengunggah file. Pastikan bucket 'attachments' sudah dibuat di Supabase Storage.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAskAI = async () => {
    if (!aiInput.trim()) return;

    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);

    // Mock AI Response - In a real app, call OpenAI/Gemini API here
    setTimeout(() => {
      const responses = [
        `Tentu! Terkait ${room?.name || 'materi ini'}, hal yang paling penting untuk dipahami adalah konsep dasarnya terlebih dahulu.`,
        "Itu pertanyaan yang bagus! Jika kita melihat diskusi di ruangan ini, sepertinya fokus utamanya adalah pemahaman praktis.",
        "Berdasarkan topik yang Anda tanyakan, saya sarankan untuk membaca kembali modul yang sudah dibagikan guru.",
        "Sangat menarik! Mari kita diskusikan lebih dalam. Apakah ada bagian spesifik yang menurut Anda sulit?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
      setIsAiLoading(false);
    }, 1500);
  };

  const handleManualAttendance = async () => {
    if (hasCheckedIn) return;
    setIsAttendanceModalOpen(true);
  };

  const submitAttendance = async (data: { name: string; className: string; studentNumber: string; nisn: string; photo?: File | null }) => {
    setIsAttendanceLoading(true);
    
    let photoUrl = "";
    if (data.photo) {
      const fileExt = data.photo.name.split('.').pop();
      const fileName = `${user?.id || 'anon'}-${Date.now()}.${fileExt}`;
      const filePath = `attendance/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attendance_photos')
        .upload(filePath, data.photo);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('attendance_photos')
          .getPublicUrl(filePath);
        photoUrl = publicUrl;
      } else {
        console.error("Gagal upload foto absensi:", uploadError.message);
      }
    }
    
    const { error } = await supabase.from('attendance').insert([{
      class_id: roomId,
      student_name: data.name,
      class_name: data.className,
      student_number: data.studentNumber,
      nisn: data.nisn,
      photo_url: photoUrl
    }]);

    if (!error || error.code === '23505') {
      setHasCheckedIn(true);
      setIsAttendanceModalOpen(false);
      localStorage.setItem('studysync_name', data.name);
      if (data.nisn) localStorage.setItem('studysync_nisn', data.nisn);
    } else {
      alert("Gagal absen: " + error.message);
    }
    setIsAttendanceLoading(false);
  };

  if (authLoading || loading) {
    return (
      <LoadingScreen message="Memasuki Ruangan..." />
    );
  }

  if (!room) return null;

  const initial = room.name ? room.name.substring(0, 2).toUpperCase() : 'SS';

  return (
    <div className="bg-surface-container-lowest text-on-surface min-h-screen flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* App Bar */}
      <header className="flex-none h-16 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/rooms')} className="p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">{room.icon || 'cast_for_education'}</span>
            </div>
            <div>
              <h1 className="text-lg font-black font-headline tracking-tight leading-none mb-1">{room.name}</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> {room.subject || 'General'}</span>
                <span>•</span>
                <span>{room.members_count || 1} Members</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex -space-x-2 mr-2">
            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">{initial}</div>
          </div>
          <button 
            onClick={() => setIsVideoActive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            Mulai Daring
          </button>
          <button 
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all flex items-center justify-center"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors md:hidden">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] w-full mx-auto relative">
        
        {/* Left/Main Column: Discussion Board */}
        <section className="flex-1 flex flex-col border-r border-outline-variant/30 bg-surface">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-primary">forum</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface mb-2">Belum Ada Pesan</h3>
                <p className="text-sm text-on-surface-variant max-w-xs">Mulai diskusi dengan mengetikkan pesan pertama Anda di kolom bawah.</p>
              </div>
            ) : (
              <>
                <div className="text-center my-4">
                  <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-full shadow-sm">Today</span>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
                    {msg.role === 'system' ? (
                      <div className="bg-primary/10 border border-primary/20 text-on-surface-variant text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-medium">
                        <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                        {msg.content}
                        <span className="text-[10px] opacity-70 ml-2">{msg.time}</span>
                      </div>
                    ) : (
                      <div className="flex gap-3 max-w-[85%] sm:max-w-xl group">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 shadow-sm">
                          {msg.sender.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{msg.sender}</span>
                            {msg.role === 'teacher' ? (
                              <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Guru</span>
                            ) : (
                              <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Siswa</span>
                            )}
                            <span className="text-[10px] text-on-surface-variant font-medium ml-1">{msg.time}</span>
                          </div>
                          {msg.file_url ? (
                            <div className="flex flex-col gap-2">
                              {msg.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <div className="max-w-xs sm:max-w-md overflow-hidden rounded-2xl border border-outline-variant/30 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer">
                                  <img 
                                    src={msg.file_url} 
                                    alt={msg.file_name} 
                                    className="w-full h-auto object-cover max-h-[300px]"
                                    onClick={() => window.open(msg.file_url, '_blank')}
                                  />
                                </div>
                              ) : msg.file_name?.match(/\.(mp4|webm|ogg)$/i) ? (
                                <div className="max-w-xs sm:max-w-md overflow-hidden rounded-2xl border border-outline-variant/30 shadow-sm bg-black">
                                  <video 
                                    src={msg.file_url} 
                                    controls 
                                    className="w-full h-auto max-h-[300px]"
                                  />
                                </div>
                              ) : (
                                <a 
                                  href={msg.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 bg-white border border-outline-variant/30 rounded-2xl rounded-tl-none shadow-sm hover:border-primary/40 transition-all group/file"
                                >
                                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover/file:bg-primary group-hover/file:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                  </div>
                                  <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-xs font-bold text-on-surface truncate mb-0.5">{msg.file_name || 'Berkas Terlampir'}</p>
                                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">Klik untuk mengunduh</p>
                                  </div>
                                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[18px]">download</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl shadow-sm text-sm leading-relaxed bg-white border border-outline-variant/20 rounded-tl-none">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-outline-variant/30">
            <div className="flex items-end gap-2 bg-surface-container-lowest border border-outline-variant-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 p-2 rounded-2xl transition-all shadow-inner">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-colors shrink-0 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined ${isUploading ? 'animate-spin' : ''}`}>
                  {isUploading ? 'sync' : 'attach_file'}
                </span>
              </button>
              <textarea 
                placeholder="Bagikan sesuatu ke ruang kelas..." 
                className="w-full bg-transparent border-none outline-none resize-none text-sm py-2 custom-scrollbar max-h-32 min-h-[40px]"
                rows={1}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Room Info & AI */}
        <aside className="hidden md:flex flex-col w-80 lg:w-96 bg-surface-container-lowest shrink-0">
          {/* Room Info */}
          <div className="p-5 border-b border-outline-variant/20">
            <h2 className="font-bold font-headline text-base mb-4">Informasi Ruangan</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white border border-outline-variant/30 rounded-xl">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold truncate">{room.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">{room.subject || 'Kelas Sinkron'} • {room.members_count || 1} anggota</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white border border-outline-variant/30 rounded-xl">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold truncate">Status</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">{room.last_active || 'Aktif sekarang'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 bg-surface border border-outline-variant/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
                  <span className="text-sm font-bold">Presensi Kehadiran</span>
                </div>
                {hasCheckedIn ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="text-xs font-bold">Sudah Terabsen</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleManualAttendance}
                    className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">front_hand</span>
                    Absen Sekarang
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="flex-1 flex flex-col bg-surface overflow-hidden">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <span className="font-bold text-sm tracking-tight text-primary-fixed-dim">Room AI Assistant</span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            </div>
            
            <div className="flex-1 p-4 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'assistant' 
                        ? 'bg-white border border-outline-variant/30 text-on-surface rounded-tl-none' 
                        : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-outline-variant/30 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
                <div ref={aiMessagesEndRef} />
              </div>

              <div className="relative mt-auto">
                <input 
                  type="text" 
                  placeholder="Tanya AI Tutor..."
                  className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-xs outline-none transition-all pr-10"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                />
                <button 
                  onClick={handleAskAI}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-md disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
              </div>
              <p className="text-[9px] text-center text-on-surface-variant mt-2 font-medium">AI Tutor dapat membuat kesalahan. Periksa informasi penting.</p>
            </div>
          </div>
        </aside>

      </main>
      <AttendanceModal 
        isOpen={isAttendanceModalOpen} 
        onClose={() => setIsAttendanceModalOpen(false)} 
        onSubmit={submitAttendance}
        loading={isAttendanceLoading}
      />
      <VideoCallOverlay 
        isOpen={isVideoActive} 
        onClose={() => setIsVideoActive(false)} 
        roomName={room.name} 
        userName={profile?.full_name || user?.email?.split('@')[0] || "Siswa"}
      />
    </div>
  );
}
