import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

function AddStudentModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({
    full_name: '',
    nisn: '',
    class_name: '',
    password: '123'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-black font-headline mb-6 flex items-center gap-3">
             <span className="material-symbols-outlined text-primary">person_add</span>
             Tambah Siswa Baru
          </h2>
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  placeholder="Masukkan nama siswa"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">NISN (ID Login)</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold tracking-widest"
                     placeholder="10 digit"
                     value={formData.nisn}
                     onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Kelas</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                     placeholder="Contoh: XII IPA 1"
                     value={formData.class_name}
                     onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                   />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Password Akses</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  placeholder="Password untuk siswa"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
             </div>
          </div>
          <div className="flex gap-3 mt-8">
             <button onClick={onClose} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-colors text-sm uppercase font-headline">Batal</button>
             <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm uppercase font-headline">Simpan data</button>
          </div>
       </div>
    </div>
  );
}

function EditStudentModal({ isOpen, onClose, onSave, student }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, student: any }) {
  const [formData, setFormData] = React.useState({
    full_name: '',
    nisn: '',
    class_name: '',
    password: ''
  });

  React.useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        nisn: student.nisn || '',
        class_name: student.class_name || '',
        password: student.password || ''
      });
    }
  }, [student]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-black font-headline mb-6 flex items-center gap-3 text-on-surface">
             <span className="material-symbols-outlined text-primary">edit_square</span>
             Edit Data Siswa
          </h2>
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">NISN</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-100 border border-outline-variant/50 rounded-xl text-sm font-bold tracking-widest text-on-surface-variant cursor-not-allowed"
                     value={formData.nisn}
                     readOnly
                     title="NISN tidak dapat diubah"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Kelas</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                     value={formData.class_name}
                     onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                   />
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Update Password</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
             </div>
          </div>
          <div className="flex gap-3 mt-8">
             <button onClick={onClose} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-colors text-sm uppercase font-headline">Batal</button>
             <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm uppercase font-headline">Update data</button>
          </div>
       </div>
    </div>
  );
}

export default function StudentsTab({ onShowStatus }: { onShowStatus: (type: 'success' | 'error' | 'info', title: string, msg: string) => void }) {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [isImporting, setIsImporting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const classes = ['Semua Kelas', ...Array.from(new Set(students.map(s => s.class_name))).filter(Boolean)];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_data')
      .select('*')
      .order('full_name', { ascending: true });
    if (data) setStudents(data);
    setLoading(false);
  };

  const handleAddStudent = async (formData: any) => {
    if (!formData.nisn || !formData.full_name) return onShowStatus('error', 'Incomplete!', "NISN dan Nama wajib diisi!");
    
    // 1. Save to master database
    const { error } = await supabase.from('student_data').insert([{
      ...formData,
      school_name: profile?.school_name || "SMA N 1 Pupuan" // Default based on teacher profile
    }]);

    if (error) {
      onShowStatus('error', 'Gagal!', error.message);
      return;
    }

    onShowStatus('success', 'Berhasil!', "Berhasil menambah siswa: " + formData.full_name);
    setIsAddModalOpen(false);
    fetchStudents();
  };

  const handleEditStudent = async (formData: any) => {
    if (!selectedStudent) return;
    
    const { error } = await supabase
      .from('student_data')
      .update({
        full_name: formData.full_name,
        class_name: formData.class_name,
        password: formData.password
      })
      .eq('nisn', selectedStudent.nisn);

    if (error) {
      onShowStatus('error', 'Gagal Update!', error.message);
      return;
    }

    onShowStatus('success', 'Siswa Diperbarui', "Berhasil memperbarui data siswa.");
    setIsEditModalOpen(false);
    fetchStudents();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsImporting(true);
      const filename = e.target.files[0].name;
      // Simulate network request
      setTimeout(() => {
        setIsImporting(false);
        alert(`Berhasil mengimpor data absensi dari file: ${filename}`);
        e.target.value = ''; // reset input
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-xl font-headline">Student Directory</h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Tambah Manual
          </button>

          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-outline-variant/50 rounded-lg text-sm bg-surface text-on-surface outline-none focus:border-primary appearance-none cursor-pointer pr-10"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </div>
          </div>

          <label className={`border border-outline-variant/30 text-on-surface px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 ${isImporting ? 'bg-surface-container-highest cursor-wait opacity-70' : 'bg-surface-container hover:bg-surface-container-high cursor-pointer'}`}>
            <span className={`material-symbols-outlined text-[18px] ${isImporting ? 'animate-spin' : ''}`}>
              {isImporting ? 'sync' : 'upload_file'}
            </span>
            {isImporting ? 'Mengimpor...' : 'Impor Absen (.csv)'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isImporting} />
          </label>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/30">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
             <input type="text" placeholder="Cari siswa atau kelas..." className="w-full md:w-96 pl-10 pr-4 py-2 border border-outline-variant/50 rounded-lg bg-surface text-sm outline-none focus:border-primary transition-colors" />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-lowest text-[11px] uppercase tracking-wider text-outline border-b border-outline-variant/20">
                <th className="px-5 py-3 font-bold">Nama Siswa</th>
                <th className="px-5 py-3 font-bold">NIS</th>
                <th className="px-5 py-3 font-bold">Kelas</th>
                <th className="px-5 py-3 font-bold">Kehadiran</th>
                <th className="px-5 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
               {loading ? (
                 <tr><td colSpan={5} className="px-5 py-8 text-center"><span className="animate-spin material-symbols-outlined text-primary">sync</span></td></tr>
               ) : students.length === 0 ? (
                 <tr><td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant">Belum ada data siswa. Silakan tambah manual atau impor.</td></tr>
               ) : students
                   .filter(s => selectedClass === 'Semua Kelas' || s.class_name === selectedClass)
                   .map(student => (
                 <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                   <td className="px-5 py-4 font-bold text-on-surface">{student.full_name}</td>
                   <td className="px-5 py-4 font-mono text-xs tracking-widest text-primary">{student.nisn}</td>
                   <td className="px-5 py-4 text-xs font-bold text-on-surface-variant">{student.class_name}</td>
                   <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Aktif</span>
                   </td>
                   <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsEditModalOpen(true);
                        }}
                        className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                      >
                        edit
                      </button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
        <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddStudent} />
        <EditStudentModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleEditStudent} 
          student={selectedStudent} 
        />
      </div>
    </div>
  );
}
