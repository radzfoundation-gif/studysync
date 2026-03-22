"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ShareLinkModal from "@/components/ShareLinkModal";
import CreateAssignmentModal from "@/components/CreateAssignmentModal";
import CreateQuizModal from "@/components/CreateQuizModal";
import VideoCallOverlay from "@/components/VideoCallOverlay";
import { useAuth } from "@/context/AuthContext";

export default function TeacherRoomPage() {
  const { user, profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;

  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementInput, setAnnouncementInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [aiMessages, setAiMessages] = useState<any[]>([
    { role: 'assistant', content: 'Halo Guru! Saya AI Asisten Anda. Ada yang bisa saya bantu untuk mengelola kelas ini?' }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [counts, setCounts] = useState({ assignments: 0, quizzes: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [announcements]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  useEffect(() => {
    if (!classId) return;

    const fetchData = async () => {
      // Fetch Class Info
      const { data: classData } = await supabase.from('classes').select('*').eq('id', classId).single();
      if (classData) {
        setCls(classData);
      } else {
        router.push('/dashboard-teacher');
        return;
      }

      // Fetch Counts
      const { count: assignmentCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);
      
      const { count: quizCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true }); // Quizzes aren't linked to classes yet in schema?
        
      setCounts({
        assignments: assignmentCount || 0,
        quizzes: quizCount || 0
      });

      // Fetch Attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId)
        .order('joined_at', { ascending: false });
      
      if (attendanceData) setAttendance(attendanceData);

      setLoading(false);
    };

    fetchData();
  }, [classId, router]);

  const handleDeleteClass = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) {
      alert("Gagal menghapus kelas: " + error.message);
    } else {
      router.push('/dashboard-teacher');
    }
  };

  useEffect(() => {
    if (!classId) return;

    // Fetch initial announcements/messages
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', classId)
        .order('created_at', { ascending: true });
      
      if (data) {
        const formattedAnnouncements = data.map(msg => ({
          id: msg.id,
          sender: msg.sender_name,
          role: msg.sender_role,
          content: msg.content,
          file_url: msg.file_url,
          file_name: msg.file_name,
          time: new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }));
        setAnnouncements(formattedAnnouncements);
      }
    };

    fetchAnnouncements();

    // Subscribe to new announcements
    const channel = supabase.channel(`class_${classId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${classId}` }, 
        (payload) => {
          const newMsg = payload.new;
          setAnnouncements(prev => {
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

    // Subscribe to attendance
    const attendanceChannel = supabase.channel(`attendance_${classId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `class_id=eq.${classId}` }, 
        (payload) => {
          setAttendance(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(attendanceChannel);
    };
  }, [classId]);

  const handlePostAnnouncement = async () => {
    if (!announcementInput.trim()) return;
    
    const messageData = {
      room_id: classId,
      sender_name: profile?.full_name || user?.email?.split('@')[0] || "Guru",
      sender_role: "teacher",
      content: announcementInput
    };

    const { error } = await supabase
      .from('room_messages')
      .insert([messageData]);

    if (error) {
      console.error("Gagal mengirim pengumuman:", error.message || error);
      return;
    }
    
    setAnnouncementInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${classId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Send a message with the file
      const { error: insertError } = await supabase.from('room_messages').insert([{
        room_id: classId,
        sender_name: profile?.full_name || user?.email?.split('@')[0] || "Guru",
        sender_role: "teacher",
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

    // Mock AI Response
    setTimeout(() => {
      const responses = [
        `Halo Guru, untuk kelas ${cls?.name || 'ini'}, saya bisa membantu memantau keaktifan siswa atau menyusun materi tambahan.`,
        "Tentu! Apakah Anda ingin saya membuat draf tugas atau kuis berdasarkan topik diskusi hari ini?",
        "Statistik kelas menunjukkan progres yang baik. Ada hal spesifik yang ingin Anda tanyakan mengenai data siswa?",
        "Saya siap membantu! Saya juga bisa memberikan saran metode pembelajaran yang interaktif untuk topik ini."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
      setIsAiLoading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="material-symbols-outlined text-primary">cast_for_education</span>
        </div>
        <p className="mt-4 text-on-surface-variant font-medium animate-pulse">Memuat Ruang Kelas...</p>
      </div>
    );
  }

  if (!cls) return null;

  return (
    <div className="bg-[#f8f9fc] text-on-surface min-h-screen flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Teacher App Bar */}
      <header className="flex-none h-16 bg-white border-b border-outline-variant/30 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard-teacher')} className="p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${cls.theme_color || 'bg-primary'} rounded-xl flex items-center justify-center text-white shadow-sm`}>
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h1 className="text-lg font-black font-headline tracking-tight leading-none mb-0.5">{cls.name}</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black text-[9px]">GURU</span>
                <span>{cls.grade || 'Umum'}</span>
                <span>•</span>
                <span>{cls.students || 0} Siswa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsVideoActive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            Mulai Daring
          </button>
          <button onClick={() => setIsShareOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:shadow-lg transition-all">
            <span className="material-symbols-outlined text-[18px]">share</span>
            Bagikan Link
          </button>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-outline-variant/50 text-on-surface font-bold rounded-lg text-sm hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Kelola
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] w-full mx-auto relative">
        
        {/* Left/Main Column: Teacher Feed */}
        <section className="flex-1 flex flex-col border-r border-outline-variant/30 bg-white">
          
          {/* Teacher Quick Actions Bar */}
          <div className="p-4 border-b border-outline-variant/20 bg-primary/5 flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest shrink-0">Quick Actions</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAssignmentModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface hover:border-primary/50 hover:text-primary transition-all shrink-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">assignment_add</span>
                Buat Tugas
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface hover:border-primary/50 hover:text-primary transition-all shrink-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Unggah Materi
              </button>
              <button 
                onClick={() => setIsQuizModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface hover:border-primary/50 hover:text-primary transition-all shrink-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">quiz</span>
                Buat Kuis
              </button>
            </div>
          </div>

          {/* Announcement Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            
            {announcements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-primary">campaign</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface mb-2">Belum Ada Pengumuman</h3>
                <p className="text-sm text-on-surface-variant max-w-xs">Posting pengumuman pertama Anda untuk berkomunikasi dengan siswa di kelas ini.</p>
              </div>
            ) : (
              <>
                {announcements.map((msg) => (
                  <div key={msg.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {msg.sender.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">{msg.sender}</span>
                          {msg.role === 'teacher' ? (
                            <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">GURU</span>
                          ) : (
                            <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">SISWA</span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-medium">{msg.time}</span>
                      </div>
                    </div>
                    {msg.file_url ? (
                      <div className="flex flex-col gap-2">
                        {msg.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div className="max-w-xs sm:max-w-lg overflow-hidden rounded-xl border border-outline-variant/30 shadow-sm transition-transform hover:scale-[1.01] cursor-pointer">
                            <img 
                              src={msg.file_url} 
                              alt={msg.file_name} 
                              className="w-full h-auto object-cover max-h-[400px]"
                              onClick={() => window.open(msg.file_url, '_blank')}
                            />
                          </div>
                        ) : msg.file_name?.match(/\.(mp4|webm|ogg)$/i) ? (
                          <div className="max-w-xs sm:max-w-md overflow-hidden rounded-xl border border-outline-variant/30 shadow-sm bg-black">
                            <video 
                              src={msg.file_url} 
                              controls 
                              className="w-full h-auto max-h-[400px]"
                            />
                          </div>
                        ) : (
                          <a 
                            href={msg.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-surface border border-outline-variant/30 rounded-xl hover:border-primary/40 transition-all group/file"
                          >
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover/file:bg-primary group-hover/file:text-white transition-colors">
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
                      <p className="text-sm leading-relaxed text-on-surface">{msg.content}</p>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Post Announcement Input */}
          <div className="p-4 bg-white border-t border-outline-variant/30">
            <div className="flex items-end gap-2 bg-surface-container-lowest border border-outline-variant/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 p-2 rounded-2xl transition-all shadow-inner">
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
                placeholder="Tulis pengumuman untuk kelas ini..." 
                className="w-full bg-transparent border-none outline-none resize-none text-sm py-2 custom-scrollbar max-h-32 min-h-[40px]"
                rows={1}
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostAnnouncement();
                  }
                }}
              />
              <button 
                onClick={handlePostAnnouncement}
                disabled={!announcementInput.trim()}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Class Management */}
        <aside className="hidden md:flex flex-col w-80 lg:w-96 bg-white shrink-0 border-l border-outline-variant/20">
          
          {/* Class Stats */}
          <div className="p-5 border-b border-outline-variant/20">
            <h2 className="font-bold font-headline text-base mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
              Statistik Kelas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl text-center">
                <p className="text-2xl font-black text-primary font-headline">{cls.students || 0}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Siswa</p>
              </div>
              <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-center">
                <p className="text-2xl font-black text-green-600 font-headline">{counts.assignments}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Tugas</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                <p className="text-2xl font-black text-amber-600 font-headline">{counts.quizzes}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Kuis</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-center">
                <p className="text-2xl font-black text-purple-600 font-headline">-</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Rata-rata</p>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-outline-variant/20 flex-1 overflow-y-auto">
            <h2 className="font-bold font-headline text-base mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
                Presensi Siswa
              </div>
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">{attendance.length}</span>
            </h2>
            
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">event_note</span>
                <p className="text-xs text-on-surface-variant">Belum ada siswa yang hadir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3">
                      {entry.photo_url ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-outline-variant/30 cursor-zoom-in hover:scale-110 transition-transform bg-black/5 shrink-0">
                          <img 
                            src={entry.photo_url} 
                            alt="Bukti" 
                            className="w-full h-full object-cover"
                            onClick={() => window.open(entry.photo_url, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 bg-white border border-outline-variant/30 rounded-lg flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {entry.student_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-on-surface leading-tight mb-0.5">
                          {entry.student_name}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[9px] text-on-surface-variant font-medium">
                            Absen: {entry.student_number || '-'} {entry.nisn ? `• NISN: ${entry.nisn}` : ''}
                          </p>
                          <p className="text-[8px] text-on-surface-variant/70 uppercase font-black tracking-tighter">
                            Waktu: {new Date(entry.joined_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="p-5">
            <h2 className="font-bold font-headline text-sm mb-3 text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Zona Bahaya
            </h2>
            <button 
              onClick={handleDeleteClass}
              className="w-full py-2.5 border-2 border-error/30 text-error font-bold rounded-xl text-sm hover:bg-error hover:text-white hover:border-error transition-all"
            >
              Hapus Kelas Ini
            </button>
          </div>
        </aside>

      </main>

      <ShareLinkModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} className={cls.name} id={classId} />
      <CreateAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)} 
        classId={classId}
        courseName={cls.name}
        onSuccess={() => {
          // Re-fetch counts
          supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('class_id', classId)
            .then(({ count }) => setCounts(prev => ({ ...prev, assignments: count || 0 })));
        }}
      />
      <CreateQuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => setIsQuizModalOpen(false)} 
        classId={classId}
        courseName={cls.name}
        onSuccess={() => {
          // Re-fetch counts
          supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('class_id', classId)
            .then(({ count }) => setCounts(prev => ({ ...prev, quizzes: count || 0 })));
        }}
      />
      <VideoCallOverlay 
        isOpen={isVideoActive} 
        onClose={() => setIsVideoActive(false)} 
        roomName={cls.name} 
        userName={profile?.full_name || user?.email?.split('@')[0] || "Guru"} 
      />
    </div>
  );
}
