import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  courseName: string;
  onSuccess: () => void;
}

export default function CreateAssignmentModal({ isOpen, onClose, classId, courseName, onSuccess }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setError('Harap isi semua kolom.');
      return;
    }

    setIsLoading(true);
    setError('');

    const { user } = useAuth();
    if (!user) return;

    try {
      const { error: insertError } = await supabase.from('assignments').insert([{
        class_id: classId,
        title: title,
        course_name: courseName,
        due_date: new Date(dueDate).toISOString(),
        status: 'Pending',
        user_id: user.id
      }]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      setTitle('');
      setDueDate('');
    } catch (err: any) {
      setError(err.message || 'Gagal membuat tugas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 flex items-start justify-between border-b border-outline-variant/20 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">assignment_add</span>
            </div>
            <h2 className="text-lg font-black font-headline text-on-surface tracking-tight">Buat Tugas Baru</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Judul Tugas</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Analisis Ekosistem Dasar" 
                className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-3 px-4 text-sm text-on-surface outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Mata Pelajaran</label>
              <input 
                type="text"
                readOnly
                value={courseName}
                className="w-full bg-surface-container/30 border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-on-surface-variant outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tenggat Waktu</label>
              <input 
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-3 px-4 text-sm text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-error text-xs font-bold mt-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span> {error}
            </p>
          )}

          <div className="flex gap-3 mt-8">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isLoading || !title.trim() || !dueDate}
              className="flex-[2] px-4 py-3 bg-primary text-white font-bold rounded-xl text-sm transition-all hover:bg-primary-dark hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Terbitkan Tugas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
