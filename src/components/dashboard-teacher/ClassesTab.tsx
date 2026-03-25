import React from "react";
import Link from "next/link";

export default function ClassesTab({ classesData, onCreateClass, onShareClass }: { classesData: any[], onCreateClass?: () => void, onShareClass?: (name: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-xl font-headline">Classes & Study Rooms</h3>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgb(0,119,255,0.6)]"></span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
        <button onClick={onCreateClass} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Kelas Baru
        </button>
      </div>

      {classesData.length === 0 ? (
        <div className="bg-white border border-outline-variant/30 rounded-3xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-5xl mb-3">meeting_room</span>
          <p className="font-bold text-on-surface-variant text-lg">Belum ada kelas.</p>
          <p className="text-sm text-on-surface-variant/70 mt-1">Gunakan tombol Buat Kelas Baru untuk menambahkan.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classesData.map(cls => (
          <div key={cls.id} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,119,255,0.08)] hover:border-primary/30 transition-all flex flex-col group">
            <div className={`h-28 ${cls.theme_color || 'bg-primary'} p-5 flex flex-col justify-end relative overflow-hidden`}>
              {/* Abstract Lines Pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.25] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`abstract-lines-${cls.id}`} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                    <rect x="0" y="0" width="2" height="32" fill="#ffffff" />
                    <rect x="10" y="0" width="1" height="32" fill="#ffffff" />
                    <rect x="18" y="0" width="4" height="32" fill="#ffffff" />
                    <rect x="26" y="0" width="1" height="32" fill="#ffffff" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill={`url(#abstract-lines-${cls.id})`} />
              </svg>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
              <h4 className="text-white font-black text-xl mb-1 relative z-10 leading-tight drop-shadow-sm">{cls.name}</h4>
              <p className="text-white/90 text-xs font-semibold relative z-10 drop-shadow-sm">{cls.grade} • {cls.students} Siswa</p>
            </div>
            
            <div className="p-5 bg-surface-container-lowest flex flex-col gap-3">
              <button className="w-full py-2.5 bg-primary-container text-on-primary-container font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">assignment_add</span>
                Buat Tugas
              </button>
              
              <div className="flex gap-2 mt-1">
                <Link href={`/dashboard-teacher/rooms/${cls.id}`} className="flex-1">
                  <button className="w-full py-2.5 border border-outline-variant text-on-surface font-semibold rounded-xl text-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">cast_for_education</span>
                    Buka Room
                  </button>
                </Link>
                <button 
                  onClick={() => onShareClass?.(cls.name)}
                  title="Bagikan Tautan Kelas"
                  className="px-3 py-2.5 border border-outline-variant text-on-surface-variant hover:text-primary font-semibold rounded-xl text-sm hover:bg-primary-container/50 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
