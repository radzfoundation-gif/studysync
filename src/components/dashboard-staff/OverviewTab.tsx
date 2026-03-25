"use client";

import React from "react";

interface OverviewTabProps {
  stats: {
    students: number;
    teachers: number;
    classes: number;
    assignments: number;
  };
}

export default function OverviewTab({ stats }: OverviewTabProps) {
  const statCards = [
    { icon: "school", label: "Total Siswa", value: stats.students, color: "bg-blue-500" },
    { icon: "groups", label: "Total Guru", value: stats.teachers, color: "bg-purple-500" },
    { icon: "meeting_room", label: "Total Kelas", value: stats.classes, color: "bg-orange-500" },
    { icon: "assignment", label: "Total Tugas", value: stats.assignments, color: "bg-teal-500" },
  ];

  const quickActions = [
    { icon: "person_add", label: "Tambah Siswa", href: "#students", color: "hover:text-blue-600" },
    { icon: "add_circle", label: "Tambah Guru", href: "#teachers", color: "hover:text-purple-600" },
    { icon: "folder", label: "Buat Laporan", href: "#reports", color: "hover:text-orange-600" },
    { icon: "print", label: "Cetak Data", href: "#reports", color: "hover:text-teal-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white rounded-3xl p-6 border border-outline-variant/30 flex items-center gap-5 shadow-sm group hover:border-tertiary/30 transition-all hover:shadow-md"
          >
            <div className={`w-12 h-12 rounded-2xl ${card.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-2xl">{card.icon}</span>
            </div>
            <div>
              <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">{card.label}</p>
              <p className="text-2xl font-black text-on-surface tracking-tighter">{card.value.toLocaleString('id-ID')}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-outline-variant/30">
          <h2 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container hover:bg-tertiary-container/20 border border-outline-variant/20 transition-all group"
              >
                <span className={`material-symbols-outlined text-tertiary ${action.color} transition-colors`}>
                  {action.icon}
                </span>
                <span className="text-xs font-bold text-on-surface">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-outline-variant/30">
          <h2 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Info Panel Tata Usaha
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
              <p className="text-xs font-bold text-on-surface mb-1">Tahun Ajaran Aktif</p>
              <p className="text-sm font-black text-tertiary">2025/2026</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
              <p className="text-xs font-bold text-on-surface mb-1">Semester</p>
              <p className="text-sm font-black text-tertiary">Genap</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
              <p className="text-xs font-bold text-on-surface mb-1">Status Sistem</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-sm font-black text-green-600">Normal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-tertiary/10 to-tertiary-container/30 rounded-3xl p-6 border border-tertiary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-tertiary text-white flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <p className="text-sm font-black text-on-surface">Selamat Datang di Panel Tata Usaha</p>
            <p className="text-xs text-on-surface-variant">Kelola data sekolah, laporan, dan informasi akademik di sini.</p>
          </div>
        </div>
      </div>
    </div>
  );
}