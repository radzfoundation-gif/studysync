"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface TeacherOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function TeacherOnboarding({ onComplete, onSkip }: TeacherOnboardingProps) {
  const [step, setStep] = useState(1);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressText, setProgressText] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!className || !classGrade) {
        setError("Nama dan Tingkat kelas harus diisi.");
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const processFile = async () => {
    if (!file) {
      setError("Silakan unggah file CSV terlebih dahulu.");
      return;
    }
    setError('');
    setStep(3);
    setLoading(true);
    setProgressText('Membaca file data siswa...');

    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const students: { name: string; nis: string }[] = [];
      for(let i=0; i<lines.length; i++) {
        // Skip header dynamically
        if (i === 0 && (lines[i].toLowerCase().includes('nama') || lines[i].toLowerCase().includes('name'))) continue;
        
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
           students.push({ name: parts[0].trim(), nis: parts[1].trim() });
        } else if (parts.length === 1) {
           students.push({ name: parts[0].trim(), nis: '-' });
        }
      }

      setProgressText('Membuat kelas baru...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login terlebih dahulu");

      const { data: newClass, error: classError } = await supabase.from('classes').insert([{
         user_id: user.id,
         name: className,
         grade: classGrade,
         students: students.length,
         theme_color: 'bg-primary'
      }]).select().single();

      if (classError) throw classError;

      if (students.length > 0) {
        setProgressText('Memasukkan data absensi siswa ke database...');
        const attendanceRows = students.map(s => ({
            class_id: newClass.id,
            class_name: newClass.name,
            student_name: s.name,
            student_number: s.nis
        }));

        const { error: attError } = await supabase.from('attendance').insert(attendanceRows);
        if (attError) throw attError;
      }

      setProgressText('Selesai! Mengalihkan ke dashboard...');
      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 1500);

    } catch (err: any) {
      setLoading(false);
      setStep(2); // return to upload step
      setError(err.message || "Terjadi kesalahan saat memproses data.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100 dark:bg-slate-900 font-body p-4 sm:p-8 overflow-y-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary-container/30 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-white/40 dark:border-slate-700/50 p-8 sm:p-12 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="material-symbols-outlined text-[32px]">{step === 1 ? 'school' : step === 2 ? 'upload_file' : 'sync'}</span>
          </div>
          <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight mb-2">
            {step === 1 ? 'Selamat Datang di StudySync' : step === 2 ? 'Impor Data Siswa' : 'Memproses Data...'}
          </h2>
          <p className="text-on-surface-variant font-medium">
            {step === 1 ? 'Mari buat kelas pertama Anda untuk memulai.' : step === 2 ? 'Unggah file CSV (.csv) berisi daftar "Nama Siswa, NIS".' : 'Mohon tunggu sebentar...'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container/50 text-error font-medium rounded-xl text-sm text-center border border-error/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span> {error}
          </div>
        )}

        {/* Form Content */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Mata Pelajaran / Nama Kelas</label>
                <input 
                  type="text" 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: Biologi Lanjutan" 
                  className="w-full px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Tingkat / Grade</label>
                <input 
                  type="text" 
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="Contoh: Kelas 10" 
                  className="w-full px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40" 
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button 
                onClick={handleNext}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-[0_8px_30px_rgb(0,119,255,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all outline-none"
              >
                Lanjutkan
              </button>
              <button 
                onClick={onSkip}
                className="w-full py-2 text-on-surface-variant font-bold text-sm hover:text-on-surface transition-colors outline-none"
              >
                Lewati, atur nanti
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <label className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-primary/5'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${file ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[24px]">
                  {file ? 'draft' : 'upload'}
                </span>
              </div>
              <p className="font-bold text-on-surface mb-1">{file ? file.name : 'Pilih file CSV'}</p>
              <p className="text-xs text-on-surface-variant max-w-[200px] text-center">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Format: Nama Siswa, NIS'}
              </p>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                    setError('');
                  }
                }} 
              />
            </label>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high active:scale-95 transition-all outline-none"
              >
                Kembali
              </button>
              <button 
                onClick={processFile}
                className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-[0_8px_30px_rgb(0,119,255,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all outline-none"
              >
                Proses & Simpan
              </button>
            </div>
            
            <p className="mt-4 text-center text-[11px] font-medium text-on-surface-variant/70 leading-relaxed max-w-[280px] mx-auto">
              Dengan melanjutkan, Anda menyetujui <Link href="#" className="underline hover:text-primary transition-colors">Ketentuan</Link> & <Link href="#" className="underline hover:text-primary transition-colors">Privasi</Link> kami.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
               <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
               <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse"></div>
               <div className="relative w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40">
                 <span className="material-symbols-outlined text-[32px] animate-spin">sync</span>
               </div>
            </div>
            <p className="font-bold text-lg text-on-surface text-center animate-pulse tracking-tight">{progressText}</p>
          </div>
        )}

        {/* Stepper Progress Indicator */}
        {step < 3 && (
          <div className="mt-10 flex justify-center items-center gap-2">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-primary' : 'w-4 bg-outline-variant/30'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-primary' : 'w-4 bg-outline-variant/30'}`}></div>
          </div>
        )}
      </div>
    </div>
  );
}
