"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import JoinRoomModal from "@/components/JoinRoomModal";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";

export default function RoomsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      // In a real app, you might want to filter rooms by classes the user is enrolled in
      const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
      if (data) setRooms(data);
      setLoading(false);
    };

    fetchRooms();

    const channel = supabase.channel('realtime_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleJoinWithLink = async (link: string) => {
    if (!user || !profile) {
      throw new Error("Anda harus login untuk bergabung ke ruangan.");
    }

    if (!link.includes("/join/")) {
      throw new Error("Format link tidak sesuai.");
    }

    const parts = link.split('/join/');
    const joinId = parts[1];

    // Check if UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(joinId)) {
      // Fallback for old style mock links
      const slugParts = joinId.split('-');
      const className = slugParts.slice(0, -1).join(' ').replace(/-/g, ' '); 
      const finalName = className ? className.charAt(0).toUpperCase() + className.slice(1) : "Kelas Baru";
      
      const { error } = await supabase.from('rooms').insert([{
        name: finalName,
        subject: "Kelas Sinkron",
        members_count: 1,
        icon: 'cast_for_education',
        user_id: user.id
      }]);
      
      if (error) throw new Error(error.message);
      return;
    }

    // New logic: Join by actual ID
    // 1. Check if room already exists
    const { data: existing } = await supabase.from('rooms').select('id').eq('id', joinId).single();
    
    if (!existing) {
      // 2. Fetch class info to create the room entry
      const { data: classData } = await supabase.from('classes').select('*').eq('id', joinId).single();
      
      const { error } = await supabase.from('rooms').insert([{
        id: joinId, // Use the same ID!
        name: classData?.name || "Kelas Baru",
        subject: classData?.grade || "Kelas Sinkron",
        members_count: 1,
        icon: 'cast_for_education',
        user_id: user.id
      }]);
      
      if (error) throw new Error(error.message);
    }

    // 3. Record Attendance with REAL user data
    const studentName = profile.full_name || user.email?.split('@')[0] || "Siswa";
    await supabase.from('attendance').upsert([{
      class_id: joinId,
      student_name: studentName,
      joined_at: new Date().toISOString()
    }], { onConflict: 'class_id, student_name' });

    // 4. Navigate to the room
    window.location.href = `/rooms/${joinId}`;
  };

  if (authLoading) {
    return <LoadingScreen message="Memuat Study Groups..." />;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen relative">
      {/* TopNavBar */}
      <header className="bg-transparent sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto font-headline text-sm tracking-tight">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-on-surface">StudySync</Link>
            <div className="hidden md:flex gap-8">
              <Link href="/dashboard" className="text-on-surface/60 hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/rooms" className="text-primary font-semibold border-b-2 border-primary pb-1">Rooms</Link>
              <Link href="/notes/1" className="text-on-surface/60 hover:text-primary transition-colors">AI Tutor</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex bg-surface-container-low px-4 py-2 rounded-full items-center gap-3">
              <span className="material-symbols-outlined text-on-surface/40">search</span>
              <input className="bg-transparent border-none outline-none focus:ring-0 text-sm w-48" placeholder="Search rooms..." type="text" />
            </div>
            <div className="flex items-center gap-4">
              <button className="material-symbols-outlined text-on-surface-variant hover:bg-primary/10 p-2 rounded-full transition-all">notifications</button>
              <button 
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }}
                className="material-symbols-outlined text-on-surface-variant hover:text-error hover:bg-error/10 p-2 rounded-full transition-all"
                title="Logout"
              >
                logout
              </button>
              <Link href="/settings" className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm hover:scale-105 transition-transform uppercase">
                {profile?.full_name?.substring(0, 2) || (user?.email?.substring(0, 2) || 'S')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-screen-2xl mx-auto">
        {/* SideNavBar */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full p-6 bg-surface-container-lowest w-72 border-r border-outline-variant/20 z-40 pt-24 font-headline font-medium">
          <div className="flex flex-col gap-2">
            <Link href="/rooms" className="flex items-center gap-3 bg-primary/10 text-primary rounded-xl px-4 py-3 hover:translate-x-1 transition-transform duration-200">
              <span className="material-symbols-outlined">group</span>
              <span>My Study Groups</span>
            </Link>
            <Link href="/notes" className="flex items-center gap-3 text-on-surface/70 px-4 py-3 hover:translate-x-1 hover:bg-surface-container transition-all duration-200 rounded-xl">
              <span className="material-symbols-outlined">library_books</span>
              <span>Resource Library</span>
            </Link>
            <Link href="/schedule" className="flex items-center gap-3 text-on-surface/70 px-4 py-3 hover:translate-x-1 hover:bg-surface-container transition-all duration-200 rounded-xl">
              <span className="material-symbols-outlined">calendar_today</span>
              <span>Schedule</span>
            </Link>
            <Link href="/achievements" className="flex items-center gap-3 text-on-surface/70 px-4 py-3 hover:translate-x-1 hover:bg-surface-container transition-all duration-200 rounded-xl">
              <span className="material-symbols-outlined">emoji_events</span>
              <span>Achievements</span>
            </Link>
          </div>
          <div className="mt-auto mb-8">
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Pro Tip</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Active rooms with 10+ members boost grades by 25%.</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-8 md:p-12 pb-32">
          {/* Hero Header */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <span className="text-primary font-semibold tracking-widest text-xs uppercase">Your Academic Sanctuary</span>
                <h1 className="text-5xl font-extrabold text-on-surface tracking-tighter leading-tight font-headline">Study Room<br />Management</h1>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsJoinModalOpen(true)} className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-8 py-4 rounded-xl font-semibold flex items-center gap-2 hover:bg-surface-container-low hover:border-primary/50 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-xl">link</span>
                  Join with Link
                </button>
              </div>
            </div>
          </div>

          {/* Bento Grid - Room Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full py-16 flex justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">search_off</span>
                <p className="font-bold text-on-surface-variant text-lg">Tidak ada *study room* aktif</p>
                <p className="text-sm text-on-surface-variant/70">Bergabunglah menggunakan link atau buat *room* baru.</p>
              </div>
            ) : (
             rooms.map(room => (
              <Link href={`/rooms/${room.id}`} key={room.id} className="group bg-surface-container-lowest p-8 rounded-xl editorial-shadow hover:shadow-xl transition-all border border-outline-variant/10 hover:border-primary/30 relative overflow-hidden block">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl">{room.icon || 'groups'}</span>
                  </div>
                  <h3 className="text-2xl font-bold font-headline mb-2 group-hover:text-primary transition-colors">{room.name}</h3>
                  <div className="flex items-center gap-4 text-on-surface-variant text-sm mb-8">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">groups</span>
                      {room.members_count || 1} Members
                    </span>
                    <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {room.last_active || 'Baru saja'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-xs font-bold font-headline">SS</div>
                    </div>
                    <button className="material-symbols-outlined text-primary hover:bg-primary/10 p-2 rounded-full transition-all">arrow_forward</button>
                  </div>
                </div>
              </Link>
             ))
            )}
          </div>

          {/* Featured Section (Asymmetric) */}
          <section className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-surface-container-low p-10 rounded-xl border border-outline-variant/10">
              <h2 className="text-3xl font-bold tracking-tight mb-4 font-headline">Aktivitas Terbaru</h2>
              <p className="text-on-surface-variant mb-8 max-w-lg">Papan ini menampilkan pembaruan otomatis dari ruang diskusi Anda. Bergabung dengan *room* untuk melihat interaksi masuk.</p>
              
              <div className="space-y-4">
                <div className="flex justify-center items-center py-8 text-on-surface-variant text-sm">Belum ada aktivitas terekam.</div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-primary to-secondary-container p-10 rounded-xl text-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white">auto_awesome</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-4 font-headline text-white">AI Tutor Assistant</h2>
                <p className="text-white/80 leading-relaxed mb-6">Our AI can now analyze your study group's shared resources and generate summaries for your next session.</p>
              </div>
              <Link href="/notes/1">
                <button className="bg-white text-primary px-6 py-3 rounded-xl font-bold text-sm w-fit shadow-lg shadow-black/10 hover:translate-x-1 transition-all">Try AI Analysis</button>
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Navigation (BottomNavBar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-surface-variant h-16 flex items-center justify-around z-50 px-4">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link href="/rooms" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined">groups</span>
          <span className="text-[10px] font-bold">Rooms</span>
        </Link>
        <Link href="/notes/1" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined">smart_toy</span>
          <span className="text-[10px] font-medium">AI Tutor</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
      <JoinRoomModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinWithLink}
      />
    </div>
  );
}
