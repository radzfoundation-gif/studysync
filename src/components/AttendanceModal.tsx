"use client";

import { useState } from "react";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; className: string; studentNumber: string; nisn: string; photo?: File | null }) => void;
  loading?: boolean;
}

export default function AttendanceModal({ isOpen, onClose, onSubmit, loading }: AttendanceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    className: "",
    studentNumber: "",
    nisn: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, photo });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">assignment_ind</span>
            </div>
            <div>
              <h2 className="font-bold font-headline text-lg">Presensi Kehadiran</h2>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Lengkapi data diri Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Nama Lengkap</label>
            <input 
              required
              type="text" 
              placeholder="Masukkan nama lengkap Anda"
              className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Kelas</label>
              <input 
                required
                type="text" 
                placeholder="Contoh: XII IPA 1"
                className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                value={formData.className}
                onChange={e => setFormData({...formData, className: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Nomor Absen</label>
              <input 
                required
                type="text" 
                placeholder="Contoh: 14"
                className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                value={formData.studentNumber}
                onChange={e => setFormData({...formData, studentNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant ml-1">NISN (Opsional)</label>
            <input 
              type="text" 
              placeholder="Masukkan NISN Anda"
              className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              value={formData.nisn}
              onChange={e => setFormData({...formData, nisn: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Foto Bukti Kehadiran (Selfie)</label>
            <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 ${photoPreview ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50 bg-surface-container-lowest'}`}>
              <input 
                type="file" 
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {photoPreview ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-md" />
                  <p className="text-[10px] font-bold text-primary uppercase">Klik untuk ganti foto</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
                  <p className="text-xs font-bold text-on-surface-variant">Ambil Foto atau Pilih Berkas</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Memproses...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Kirim Presensi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
