"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface StudentData {
  id: string;
  full_name: string;
  nisn: string;
  class_name: string;
  school_name: string;
  password: string;
  created_at: string;
}

interface FormData {
  full_name: string;
  nisn: string;
  class_name: string;
  school_name: string;
  password: string;
}

interface StudentsTabProps {
  onShowStatus?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export default function StudentsTab({ onShowStatus }: StudentsTabProps) {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    nisn: "",
    class_name: "",
    school_name: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_data')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setStudents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showStatus = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (onShowStatus) {
      onShowStatus(type, title, message);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.nisn.trim()) {
      showStatus('error', 'Gagal', 'Nama dan NISN wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentData = {
        ...formData,
        password: generateRandomPassword()
      };
      const { error } = await supabase.from('student_data').insert([studentData]);
      if (error) throw error;
      
      showStatus('success', 'Berhasil', 'Data siswa berhasil ditambahkan');
      setIsModalOpen(false);
      setFormData({ full_name: "", nisn: "", class_name: "", school_name: "", password: "123" });
      fetchStudents();
    } catch (error: any) {
      showStatus('error', 'Gagal', error.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      showStatus('error', 'Gagal', 'Data tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const lines = bulkData.trim().split('\n');
      const newStudents: { full_name: string; nisn: string; class_name: string; school_name: string; password: string }[] = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          newStudents.push({
            full_name: parts[0],
            nisn: parts[1],
            class_name: parts[2] || '',
            school_name: parts[3] || '',
            password: generateRandomPassword(),
          });
        }
      }

      if (newStudents.length === 0) {
        throw new Error('Format tidak valid. Gunakan: Nama, NISN, Kelas, Sekolah');
      }

      const { error } = await supabase.from('student_data').insert(newStudents);
      if (error) throw error;
      
      showStatus('success', 'Berhasil', `${newStudents.length} siswa berhasil diimpor`);
      setIsModalOpen(false);
      setBulkMode(false);
      setBulkData("");
      fetchStudents();
    } catch (error: any) {
      showStatus('error', 'Gagal', error.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data siswa ini?')) return;
    
    try {
      const { error } = await supabase.from('student_data').delete().eq('id', id);
      if (error) throw error;
      
      showStatus('success', 'Berhasil', 'Data siswa berhasil dihapus');
      fetchStudents();
    } catch (error: any) {
      showStatus('error', 'Gagal', error.message);
    }
  };

  const handleViewDetail = (student: StudentData) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = generateRandomPassword();
    if (!window.confirm(`Reset password menjadi "${newPassword}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('student_data')
        .update({ password: newPassword })
        .eq('id', id);
      if (error) throw error;
      
      showStatus('success', 'Berhasil', `Password direset: ${newPassword}`);
      fetchStudents();
    } catch (error: any) {
      showStatus('error', 'Gagal', error.message);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nisn?.includes(searchTerm) ||
    s.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-on-surface">Data Siswa</h2>
          <p className="text-xs text-on-surface-variant">Kelola data siswa ({students.length} siswa)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setBulkMode(false); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-tertiary text-white rounded-2xl font-bold text-xs shadow-lg shadow-tertiary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Tambah Siswa
          </button>
          <button
            onClick={() => { setBulkMode(true); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary text-tertiary rounded-2xl font-bold text-xs hover:bg-tertiary-container/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Import CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Cari nama, NISN, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
              />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              {filteredStudents.length} siswa
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
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">NISN</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Kelas</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Sekolah</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-xs">
                      Tidak ada data siswa
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-tertiary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px] font-bold">
                            {student.full_name?.substring(0, 1) || 'S'}
                          </div>
                          <span className="text-xs font-bold text-on-surface">{student.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">{student.nisn}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-tertiary-container/20 text-tertiary uppercase">
                          {student.class_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{student.school_name || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetail(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleResetPassword(student.id)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-error hover:bg-error-container/20 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/20">
              <h3 className="text-lg font-black text-on-surface">
                {bulkMode ? 'Import Data Siswa (CSV)' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setBulkMode(false); setBulkData(""); }} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={bulkMode ? (e) => { e.preventDefault(); handleBulkImport(); } : handleSubmit} className="p-6 space-y-4">
              {bulkMode ? (
                <div>
                  <p className="text-[10px] text-on-surface-variant mb-2">
                    Format: Nama, NISN, Kelas, Sekolah (satu baris per siswa)
                  </p>
                  <p className="text-[10px] text-on-surface-variant mb-4">
                    Contoh: <code className="bg-surface-container px-1 rounded">Ahmad Fauzi,1234567890,X IPA 1,SMA Negeri 1</code>
                  </p>
                  <textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="Ahmad Fauzi,1234567890,X IPA 1,SMA Negeri 1&#10;Budi Santoso,0987654321,X IPA 2,SMA Negeri 2"
                    rows={8}
                    className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-mono focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all resize-none"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 block">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
                      placeholder="Contoh: Ahmad Fauzi"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 block">NISN *</label>
                    <input
                      type="text"
                      required
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
                      placeholder="Contoh: 1234567890"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 block">Kelas</label>
                    <input
                      type="text"
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
                      placeholder="Contoh: X IPA 1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5 block">Sekolah</label>
                    <input
                      type="text"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
                      placeholder="Contoh: SMA Negeri 1 Jakarta"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setBulkMode(false); setBulkData(""); }}
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
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      {bulkMode ? 'Import' : 'Simpan'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/20">
              <h3 className="text-lg font-black text-on-surface">Detail Siswa</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center text-2xl font-bold">
                  {selectedStudent.full_name?.substring(0, 1) || 'S'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface">{selectedStudent.full_name}</h4>
                  <p className="text-xs text-on-surface-variant">{selectedStudent.class_name || 'Belum ada kelas'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant">NISN</span>
                  <span className="text-xs font-bold text-on-surface font-mono">{selectedStudent.nisn}</span>
                </div>
                <div className="flex justify-between p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant">Password</span>
                  <span className="text-xs font-bold text-on-surface font-mono">••••</span>
                </div>
                <div className="flex justify-between p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant">Sekolah</span>
                  <span className="text-xs font-bold text-on-surface text-right max-w-[180px]">{selectedStudent.school_name || '-'}</span>
                </div>
                <div className="flex justify-between p-3 bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant">Terdaftar</span>
                  <span className="text-xs font-bold text-on-surface">
                    {new Date(selectedStudent.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setIsDetailModalOpen(false); handleResetPassword(selectedStudent.id); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}