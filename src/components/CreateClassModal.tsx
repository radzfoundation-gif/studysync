import React, { useState } from 'react';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: { name: string; grade: string; theme_color: string }) => Promise<void>;
}

export default function CreateClassModal({ isOpen, onClose, onSave }: CreateClassModalProps) {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const colorThemes = [
    { id: 'blue', class: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'green', class: 'bg-green-500 hover:bg-green-600' },
    { id: 'purple', class: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'orange', class: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'rose', class: 'bg-rose-500 hover:bg-rose-600' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-outline-variant/30 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/50">
          <h2 className="text-xl font-black font-headline tracking-tight flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
            Buat Kelas Baru
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 bg-surface-container-lowest">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-on-surface uppercase tracking-wider text-[11px] opacity-70">Nama Kelas</label>
            <input 
              type="text" 
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Contoh: Biologi Molekuler Lanjutan" 
              className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 font-medium text-on-surface" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-on-surface uppercase tracking-wider text-[11px] opacity-70">Mata Pelajaran</label>
            <div className="relative">
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-on-surface-variant/40">Pilih Kategori Mata Pelajaran</option>
                <option value="Sains">Ilmu Pengetahuan Alam (Sains)</option>
                <option value="Matematika">Matematika</option>
                <option value="Sosial">Ilmu Pengetahuan Sosial</option>
                <option value="Bahasa">Bahasa & Sastra</option>
                <option value="Teknologi">Teknologi Informasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-on-surface uppercase tracking-wider text-[11px] opacity-70">Deskripsi Singkat (Opsional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan ringkasan materi apa yang akan dipelajari di kelas ini..." 
              rows={3}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40 resize-none font-medium text-on-surface" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-on-surface uppercase tracking-wider text-[11px] opacity-70">Warna Tema Kelas</label>
            <div className="flex items-center gap-3">
              {colorThemes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTheme(c.id)}
                  className={`relative w-10 h-10 rounded-full ${c.class} shadow-sm flex items-center justify-center transition-all outline-none ${theme === c.id ? 'ring-4 ring-offset-2 ring-primary/60 dark:ring-offset-slate-900 border border-white/50 scale-110' : 'border border-black/10 dark:border-white/10 hover:scale-105 active:scale-95'}`}
                >
                  {theme === c.id && <span className="material-symbols-outlined text-white text-[18px] font-black drop-shadow-sm">check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-outline-variant/30 bg-surface flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all outline-none"
          >
            Batal
          </button>
          <button 
            type="button" 
            disabled={isSubmitting}
            onClick={async () => {
              if(!className) return alert('Nama kelas wajib diisi');
              setIsSubmitting(true);
              const themeMap: Record<string, string> = {
                blue: 'bg-blue-600',
                green: 'bg-green-600',
                purple: 'bg-purple-600',
                orange: 'bg-orange-600',
                rose: 'bg-rose-600'
              };
              if(onSave){
                await onSave({ name: className, grade: subject || 'Lainnya', theme_color: themeMap[theme] || 'bg-primary' });
              }
              setIsSubmitting(false);
              setClassName('');
              setSubject('');
              onClose();
            }}
            className={`px-6 py-2.5 text-sm font-bold bg-primary text-white hover:bg-primary-fixed hover:text-on-primary-fixed shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-95 outline-none flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">add</span>
            )}
            {isSubmitting ? 'Memproses...' : 'Buat Kelas'}
          </button>
        </div>

      </div>
    </div>
  );
}
