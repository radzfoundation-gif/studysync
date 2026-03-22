import React, { useState } from 'react';

interface ManualQuizBuilderProps {
  onSave: (title: string, questionCount: number) => void;
  onCancel: () => void;
}

export default function ManualQuizBuilder({ onSave, onCancel }: ManualQuizBuilderProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctIndex: 0 }]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const handleSave = () => {
    if(!title) return alert("Berikan judul kuis terlebih dahulu!");
    
    // Basic validation to check if empty questions exist
    const hasEmptyQuestions = questions.some(q => !q.question.trim());
    if (hasEmptyQuestions) {
       return alert("Terdapat soal yang pertanyaannya masih kosong. Harap isi atau hapus soal tersebut.");
    }

    onSave(title, questions.length);
  };

  const updateQuestion = (qIndex: number, field: string, value: any, optIndex?: number) => {
    const newQs = [...questions];
    if (field === 'question') {
      newQs[qIndex].question = value;
    } else if (field === 'option' && optIndex !== undefined) {
      newQs[qIndex].options[optIndex] = value;
    } else if (field === 'correctIndex') {
      newQs[qIndex].correctIndex = value;
    }
    setQuestions(newQs);
  };

  return (
    <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 lg:p-8 animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-outline-variant/30">
        <div>
          <h3 className="text-2xl font-black font-headline text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] drop-shadow-sm">edit_document</span>
            Pembuat Kuis Manual
          </h3>
          <p className="text-sm font-medium text-on-surface-variant mt-1.5 leading-relaxed">Rancang satu per satu soal Anda dan tentukan opsi jawaban yang spesifik untuk diujikan.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={onCancel} className="px-5 py-2.5 bg-surface-container font-bold text-on-surface hover:bg-surface-container-highest rounded-xl text-sm transition-colors shadow-sm outline-none">
            Batal
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-primary font-bold text-white hover:bg-primary-fixed hover:text-on-primary-fixed rounded-xl text-sm transition-all shadow-lg hover:shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:scale-95 outline-none flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan Kuis Baru
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Judul Kuis</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Kuis Pemahaman Dasar Trigonometri" 
            className="w-full px-5 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-inner"
          />
        </div>

        {/* Question List */}
        <div className="space-y-10">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 sm:p-7 relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -left-3 sm:-left-4 -top-3 sm:-top-4 w-10 h-10 bg-primary text-white font-black rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 text-base border-2 border-white">
                {qIndex + 1}
              </div>
              
              {questions.length > 1 && (
                <button 
                  onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                  className="absolute -right-3 sm:-right-4 -top-3 sm:-top-4 w-8 h-8 bg-error text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 outline-none border-2 border-white"
                  title="Hapus Soal"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}

              <div className="space-y-5">
                <div>
                  <textarea 
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Ketik pertanyaan soal di sini..." 
                    rows={2}
                    className="w-full mt-2 sm:mt-0 px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-y min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${q.correctIndex === optIndex ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-surface border-outline-variant/40 focus-within:border-primary/50'}`}>
                      <button 
                        onClick={() => updateQuestion(qIndex, 'correctIndex', optIndex)}
                        title={q.correctIndex === optIndex ? 'Ini Kunci Jawaban' : 'Jadikan Kunci Jawaban'}
                        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all outline-none ${q.correctIndex === optIndex ? 'border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20 scale-110' : 'border-outline-variant/50 hover:border-primary/50 text-transparent'}`}
                      >
                        <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                      </button>
                      <input 
                        value={opt}
                        onChange={(e) => updateQuestion(qIndex, 'option', e.target.value, optIndex)}
                        placeholder={`Opsi ${String.fromCharCode(65 + optIndex)}`}
                        className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-on-surface-variant/40"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Button */}
        <button 
          onClick={handleAddQuestion}
          className="w-full py-5 border-2 border-dashed border-outline-variant/60 hover:border-primary text-on-surface-variant hover:text-primary font-bold rounded-2xl text-sm bg-surface-container-lowest hover:bg-primary/5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 outline-none group"
        >
          <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform duration-300 text-primary">add_circle</span> Tambah Soal
        </button>

      </div>
    </div>
  );
}
