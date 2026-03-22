"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import StatusModal from "@/components/StatusModal";

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    complaints: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'info',
    title: '',
    message: ''
  });

  const showStatus = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Parallelized Fetching
        const [sRes, tRes, cRes, compRes, profilesRes] = await Promise.all([
          supabase.from('student_data').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          supabase.from('student_complaints').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*').order('created_at', { ascending: false })
        ]);

        setStats({
          students: sRes.count || 0,
          teachers: (tRes.count || 0) + 1, // Including admin
          classes: cRes.count || 0,
          complaints: compRes.count || 0
        });

        if (profilesRes.data) setUsers(profilesRes.data);

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, profile, authLoading]);

  // Handle Global Reset
  const handleGlobalReset = async () => {
    if (confirmText !== "RESET TOTAL") {
      showStatus('error', 'Konfirmasi Gagal', 'Silakan ketik "RESET TOTAL" untuk melanjutkan.');
      return;
    }

    setIsResetting(true);
    try {
      // Deleting in order of dependency if any
      await supabase.from('student_complaints').delete().neq('id', 0);
      await supabase.from('assignments').delete().neq('id', 0);
      await supabase.from('classes').delete().neq('id', 0);
      await supabase.from('student_data').delete().neq('id', 0);
      await supabase.from('quizzes').delete().neq('id', 0);
      await supabase.from('notes').delete().neq('id', 0);

      showStatus('success', 'Reset Berhasil', 'Seluruh data sistem telah dibersihkan.');
      setConfirmText("");
      
      // Refresh Stats
      setStats({ students: 0, teachers: stats.teachers, classes: 0, complaints: 0 });
    } catch (error: any) {
      showStatus('error', 'Gagal Reset', error.message || 'Terjadi kesalahan saat membersihkan data.');
    } finally {
      setIsResetting(false);
    }
  };

  // Handle User Deletion
  const handleDeleteUsers = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedUsers.size} pengguna terpilih? Data terkait juga akan terhapus.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', Array.from(selectedUsers));

      if (error) throw error;

      showStatus('success', 'Penghapusan Berhasil', `${selectedUsers.size} pengguna telah dihapus dari sistem.`);
      
      // Update local state
      setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      
      // Refresh Stats
      const [sRes, tRes, cRes, compRes] = await Promise.all([
        supabase.from('student_data').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('student_complaints').select('*', { count: 'exact', head: true })
      ]);
      setStats({
        students: sRes.count || 0,
        teachers: (tRes.count || 0) + 1,
        classes: cRes.count || 0,
        complaints: compRes.count || 0
      });
    } catch (error: any) {
      showStatus('error', 'Gagal Menghapus', error.message || 'Terjadi kesalahan saat menghapus pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectUser = (id: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen message="Memuat Panel Administrasi..." />;
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center bg-surface p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-error mb-4">lock</span>
          <h1 className="text-2xl font-black text-on-surface mb-2">Akses Ditolak</h1>
          <p className="text-on-surface-variant mb-6">Halaman ini hanya dapat diakses oleh Administrator Sistem.</p>
          <Link href="/dashboard-teacher" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-outline-variant/30 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard-teacher" className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-all group">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_back</span>
          </Link>
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            System Administration
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-on-surface uppercase tracking-widest leading-none mb-1">Admin Mode</p>
            <p className="text-[10px] text-primary font-bold">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
            A
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="people" label="Total Siswa" value={stats.students} color="bg-blue-500" />
          <StatCard icon="school" label="Total Guru" value={stats.teachers} color="bg-purple-500" />
          <StatCard icon="meeting_room" label="Total Kelas" value={stats.classes} color="bg-orange-500" />
          <StatCard icon="chat_error" label="Keluhan Aktif" value={stats.complaints} color="bg-rose-500" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">group</span>
                Daftar Pengguna Sistem
              </h2>
              <div className="flex items-center gap-3">
                {selectedUsers.size > 0 && (
                  <button 
                    onClick={handleDeleteUsers}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-error text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-error/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-xs">delete</span>
                    )}
                    Hapus ({selectedUsers.size})
                  </button>
                )}
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container py-1 px-3 rounded-full">{users.length} Users</span>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/30">
                      <th className="px-6 py-4 w-10">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-outline focus:ring-primary text-primary"
                          checked={users.length > 0 && selectedUsers.size === users.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">User / Email</th>
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Terdaftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {users.map((u) => (
                      <tr key={u.id} className={`hover:bg-primary/5 transition-colors group ${selectedUsers.has(u.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-outline focus:ring-primary text-primary"
                            checked={selectedUsers.has(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold group-hover:bg-primary/20 group-hover:text-primary transition-all">
                              {u.full_name?.substring(0, 1) || 'U'}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-on-surface">{u.full_name || 'No Name'}</p>
                                <p className="text-[10px] text-on-surface-variant/70 font-medium">{u.nisn || 'No Email/NISN'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            u.role === 'admin' ? 'bg-error-container/20 text-error' : 'bg-primary-container/20 text-primary'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-on-surface-variant font-medium">
                          {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
             <h2 className="text-sm font-black text-error uppercase tracking-widest flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Danger Zone
              </h2>
              
              <div className="bg-error-container/5 rounded-3xl border border-error/10 p-6 space-y-6">
                <div className="space-y-2">
                    <p className="text-xs font-black text-error flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                        Global Reset Data
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                        Tindakan ini akan **menghapus seluruh data** siswa, kelas, tugas, dan keluhan secara permanen. Akun Guru/Admin tetap tersimpan.
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">
                        Ketik "RESET TOTAL" untuk konfirmasi
                    </label>
                    <input 
                        type="text"
                        placeholder="RESET TOTAL"
                        className="w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-error/20 outline-none text-error"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    />
                    <button 
                        onClick={handleGlobalReset}
                        disabled={isResetting || confirmText !== "RESET TOTAL"}
                        className="w-full py-4 bg-error text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-error/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isResetting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-symbols-outlined text-[18px]">dangerous</span>
                        )}
                        Eksekusi Reset Sekarang
                    </button>
                </div>
              </div>

              {/* Tips Wrapper */}
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/5">
                <div className="flex gap-3">
                   <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                   <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                      Gunakan fitur ini hanya saat awal semester atau jika sistem membutuhkan pembersihan data testing secara menyeluruh.
                   </p>
                </div>
              </div>
          </div>
        </div>
      </main>

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

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 flex items-center gap-5 shadow-sm group hover:border-primary/30 transition-all">
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-on-surface tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
