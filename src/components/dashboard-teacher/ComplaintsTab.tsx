import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ComplaintsTab({ onShowStatus }: { onShowStatus: (type: 'success' | 'error' | 'info', title: string, msg: string) => void }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setComplaints(data);
    setLoading(false);
  };

  const handleReply = async (id: string) => {
    const text = replyText[id];
    if (!text) return onShowStatus('error', 'Pesan Kosong', 'Harap isi balasan Anda.');

    const { error } = await supabase
      .from('student_complaints')
      .update({ 
        reply: text,
        status: 'Selesai'
      })
      .eq('id', id);
    
    if (error) {
      onShowStatus('error', 'Gagal Membalas', error.message);
    } else {
      onShowStatus('success', 'Terkirim!', 'Balasan Anda telah tersimpan dan dapat dilihat siswa.');
      fetchComplaints();
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('student_complaints')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchComplaints();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center text-on-surface">
          <h3 className="font-bold text-xl font-headline">Student Complaints</h3>
          <button onClick={fetchComplaints} className="material-symbols-outlined p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">refresh</button>
       </div>

       <div className="grid grid-cols-1 gap-4 text-on-surface">
          {loading ? (
             <div className="py-20 text-center text-on-surface-variant"><span className="animate-spin material-symbols-outlined text-primary">sync</span></div>
          ) : complaints.length === 0 ? (
             <div className="bg-white rounded-2xl p-10 border border-outline-variant/30 text-center text-on-surface-variant font-medium">
                Belum ada keluhan yang masuk.
             </div>
          ) : complaints.map(item => (
             <div key={item.id} className="bg-white rounded-2xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-xs">
                         {item.student_name?.substring(0, 2) || "S"}
                      </div>
                      <div>
                         <h4 className="font-bold text-on-surface">{item.subject}</h4>
                         <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{item.student_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <select 
                     value={item.status} 
                     onChange={(e) => updateStatus(item.id, e.target.value)}
                     className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-outline-variant outline-none cursor-pointer ${
                        item.status === 'Baru' ? 'bg-error-container/20 text-error' : 
                        item.status === 'Diproses' ? 'bg-primary-container/20 text-primary' : 'bg-green-100 text-green-700'
                     }`}
                   >
                      <option value="Baru">Baru</option>
                      <option value="Diproses">Diproses</option>
                      <option value="Selesai">Selesai</option>
                   </select>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed bg-slate-50 p-4 rounded-xl border border-outline-variant/10 italic mb-4">
                   "{item.message}"
                </p>

                {/* Reply Section */}
                <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3">
                    {item.reply ? (
                        <div className="bg-primary-container/10 p-4 rounded-xl border border-primary/10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">reply</span> 
                                Balasan Anda:
                            </p>
                            <p className="text-sm text-on-surface font-medium">{item.reply}</p>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Tulis balasan untuk siswa..."
                                className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                value={replyText[item.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [item.id]: e.target.value })}
                            />
                            <button 
                                onClick={() => handleReply(item.id)}
                                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                Balas
                            </button>
                        </div>
                    )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}
