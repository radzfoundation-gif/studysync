import Link from "next/link";
import React from "react";

export default function SchedulePage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-0 font-body">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 w-full z-50 flex items-center justify-between px-6 h-16 border-b border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold font-headline text-primary">Group Schedule</h1>
        </div>
        <button className="bg-primary text-white p-2 rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors">
          <span className="material-symbols-outlined">calendar_add_on</span>
        </button>
      </header>
      
      <main className="max-w-5xl mx-auto pt-8 px-6 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Mini Calendar / Agenda Sidebar */}
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 editorial-shadow mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold font-headline">Mei 2026</h3>
                <div className="flex gap-2">
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary">chevron_left</span>
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary">chevron_right</span>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-xs font-bold text-outline-variant mb-4">
                <span>Sn</span><span>Sl</span><span>Rb</span><span>Km</span><span>Jm</span><span>Sb</span><span>Mg</span>
              </div>
              <div className="grid grid-cols-7 text-center text-sm gap-y-4 font-medium">
                <span className="text-outline/30">27</span><span className="text-outline/30">28</span><span className="text-outline/30">29</span><span className="text-outline/30">30</span>
                <span>1</span><span>2</span><span>3</span>
                <span>4</span><span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto shadow-md">5</span><span>6</span><span>7</span><span>8</span><span>9</span><span className="relative">10<div className="w-1 h-1 bg-error rounded-full absolute bottom-0 left-1/2 -translate-x-1/2"></div></span>
                <span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span>
              </div>
            </div>
          </div>

          {/* Agenda List */}
          <div className="flex-1 space-y-6">
            <h2 className="font-extrabold text-2xl font-headline flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">event_upcoming</span>
              Upcoming Events
            </h2>
            
            <div className="relative pl-6 border-l-2 border-outline-variant/30 space-y-8">
               <div className="text-sm text-on-surface-variant py-4">
                 Belum ada agenda atau kegiatan mendatang.
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
