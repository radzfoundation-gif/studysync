import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface AssignToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
  quizData: any[]; // The questions array
  classes: any[];
  onSuccess: (className: string) => void;
}

export default function AssignToClassModal({ isOpen, onClose, quizId, quizTitle, quizData, classes, onSuccess }: AssignToClassModalProps) {
  const { user, profile } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!user || !selectedClassId) return;
    
    setIsSubmitting(true);
    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    try {
      // 1. Create Assignment
      const payload = {
        title: quizTitle,
        course_name: "Quiz/Assessment",
        due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        status: "Pending",
        class_id: selectedClassId,
        quiz_data: { questions: quizData },
        user_id: user.id
      };

      const { error: assignError } = await supabase.from('assignments').insert([payload]);
      if (assignError) throw assignError;

      // 2. Send Chat Notification
      const messagePayload = {
        room_id: selectedClassId,
        sender_name: profile?.full_name || "Guru",
        sender_role: "teacher",
        content: `📖 **Kuis Baru Tersedia!**\n\nBapak/Ibu Guru telah mengirimkan kuis baru: **${quizTitle}**. Mohon segera dikerjakan ya!\n\n[👉 Ambil Kuis Sekarang](/join/${quizId})`
      };

      const { error: msgError } = await supabase.from('room_messages').insert([messagePayload]);
      if (msgError) console.error("Gagal kirim notifikasi chat:", msgError.message);
      
      onSuccess(selectedClass?.name || 'Kelas');
      onClose();
    } catch (error: any) {
      alert("Gagal mengirim kuis: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <h2 className="text-xl font-black font-headline text-on-surface">Kirim Kuis ke Kelas</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm font-medium text-on-surface-variant mb-6">
            Pilih kelas yang akan dikirimi kuis "<strong>{quizTitle}</strong>". Kuis ini akan muncul sebagai tugas baru untuk seluruh siswa di kelas tersebut.
          </p>

          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {classes.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Belum ada kelas aktif</p>
              </div>
            ) : (
              classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    selectedClassId === c.id 
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                    : 'border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl ${c.theme_color || 'bg-primary'} flex items-center justify-center text-white shadow-sm`}>
                      <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{c.name}</p>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{c.grade || 'Umum'} • {c.students || 0} Siswa</p>
                    </div>
                  </div>
                  {selectedClassId === c.id && (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="px-6 py-5 bg-surface-container-low border-t border-outline-variant/30 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-outline-variant/50 text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container transition-colors"
          >
            Batal
          </button>
          <button 
            disabled={!selectedClassId || isSubmitting}
            onClick={handleAssign}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-1px] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">send</span>
            )}
            {isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
