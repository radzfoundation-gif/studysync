"use client";

import React from 'react';

interface OverviewTabProps {
  profile: { full_name?: string } | null;
  onCreateClass?: () => void;
  classesCount: number;
  assignmentsCount: number;
  onTabChange?: (tab: string) => void;
}

export default function OverviewTab({ profile, onCreateClass, classesCount, assignmentsCount, onTabChange }: OverviewTabProps) {
  const quickActions = [
    { icon: 'fact_check', label: 'Absen', tab: 'attendance', color: 'bg-green-500' },
    { icon: 'chat', label: 'Chat', tab: 'classes', color: 'bg-blue-500' },
    { icon: 'send', label: 'Kirim Tugas', tab: 'assignments', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Compact */}
      <div className="bg-gradient-to-r from-primary to-surface-tint rounded-2xl p-5 text-white shadow-lg shadow-primary/20 relative overflow-hidden flex items-center justify-between">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 w-full flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-headline mb-1">Selamat datang kembali, {profile?.full_name?.split(' ')[0] || 'Guru'}! 👋</h2>
            <p className="text-white/80 font-medium text-xs">Anda memiliki {assignmentsCount} tugas tertunda dan {classesCount} kelas aktif.</p>
          </div>
          <button 
            onClick={onCreateClass}
            className="hidden sm:flex bg-white text-primary px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all outline-none items-center gap-1 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Buat Kelas
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => onTabChange?.(action.tab)}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-outline-variant/30 hover:border-primary/40 hover:shadow-lg transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${action.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics Grid - Clean Blue & White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Siswa', count: '0', icon: 'people' },
          { label: 'Kelas Aktif', count: classesCount.toString(), icon: 'meeting_room' },
          { label: 'Tugas Tertunda', count: assignmentsCount.toString(), icon: 'notification_important' },
          { label: 'Rata-rata Nilai', count: '-', icon: 'trending_up' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,119,255,0.08)] transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all`}>
              <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black font-headline text-on-surface leading-none mb-1">{stat.count}</h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/30">
            <h3 className="font-bold font-headline text-sm">Pengumpulan Terbaru</h3>
            <button className="text-xs text-primary font-bold hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-surface-container-lowest text-[10px] uppercase tracking-wider text-outline border-b border-outline-variant/20">
                  <th className="px-5 py-2.5 font-bold">Siswa</th>
                  <th className="px-5 py-2.5 font-bold">Kelas</th>
                  <th className="px-5 py-2.5 font-bold">Status</th>
                  <th className="px-5 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                 <tr>
                   <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant">Belum ada submisi tugas.</td>
                 </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI & Schedule */}
        <div className="space-y-6">
          {/* AI Assistant Hook */}
          <div className="bg-surface-container-lowest rounded-xl border border-primary/20 shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-bold text-sm text-primary">AI Copilot</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 font-medium leading-relaxed">
              Buat kuis personalizado berdasarkan modul biologi terbaru Anda.
            </p>
            <button onClick={() => onTabChange?.('ai-assistant')} className="w-full py-2 bg-primary text-white font-bold rounded-lg text-xs hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Generate Sekarang
            </button>
          </div>

          {/* Schedule */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-5">
            <h3 className="font-bold font-headline text-sm mb-3">Jadwal Hari Ini</h3>
            <div className="space-y-3">
                <div className="flex items-center justify-center py-6 text-on-surface-variant text-xs">
                  Tidak ada jadwal hari ini.
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
