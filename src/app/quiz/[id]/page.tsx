"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.id as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!quizId) return;
    const fetchQuiz = async () => {
      const { data } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
      if (data) setQuiz(data);
      else router.push('/dashboard');
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId, router]);

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate Score
      let correctCount = 0;
      quiz.questions.forEach((q: any, idx: number) => {
        if (selectedAnswers[idx] === q.correctAnswer) correctCount++;
      });
      const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
      setScore(finalScore);
      setIsFinished(true);

      // Increment plays
      supabase.rpc('increment_quiz_plays', { quiz_id: quizId });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      <p className="mt-4 font-bold text-on-surface-variant">Memuat Kuis...</p>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 animate-bounce">
        <span className="material-symbols-outlined text-5xl">emoji_events</span>
      </div>
      <h1 className="text-4xl font-black font-headline mb-2">Kuis Selesai!</h1>
      <p className="text-on-surface-variant mb-8">Selamat! Anda telah menyelesaikan <b>{quiz.title}</b></p>
      
      <div className="bg-white border border-outline-variant/30 rounded-3xl p-10 shadow-xl mb-10 w-full max-w-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Skor Akhir Anda</p>
        <h2 className={`text-7xl font-black ${score >= 70 ? 'text-green-500' : 'text-primary'}`}>{score}</h2>
      </div>

      <button 
        onClick={() => router.push('/dashboard')}
        className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-on-surface flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-outline-variant/30 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">arrow_back</Link>
          <h2 className="font-bold text-sm truncate max-w-[200px]">{quiz.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            Soal {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-high h-1.5 overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
        ></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full">
        <div className="w-full bg-white border border-outline-variant/30 rounded-3xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold font-headline mb-10 leading-relaxed text-on-surface">
            {currentQuestion.question}
          </h3>

          <div className="grid gap-4">
            {currentQuestion.options.map((option: string, i: number) => (
              <button 
                key={i}
                onClick={() => handleSelectOption(i)}
                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  selectedAnswers[currentQuestionIndex] === i 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                    selectedAnswers[currentQuestionIndex] === i ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={`font-bold text-sm ${selectedAnswers[currentQuestionIndex] === i ? 'text-on-surface' : 'text-on-surface-variant'}`}>{option}</span>
                </div>
                {selectedAnswers[currentQuestionIndex] === i && (
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full mt-10 flex justify-between items-center">
          <div className="flex gap-2">
            {quiz.questions.map((_: any, i: number) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentQuestionIndex ? 'bg-primary w-6' : selectedAnswers[i] !== undefined ? 'bg-primary/40' : 'bg-outline-variant/40'} transition-all`}></div>
            ))}
          </div>
          <button 
            disabled={selectedAnswers[currentQuestionIndex] === undefined}
            onClick={handleNext}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Selesaikan Kuis' : 'Berikutnya'}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </main>
    </div>
  );
}
