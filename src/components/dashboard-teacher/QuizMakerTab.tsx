import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import ManualQuizBuilder from "@/components/ManualQuizBuilder";
import AssignToClassModal from "@/components/AssignToClassModal";

export default function QuizMakerTab({ onShareQuiz, classesData = [] }: { onShareQuiz?: (name: string, id: string) => void, classesData?: any[] }) {
  const { user } = useAuth();
  const [generationStep, setGenerationStep] = useState<'idle' | 'generating' | 'result'>('idle');
  const [isBuildingManual, setIsBuildingManual] = useState(false);
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customCountInput, setCustomCountInput] = useState("10");
  const [generatingText, setGeneratingText] = useState('Menganalisis matriks topik...');
  const [progress, setProgress] = useState(0);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  
  // Assign to Class Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedQuizForAssign, setSelectedQuizForAssign] = useState<{id: string, title: string, questions: any[]} | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const fetchQuizzes = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setQuizzes(data);
      setLoadingQuizzes(false);
    };
    fetchQuizzes();
    
    const channel = supabase.channel(`realtime_quizzes_teacher_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes', filter: `user_id=eq.${user.id}` }, () => {
        fetchQuizzes();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  React.useEffect(() => {
    // Progress is now managed manually in handleGenerateAI
  }, [generationStep]);

  const handleGenerateAI = async () => {
    if (!topic) return alert("Masukkan topik kuis terlebih dahulu!");
    
    setGenerationStep('generating');
    setProgress(10);
    setGeneratingText('Menghubungkan ke AI Engine...');

    try {
      // Step 1: Request started
      setProgress(30);
      setGeneratingText('Menganalisis matriks topik & kurikulum...');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Buatkan ${isCustomCount ? customCountInput : questionCount} soal kuis pilihan ganda tentang topik: ${topic}. 
              Format output harus JSON valid dengan struktur: { "questions": [{ "question": string, "options": [string, string, string, string], "correctIndex": number (0-3) }] }. 
              Pastikan correctIndex sesuai dengan posisi jawaban benar di array options. Hanya berikan JSON tanpa teks pengantar.`
            }
          ]
        })
      });

      setProgress(70);
      setGeneratingText('Menyusun ragam soal & distraktor...');

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Gagal generate AI');

      // Step 2: Processing response
      setProgress(90);
      setGeneratingText('Memvalidasi kunci jawaban & format...');

      const content = data.message;
      // Robust JSON extraction
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Format respons AI tidak valid.");
      
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Data soal tidak ditemukan dalam respons AI.");
      }

      const finalQuestions = parsed.questions.slice(0, isCustomCount ? parseInt(customCountInput) : questionCount);
      setGeneratedQuestions(finalQuestions);
      
      setTimeout(() => {
        setProgress(100);
        setGenerationStep('result');
      }, 500);

    } catch (error: any) {
      alert("Error: " + error.message);
      setGenerationStep('idle');
      setProgress(0);
    }
  };

  const pushToSupabaseQuizzes = async (title: string, questionsData: any) => {
    if (!user) return;
    const payload = {
      title,
      questions: questionsData || [],
      user_id: user.id
    };
    const { error } = await supabase.from('quizzes').insert([payload]);
    if (error) alert("Kesalahan menyimpan kuis: " + error.message);
  };

  const pushToSupabase = async (title: string, count: number, questionsData?: any[]) => {
    if (!user) return;
    const payload = {
      title,
      course_name: "Quiz/Assessment",
      due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      status: "Pending",
      quiz_data: questionsData ? { questions: questionsData } : null,
      user_id: user.id
    };
    const { error } = await supabase.from('assignments').insert([payload]);
    if (error) alert("Kesalahan mengunggah kuis ke assignments: " + error.message);
  };

  const handleSaveQuiz = () => {
    pushToSupabaseQuizzes(`Kuis AI: ${topic}`, generatedQuestions);
    pushToSupabase(`Kuis AI: ${topic}`, generatedQuestions.length, generatedQuestions);
    setGenerationStep('idle');
    setTopic('');
    setGeneratedQuestions([]);
  };

  const handleSaveManual = (title: string, questionsData: any[]) => {
    pushToSupabaseQuizzes(title, questionsData);
    pushToSupabase(title, questionsData.length, questionsData);
    setIsBuildingManual(false);
  };

  if (isBuildingManual) {
    return <ManualQuizBuilder onSave={handleSaveManual} onCancel={() => setIsBuildingManual(false)} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h3 className="font-bold text-2xl font-headline tracking-tight text-on-surface">Quiz & Assessment Builder 🎮</h3>
        <p className="text-sm font-medium text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
          Buat kuis yang interaktif untuk ruang kelas Anda. Biarkan AI menyusun soal secara instan berdasarkan materi pelajaran, atau bangun teka-teki manual yang menantang akal budi siswa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate with AI Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-primary/20 shadow-[0_8px_30px_rgb(0,119,255,0.08)] relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,119,255,0.15)] transition-all flex flex-col min-h-[380px]">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-center">
            {generationStep === 'idle' && (
              <div className="flex flex-col h-full justify-between animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-5 border border-primary/20">
                    <span className="material-symbols-outlined text-[32px] animate-pulse">auto_awesome</span>
                  </div>
                  <h4 className="text-on-surface font-black text-2xl mb-2 font-headline tracking-tight">AI Auto-Generator</h4>
                  <p className="text-on-surface-variant text-sm font-medium mb-6 leading-relaxed">Instan menyusun soal kuis multi-pilihan & esai dari materi spesifik. Ketik topik yang Anda mau:</p>
                  <input 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Sel Tumbuhan & Histologi..."
                    className="w-full px-5 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium shadow-inner mb-4"
                  />
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                      Jumlah Soal
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            setQuestionCount(num);
                            setIsCustomCount(false);
                          }}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                            (!isCustomCount && questionCount === num) 
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]' 
                              : 'bg-white text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setIsCustomCount(true)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          isCustomCount 
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]' 
                            : 'bg-white text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
                        }`}
                      >
                        Lainnya
                      </button>
                    </div>

                    {isCustomCount && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <input 
                          type="number"
                          min="1"
                          max="50"
                          value={customCountInput}
                          onChange={(e) => setCustomCountInput(e.target.value)}
                          placeholder="Masukkan jumlah soal (maks 50)"
                          className="w-full px-4 py-3 bg-white border border-primary/30 rounded-xl text-sm font-bold outline-none ring-4 ring-primary/5"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleGenerateAI}
                  className="mt-6 w-full py-4 bg-primary text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 outline-none hover:-translate-y-1 hover:shadow-primary/40 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">magic_button</span>
                  Generate Kuis AI
                </button>
              </div>
            )}

            {generationStep === 'generating' && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 bg-primary/40 rounded-full animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40 transition-transform hover:scale-110">
                    <span className="material-symbols-outlined text-[36px] animate-spin">model_training</span>
                  </div>
                </div>
                <h4 className="text-primary font-black text-xl mb-2 font-headline animate-pulse tracking-tight">Menyusun Kuis Pintar...</h4>
                <p className="text-on-surface-variant text-sm font-medium h-6 transition-all duration-300">{generatingText}</p>
                
                <div className="w-full bg-surface-container-high rounded-full h-2 mt-8 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-150 ease-linear shadow-[0_0_10px_rgb(0,119,255,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {generationStep === 'result' && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                    <span className="material-symbols-outlined text-[28px]">verified</span>
                  </div>
                  <div>
                    <h4 className="font-black font-headline text-on-surface leading-tight text-xl mb-1">Kuis Berhasil Disusun!</h4>
                    <p className="text-xs text-on-surface-variant font-bold text-green-600/90 tracking-wide uppercase">{generatedQuestions.length} Soal • Tingkat Menengah</p>
                  </div>
                </div>
                
                <div className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 mb-5 overflow-y-auto max-h-[160px] custom-scrollbar shadow-inner text-sm space-y-4">
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} className="pb-4 border-b border-outline-variant/40 last:border-0">
                      <p className="font-bold text-on-surface mb-2 leading-relaxed">{idx + 1}. {q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt: string, optIdx: number) => (
                          <p key={optIdx} className={`text-on-surface-variant text-xs flex items-center gap-2 px-2 py-1.5 rounded-lg border ${q.correctIndex === optIdx ? 'bg-green-50 border-green-200' : 'border-transparent'}`}>
                            <span className={`w-2 h-2 rounded-full ${q.correctIndex === optIdx ? 'bg-green-500' : 'bg-outline-variant'}`}></span> 
                            <span className={q.correctIndex === optIdx ? 'font-bold text-green-700' : ''}>{opt}</span>
                            {q.correctIndex === optIdx && <span className="ml-auto material-symbols-outlined text-[14px] text-green-600">check</span>}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-auto">
                  <button onClick={() => { setGenerationStep('idle'); setTopic(''); setProgress(0); }} className="px-5 py-3.5 bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface font-bold rounded-xl text-sm transition-all outline-none shrink-0 border border-transparent hover:border-outline-variant/30">
                    Hapus
                  </button>
                  <button onClick={handleSaveQuiz} className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:shadow-[0_8px_30px_rgb(0,119,255,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all outline-none flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">library_add</span>
                    Simpan & Publikasikan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Creation Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border-2 border-dashed border-outline-variant/60 hover:border-primary/40 transition-colors flex flex-col justify-center items-center text-center group cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden min-h-[380px]">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
           <div className="relative z-10 w-16 h-16 bg-surface-container text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 rounded-3xl flex items-center justify-center mb-5 rotate-[10deg] group-hover:rotate-0 shadow-sm">
             <span className="material-symbols-outlined text-[36px]">edit_document</span>
           </div>
           <h4 className="relative z-10 text-on-surface font-black text-2xl mb-2 font-headline tracking-tight">Buat Manual Klasik</h4>
           <p className="relative z-10 text-on-surface-variant text-sm font-medium mb-8 max-w-xs leading-relaxed">Rancang soal kuis interaktif Anda sendiri secara teliti, tentukan poin jawaban yang presisi, dan sisipkan media gambar.</p>
           <button 
             onClick={() => setIsBuildingManual(true)}
             className="relative z-10 px-8 py-3.5 bg-surface-container font-bold text-on-surface hover:bg-primary hover:text-white rounded-full text-sm transition-all shadow-sm outline-none active:scale-95"
           >
             Mulai dari Kosong
           </button>
        </div>
      </div>

      {/* Quiz Library */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 lg:p-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <h4 className="font-bold font-headline text-lg mb-5 text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">collections_bookmark</span>
          Pustaka Kuis Anda
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingQuizzes ? (
            <div className="col-span-full py-10 flex justify-center">
              <span className="material-symbols-outlined flex animate-spin text-primary text-3xl">sync</span>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="col-span-full py-10 text-center border border-outline-variant/30 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">inventory_2</span>
              <p className="text-on-surface-variant font-bold">Kuis masih kosong</p>
            </div>
          ) : (
            quizzes.map(q => (
              <div key={q.id} className="p-5 border border-outline-variant/40 rounded-2xl bg-surface hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group flex flex-col cursor-pointer pb-4">
                <h5 className="font-black text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors text-[16px]">{q.title}</h5>
                <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-6">
                  <span className="flex items-center gap-1.5 border border-outline-variant/30 px-2 py-1 rounded-md"><span className="material-symbols-outlined text-[14px]">format_list_bulleted</span> {(q.questions?.[0] ? q.questions.length : 10)} Soal</span>
                  <span className="flex items-center gap-1.5 border border-outline-variant/30 px-2 py-1 rounded-md"><span className="material-symbols-outlined text-[14px]">play_arrow</span> {q.plays || 0} Kali</span>
                </div>
                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => onShareQuiz?.(q.title, q.id)}
                    className="flex-1 py-2.5 bg-primary-container/40 hover:bg-primary text-primary hover:text-white font-bold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5 outline-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span> Bagikan
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedQuizForAssign({ id: q.id, title: q.title, questions: q.questions });
                      setIsAssignModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-secondary-container/40 hover:bg-secondary text-secondary hover:text-white font-bold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5 outline-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span> Kirim
                  </button>
                  <Link href={`/quiz/${q.id}`}>
                    <button className="w-[44px] shrink-0 h-[44px] border border-outline-variant/50 hover:bg-primary hover:border-primary hover:text-white text-on-surface-variant font-bold rounded-xl transition-all flex items-center justify-center outline-none shadow-sm hover:shadow-md">
                      <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AssignToClassModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        quizId={selectedQuizForAssign?.id || ""}
        quizTitle={selectedQuizForAssign?.title || ""}
        quizData={selectedQuizForAssign?.questions || []}
        classes={classesData}
        onSuccess={(className) => alert(`Berhasil mengirim kuis ke kelas ${className}!`)}
      />
    </div>
  );
}
