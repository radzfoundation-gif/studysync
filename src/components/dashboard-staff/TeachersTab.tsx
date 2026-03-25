"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import StatusModal from "@/components/StatusModal";

interface TeacherData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  password?: string;
  created_at: string;
}

export default function TeachersTab() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
  });
  const [generatedAccount, setGeneratedAccount] = useState<{email: string, password: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "info",
    title: "",
    message: "",
  });

  const showStatus = (type: "success" | "error" | "info", title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  const generateRandomEmail = () => {
    const random = Math.random().toString(36).substring(2, 10);
    return `guru${random}@studysync.sch.id`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 3) + 6;
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });
    
    if (profiles) setTeachers(profiles);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      showStatus('error', 'Gagal', 'Nama lengkap wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = generateRandomEmail();
      const password = generateRandomPassword();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'teacher',
          }
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Manually create profile since trigger is disabled
        // Use upsert to handle cases where profile might already exist
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          email: email,
          full_name: formData.full_name,
          role: 'teacher',
        }, { onConflict: 'id' });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          showStatus('error', 'Gagal', 'Gagal membuat profil guru');
          return;
        }

        setGeneratedAccount({ email, password });
        fetchTeachers();
      }
    } catch (error: any) {
      showStatus('error', 'Gagal', error.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus akun guru "${name}"?`)) return;
    
    setLoading(true);
    try {
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
      if (profileError) console.warn("Profile delete error:", profileError);
      
      showStatus('success', 'Berhasil', 'Akun guru berhasil dihapus dari daftar');
      fetchTeachers();
    } catch (error: any) {
      showStatus('error', 'Gagal', error.message || 'Gagal menghapus akun');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showStatus('success', 'Disalin', `"${text}" berhasil disalin ke clipboard`);
  };

  const filteredTeachers = teachers.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-on-surface">Data Guru</h2>
          <p className="text-xs text-on-surface-variant">Kelola akun guru ({teachers.length} guru)</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-white rounded-2xl font-bold text-xs shadow-lg shadow-tertiary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Tambah Guru
        </button>
      </div>

      <div className="bg-tertiary-container/10 rounded-2xl p-4 border border-tertiary/20">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary text-[20px]">info</span>
          <div>
            <p className="text-xs font-bold text-tertiary mb-1">Informasi Penting</p>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Setiap guru akan mendapatkan Email dan Password unik. Berikan informasi login ini kepada guru yang bersangkutan untuk pertama kali login.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
              />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              {filteredTeachers.length} guru
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">sync</span>
            <p className="text-xs text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nama</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Password</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-xs">
                      Tidak ada data guru
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-tertiary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold">
                            {teacher.full_name?.substring(0, 1) || 'G'}
                          </div>
                          <span className="text-xs font-bold text-on-surface">{teacher.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg bg-surface-container text-xs font-mono">
                          {teacher.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-on-surface-variant">••••••••</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(teacher.id, teacher.full_name)}
                          className="p-1.5 text-error hover:bg-error-container/20 rounded-lg transition-colors"
                          title="Hapus Akun"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 text-xl">school</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface">{teachers.length}</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">Total Guru</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface">{teachers.length}</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-600 text-xl">schedule</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface">0</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">Cuti</p>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/20">
              <h3 className="text-lg font-black text-on-surface">
                {generatedAccount ? 'Akun Berhasil Dibuat!' : 'Tambah Guru Baru'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setGeneratedAccount(null); setFormData({ full_name: "" }); }} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            {generatedAccount ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-tertiary-container/20 border border-tertiary/20">
                  <p className="text-xs font-bold text-tertiary mb-3">Silakan berikan informasi login berikut kepada guru:</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase">Email</p>
                        <p className="text-sm font-bold font-mono text-on-surface">{generatedAccount.email}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(generatedAccount.email)}
                        className="p-2 text-tertiary hover:bg-tertiary-container/20 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase">Password</p>
                        <p className="text-sm font-bold font-mono text-on-surface">{generatedAccount.password}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(generatedAccount.password)}
                        className="p-2 text-tertiary hover:bg-tertiary-container/20 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setIsModalOpen(false); setGeneratedAccount(null); setFormData({ full_name: "" }); fetchTeachers(); }}
                  className="w-full py-3 bg-tertiary text-white rounded-xl font-bold text-sm hover:bg-tertiary/90 transition-colors"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 block">Nama Lengkap Guru *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20">
                  <p className="text-[10px] text-on-surface-variant">
                    Sistem akan otomatis membuatkan Email dan Password untuk akun ini.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-surface-container text-on-surface-variant rounded-xl font-bold text-xs hover:bg-outline-variant/20 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-tertiary text-white rounded-xl font-bold text-xs shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Buat Akun
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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