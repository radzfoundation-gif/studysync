"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  courseName: string;
  onSuccess?: () => void;
}

export default function CreateQuizModal({ isOpen, onClose, classId, courseName, onSuccess }: CreateQuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    questions_count: 5,
    difficulty: "Mudah",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { user } = useAuth();
    if (!user) return;

    const { error } = await supabase.from('quizzes').insert([{
      class_id: classId,
      title: formData.title,
      category: formData.category,
      questions_count: formData.questions_count,
      difficulty: formData.difficulty,
      created_at: new Date().toISOString(),
      user_id: user.id
    }]);

    if (error) {
      alert("Gagal membuat kuis: " + error.message);
    } else {
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">quiz</span>
            </div>
            <div>
              <h2 className="font-bold font-headline text-lg">Buat Kuis Baru</h2>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{courseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Judul Kuis</label>
            <input 
              required
              type="text" 
              placeholder="Contoh: Kuis Reproduksi Sel"
              className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Kategori</label>
              <select 
                className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="General">General</option>
                <option value="Ujian Akhir">Ujian Akhir</option>
                <option value="Tugas Harian">Tugas Harian</option>
                <option value="Latihan">Latihan</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant ml-1">Jumlah Soal</label>
              <input 
                type="number" 
                min="1"
                max="50"
                className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                value={formData.questions_count}
                onChange={e => setFormData({...formData, questions_count: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Tingkat Kesulitan</label>
            <div className="flex gap-2">
              {['Mudah', 'Sedang', 'Sulit'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({...formData, difficulty: level})}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    formData.difficulty === level 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  {level}
                </button>
              ))}
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
              className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Buat Kuis Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
