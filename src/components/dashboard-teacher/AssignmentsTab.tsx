"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import CreateAssignmentModal from "@/components/CreateAssignmentModal";
import StatusModal from "@/components/StatusModal";

interface Assignment {
  id: string;
  title: string;
  course_name: string;
  due_date: string;
  status: string;
  class_id: string;
  created_at: string;
  classes?: { name: string };
}

interface ClassData {
  id: string;
  name: string;
}

export default function AssignmentsTab() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "info",
    title: "",
    message: "",
  });

  const showStatus = (type: "success" | "error" | "info", title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    const [assignmentsRes, classesRes] = await Promise.all([
      supabase
        .from("assignments")
        .select("*, classes(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("classes")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus tugas ini?")) return;
    
    try {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
      
      showStatus("success", "Berhasil", "Tugas berhasil dihapus");
      fetchData();
    } catch (error: any) {
      showStatus("error", "Gagal", error.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("assignments")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      showStatus("success", "Berhasil", `Status diubah ke ${newStatus}`);
      fetchData();
    } catch (error: any) {
      showStatus("error", "Gagal", error.message);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchClass = filterClass === "all" || a.class_id === filterClass;
    const matchSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchClass && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Active": return "bg-green-100 text-green-700";
      case "Closed": return "bg-gray-100 text-gray-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-on-surface">Manajemen Tugas</h2>
          <p className="text-xs text-on-surface-variant">Kelola dan terbitkan tugas untuk siswa</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Tugas Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", count: assignments.length, icon: "assignment", color: "bg-blue-500" },
          { label: "Aktif", count: assignments.filter(a => a.status === "Active").length, icon: "play_circle", color: "bg-green-500" },
          { label: "Tertunda", count: assignments.filter(a => a.status === "Pending").length, icon: "schedule", color: "bg-yellow-500" },
          { label: "Ditutup", count: assignments.filter(a => a.status === "Closed").length, icon: "lock", color: "bg-gray-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-outline-variant/30 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.color} text-white flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-xl font-black text-on-surface">{stat.count}</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-outline-variant/30">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Pending">Tertunda</option>
            <option value="Active">Aktif</option>
            <option value="Closed">Ditutup</option>
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">sync</span>
            <p className="text-xs text-on-surface-variant mt-2">Memuat...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">assignment</span>
            <p className="text-xs text-on-surface-variant mt-2">Belum ada tugas</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4 hover:bg-surface-container/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      assignment.status === "Active" ? "bg-green-100 text-green-600" :
                      assignment.status === "Pending" ? "bg-yellow-100 text-yellow-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-on-surface truncate">{assignment.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                        {isOverdue(assignment.due_date) && assignment.status !== "Closed" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-error/10 text-error">
                            Terlambat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mb-2">{assignment.course_name} • {assignment.classes?.name || "Tanpa Kelas"}</p>
                      <div className="flex items-center gap-4 text-[10px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Tenggat: {formatDate(assignment.due_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          Dibuat: {formatDate(assignment.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={assignment.status}
                      onChange={(e) => handleStatusChange(assignment.id, e.target.value)}
                      className="px-2 py-1 bg-surface-container border border-outline-variant/30 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="Pending">Tertunda</option>
                      <option value="Active">Aktif</option>
                      <option value="Closed">Ditutup</option>
                    </select>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-error hover:bg-error-container/20 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/20">
              <h3 className="text-lg font-black text-on-surface">Pilih Kelas</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {classes.length === 0 ? (
                <p className="text-center text-on-surface-variant text-xs py-8">
                  Belum ada kelas. Buat kelas terlebih dahulu.
                </p>
              ) : (
                classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => {
                      setSelectedClass(cls);
                      setIsModalOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container hover:bg-primary/10 border border-outline-variant/30 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">school</span>
                    </div>
                    <span className="text-sm font-bold text-on-surface">{cls.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {selectedClass && (
        <CreateAssignmentModal
          isOpen={true}
          onClose={() => setSelectedClass(null)}
          classId={selectedClass.id}
          courseName={selectedClass.name}
          onSuccess={() => {
            setSelectedClass(null);
            fetchData();
          }}
        />
      )}

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}