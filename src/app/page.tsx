"use client";

import { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'student' | 'teacher'>('student');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (role: 'student' | 'teacher' = 'student', mode: 'login' | 'register' = 'login') => {
    setAuthRole(role);
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-white relative">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.3), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.3), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      
      {/* Background Batik Mega Mendung */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ 
          backgroundImage: "url('/images/batik_background.png')", 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)'
        }}
      ></div>
      <div className="relative z-10 pb-8">
        <nav className="fixed top-0 w-full z-50 bg-transparent">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
            StudySync
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 font-sans text-sm transition-colors duration-200">
              Product
            </Link>
            <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 font-sans text-sm font-medium transition-colors duration-200">
              Community
            </Link>
            <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-blue-500 font-sans text-sm font-medium transition-colors duration-200">
              Company
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => openAuth('student', 'login')} className="text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded transition-all duration-200 text-sm font-medium">
              Login
            </button>
            <button onClick={() => openAuth('student', 'register')} className="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-sm">
              Join Free
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-32 px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-container rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-container rounded-full blur-[100px]"></div>
          </div>
          <div className="max-w-7xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase text-primary bg-primary-fixed rounded-full">
              Future of Learning
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-6">
              Belajar Lebih Pintar,<br />
              <span className="text-primary">Bersama StudySync.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
              Catatan kolaboratif bertenaga AI dan kerjasama real-time yang dirancang khusus untuk mahasiswa modern. Tingkatkan produktivitas belajar Anda sekarang.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => openAuth('teacher', 'login')} 
                className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">psychology</span>
                Mulai Sebagai Guru
              </button>
              <Link 
                href="/siswa" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-on-surface border border-outline-variant rounded-xl font-bold text-lg hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">school</span>
                Portal Siswa
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 bg-white/50 border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-semibold text-outline uppercase tracking-widest mb-8">50,000+ Pelajar Telah Bergabung</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-all text-on-surface-variant/80 cursor-default">
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-3xl">school</span>
                <span className="text-xl font-bold tracking-tight font-serif">Universitas Indonesia</span>
              </div>
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-3xl">science</span>
                <span className="text-xl font-bold tracking-tight font-serif">ITB</span>
              </div>
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-3xl">account_balance</span>
                <span className="text-xl font-bold tracking-tight font-serif">UGM</span>
              </div>
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-3xl">computer</span>
                <span className="text-xl font-bold tracking-tight font-serif">BINUS</span>
              </div>
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-3xl">local_library</span>
                <span className="text-xl font-bold tracking-tight font-serif">UNAIR</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo View */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative glass-card rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-white p-4 md:p-8">
              <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 px-3 py-1 bg-surface-container-lowest rounded-lg text-xs font-medium border border-outline-variant/20">
                  Kelompok_Belajar_Biologi.sync
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
                <div className="lg:col-span-2 bg-white rounded-xl p-8 overflow-y-auto shadow-inner">
                  <h3 className="text-2xl font-bold mb-6 text-on-surface">Struktur Sel Prokariotik</h3>
                  <div className="space-y-4 text-on-surface-variant leading-relaxed">
                    <p><span className="bg-primary-fixed/50 px-1 rounded">Sel prokariotik</span> adalah sel yang tidak memiliki membran inti. Contohnya adalah bakteri. Komponen utama meliputi dinding sel, membran plasma, sitoplasma...</p>
                    <div className="flex items-center gap-2 border-l-4 border-primary pl-4 py-2 bg-primary-fixed/20 rounded-r-lg italic">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                      <span>Budi sedang mengetik: "dan ribosom untuk sintesis protein."</span>
                    </div>
                    <img className="rounded-xl w-full h-48 object-cover mt-6" alt="Microscopic view of biological cells" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDAjCBOgHXiA6dZIr5QWH0_-mMa2nRHxayN6GUiYn-gZLD9v5g_hRxi06CCKblJ4Deh1RX7ovzNY294p-ueu6KCnn8_itq1Pto3WnxJT4oD2E_MfzKCW5YzgHZ9mCJq0OFvlX0GjQ8f_NmYFv7HkTIc24Z_YzRbQ3NEupWG87x1cNUdpncg2QCRrQxojIqbQRNsgr47GRFnpPF5bo10R1Z3mxGkw0Q84bAZX8IIw1RdysrKR_xC8WyJw2JwW_BeIbSf7qNnvlMUQ8" />
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl flex flex-col">
                  <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      Claude AI Assistant
                    </span>
                  </div>
                  <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm">
                      Halo! Saya telah merangkum poin-poin penting dari diskusi Anda hari ini. Ingin saya buatkan kuis singkat?
                    </div>
                    <div className="bg-primary text-on-primary p-3 rounded-lg rounded-tr-none shadow-sm text-sm self-end ml-8">
                      Boleh, tolong buatkan 3 pertanyaan tentang Ribosom.
                    </div>
                  </div>
                  <div className="p-4 bg-white border-t border-outline-variant/30">
                    <div className="flex gap-2">
                      <input className="flex-grow bg-surface-container rounded-lg border-none text-sm focus:ring-2 focus:ring-primary h-10 px-3" placeholder="Tanya Claude..." type="text" />
                      <button className="bg-primary text-white p-2 rounded-lg h-10 w-10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-24 px-6 bg-surface-container-low/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Fitur Utama Unggulan</h2>
              <p className="text-on-surface-variant text-lg">Segala yang Anda butuhkan untuk sukses akademis.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-surface p-8 rounded-2xl border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-primary-fixed text-primary rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Real-Time Collaboration</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Teknologi CRDT memungkinkan sinkronisasi instan tanpa konflik saat mengedit catatan bersama teman.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-surface p-8 rounded-2xl border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <h3 className="text-xl font-bold mb-3">AI Tutor Assistant</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Didukung oleh Claude AI untuk membantu merangkum, menjelaskan konsep sulit, dan menjawab pertanyaan Anda.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-surface p-8 rounded-2xl border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>translate</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Auto-Translation</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Terjemahkan jurnal internasional dari English ke Bahasa Indonesia secara otomatis dalam sekejap.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-surface p-8 rounded-2xl border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Gamified Learning</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Kumpulkan points dan jaga streak belajar Anda untuk mendapatkan reward menarik setiap minggunya.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Pilih Paket Belajarmu</h2>
              <p className="text-on-surface-variant text-lg">Mulai gratis, upgrade kapan saja sesuai kebutuhan.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Tier */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/50 flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Free</h3>
                  <p className="text-on-surface-variant text-sm">Untuk pelajar individu</p>
                  <div className="mt-4 text-4xl font-extrabold">Rp 0<span className="text-sm font-normal text-outline">/bln</span></div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    3 Workspace Kolaboratif
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Dasar AI Assistant (10 tanya/hari)
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Penyimpanan Cloud 500MB
                  </li>
                </ul>
                <button className="w-full py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary-fixed transition-all">Pilih Gratis</button>
              </div>

              {/* Pro Tier */}
              <div className="bg-white p-8 rounded-3xl border-2 border-primary ring-4 ring-primary-fixed/30 flex flex-col relative scale-105 shadow-2xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold tracking-widest">PALING POPULER</div>
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <p className="text-on-surface-variant text-sm">Untuk ambisi akademik tinggi</p>
                  <div className="mt-4 text-4xl font-extrabold">Rp 29K<span className="text-sm font-normal text-outline">/bln</span></div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Unlimited Workspace
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Unlimited AI Tutor
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Terjemahan Jurnal Tanpa Batas
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Penyimpanan Cloud 10GB
                  </li>
                </ul>
                <button className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">Mulai Langganan</button>
              </div>

              {/* Team Tier */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/50 flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Team</h3>
                  <p className="text-on-surface-variant text-sm">Untuk organisasi &amp; UKM kampus</p>
                  <div className="mt-4 text-4xl font-extrabold">Custom</div>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Admin Dashboard &amp; Analytics
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    SSO &amp; Advanced Security
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    Prioritas Support 24/7
                  </li>
                </ul>
                <button className="w-full py-3 rounded-xl border border-outline text-on-surface font-bold hover:bg-surface-container-high transition-all">Hubungi Kami</button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3"></div>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8">Ready to sync your studies?</h2>
            <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">Bergabunglah dengan ribuan pelajar cerdas lainnya dan rasakan revolusi belajar yang sesungguhnya.</p>
            <button onClick={() => openAuth('student', 'register')} className="bg-white text-primary px-12 py-5 rounded-2xl font-black text-xl hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all">
              Join Now
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">StudySync</div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Platform kolaborasi akademik terbaik untuk masa depan pendidikan yang lebih inklusif dan cerdas.
            </p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-slate-400 hover:text-blue-500 cursor-pointer">public</span>
              <span className="material-symbols-outlined text-slate-400 hover:text-blue-500 cursor-pointer">alternate_email</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Features</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Pricing</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">About Us</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Careers</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Help Center</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-500 underline decoration-2 underline-offset-4 text-sm transition-colors duration-200">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-slate-200/50">
          <p className="text-slate-500 text-sm">© 2026 StudySync Inc. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialRole={authRole}
        initialMode={authMode}
      />
      </div>
    </div>
  );
}
