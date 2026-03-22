import Link from "next/link";
import React from "react";

export default function AchievementsPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-0 font-body">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 w-full z-50 flex items-center justify-between px-6 h-16 border-b border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold font-headline text-primary">Achievements</h1>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto pt-8 px-6 pb-12">
        {/* Streak & Score Banner */}
        <section className="bg-gradient-to-r from-primary to-secondary-container rounded-3xl p-8 mb-10 text-white shadow-xl shadow-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 text-center sm:text-left">
            <h2 className="text-3xl font-extrabold mb-2 font-headline">Ayo Mulai Belajar! 🚀</h2>
            <p className="text-white/80 font-medium text-sm">Raih pencapaian pertamamu dengan menyelesaikan tugas.</p>
          </div>
          <div className="relative z-10 flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/30 text-center">
              <div className="text-3xl font-black mb-1 font-headline">0</div>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Day Streak</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/30 text-center">
              <div className="text-3xl font-black mb-1 font-headline">0</div>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Total Points</div>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <h3 className="font-headline font-bold text-2xl mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">military_tech</span>
          Your Badges
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center opacity-50 grayscale">
            <div className="w-16 h-16 mx-auto bg-surface-variant rounded-full flex items-center justify-center mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <p className="font-bold text-sm mb-1">Firestarter</p>
            <p className="text-[10px] text-on-surface-variant">7 Day Streak</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center opacity-50 grayscale">
            <div className="w-16 h-16 mx-auto bg-surface-variant rounded-full flex items-center justify-center mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <p className="font-bold text-sm mb-1">Collaborator</p>
            <p className="text-[10px] text-on-surface-variant">Shared 5 Notes</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center opacity-50 grayscale">
            <div className="w-16 h-16 mx-auto bg-surface-variant rounded-full flex items-center justify-center mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <p className="font-bold text-sm mb-1">AI Scholar</p>
            <p className="text-[10px] text-on-surface-variant">Asked 50 Questions</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center opacity-50 grayscale">
            <div className="w-16 h-16 mx-auto bg-surface-variant rounded-full flex items-center justify-center mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <p className="font-bold text-sm mb-1">Pioneer</p>
            <p className="text-[10px] text-on-surface-variant">Create 10 Groups</p>
          </div>
        </div>

      </main>
    </div>
  );
}
