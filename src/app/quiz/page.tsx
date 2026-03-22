import Link from "next/link";
import Image from "next/image";

export default function QuizPage() {
  return (
    <div className="bg-background font-body text-on-background min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-transparent font-headline antialiased">
        <div className="flex items-center justify-between px-4 h-16 w-full max-w-7xl mx-auto">
          <Link href="/dashboard" className="text-xl font-bold text-primary tracking-tight">StudySync</Link>
          <div className="flex items-center gap-4">
            <button className="hover:bg-primary/10 transition-colors p-2 rounded-full active:scale-95 duration-150 text-on-surface-variant">
              <span className="material-symbols-outlined">local_fire_department</span>
            </button>
            <button className="hover:bg-primary/10 transition-colors p-2 rounded-full active:scale-95 duration-150 text-on-surface-variant">
              <span className="material-symbols-outlined">emoji_events</span>
            </button>
            <Link href="/settings">
              <img alt="User Profile Avatar" className="w-8 h-8 rounded-full border border-outline-variant/30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGnqzDglwzkLlPUGRny41vZD-L4i49ZXf83Iy37f_tSjSaqWp0ypLGJZKCEJcuf-4WRG2DGbqvxv8InNZmsjvOqnPnbY_r2A0Ht76bsz2xkebylVtthyqz1PW0SKj3JKghu-N4VY_TiZVptSapiIq-ywkn3Qis2SZVLCrg0MkyOnUMgGwdvFfnNlllKm2yEEw1jJfavIg0FLjR_btIL5-SgY23sAudvd6-Xdjc99cNHoS-kz0yx68X25FP1331cwUXkwjkHm5idiw" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-24 px-4 max-w-4xl mx-auto relative min-h-[calc(100vh-80px)]">
        {/* Confetti Background Layer */}
        <div className="fixed inset-0 pointer-events-none confetti-bg z-0"></div>
        
        <section className="relative z-10 space-y-6">
          {/* Quiz Header */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-primary">Progress</span>
                <span className="text-sm font-medium text-on-surface-variant">7 / 10 Questions</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full w-[70%] transition-all duration-500"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-tertiary-container/10 px-4 py-2 rounded-lg border border-tertiary-container/20">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs font-bold text-tertiary uppercase tracking-wider">Streak</p>
                <p className="text-lg font-black text-tertiary">3 Streak!</p>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-lg border border-outline-variant/20 text-center space-y-8 relative overflow-hidden">
            {/* Subtle decorative background element */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            <h2 className="text-2xl md:text-3xl font-bold font-headline text-on-surface leading-tight relative">
              What is the function of Mitochondria in a cell?
            </h2>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <button className="group p-5 bg-surface-container-lowest border-2 border-primary/10 hover:border-primary-container rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-surface-container-high group-hover:bg-primary-container group-hover:text-white flex items-center justify-center font-bold text-on-surface-variant transition-colors">A</span>
                <span className="text-lg font-medium text-on-surface">To synthesize proteins</span>
              </button>
              <button className="group p-5 bg-surface-container-lowest border-2 border-primary/10 hover:border-primary-container rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-surface-container-high group-hover:bg-primary-container group-hover:text-white flex items-center justify-center font-bold text-on-surface-variant transition-colors">B</span>
                <span className="text-lg font-medium text-on-surface">To store genetic information</span>
              </button>
              <button className="group p-5 bg-primary/5 border-2 border-primary rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold transition-colors">C</span>
                <span className="text-lg font-medium text-on-surface">To produce energy (ATP)</span>
              </button>
              <button className="group p-5 bg-surface-container-lowest border-2 border-primary/10 hover:border-primary-container rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-surface-container-high group-hover:bg-primary-container group-hover:text-white flex items-center justify-center font-bold text-on-surface-variant transition-colors">D</span>
                <span className="text-lg font-medium text-on-surface">To digest waste materials</span>
              </button>
            </div>
          </div>

          {/* AI Tutor Feedback */}
          <div className="relative mt-8">
            <div className="flex items-start gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10 max-w-2xl mx-auto mt-12 md:mt-8 relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div className="relative bg-surface-container-lowest p-4 rounded-2xl rounded-tl-none border border-outline-variant/30 shadow-sm flex-1">
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
                  <span className="font-bold text-primary">Spot on!</span> The mitochondria are often called the "powerhouse of the cell" because they convert nutrients into ATP. Keep it up!
                </p>
                {/* Speech bubble tail */}
                <div className="absolute -left-2 top-0 w-4 h-4 bg-surface-container-lowest border-l border-t border-outline-variant/30 transform -rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Badge Showcase */}
          <div className="mt-16 space-y-4 pt-8 border-t border-outline-variant/10">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-tertiary">military_tech</span>
              Badges Earned This Session
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-outline-variant/20 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <span className="text-sm font-bold text-on-surface">Fast Learner</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-outline-variant/20 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="text-sm font-bold text-on-surface">Perfect Score</span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-dashed border-outline-variant/50 opacity-50 grayscale">
                <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">lock</span>
                </div>
                <span className="text-sm font-bold text-on-surface-variant">Night Owl</span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-dashed border-outline-variant/50 opacity-50 grayscale">
                <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">lock</span>
                </div>
                <span className="text-sm font-bold text-on-surface-variant">Researcher</span>
              </div>
            </div>
          </div>
        </section>

        {/* Decorative Floating Symbols */}
        <span className="material-symbols-outlined absolute top-20 left-4 text-tertiary/20 text-4xl select-none" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
        <span className="material-symbols-outlined absolute bottom-40 right-10 text-primary/20 text-5xl select-none rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        <span className="material-symbols-outlined absolute top-1/2 left-[-2rem] text-secondary/20 text-3xl select-none -rotate-12 hidden md:block" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-outline-variant/20 shadow-lg">
        <div className="flex justify-around items-center h-16 px-2 w-full max-w-7xl mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="text-[11px] font-medium font-body mt-1">Study</span>
          </Link>
          <Link href="/quiz" className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-xl px-5 py-2 active:scale-90 transition-all">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <span className="text-[11px] font-bold font-body mt-1">Quiz</span>
          </Link>
          <Link href="/rooms" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">group</span>
            <span className="text-[11px] font-medium font-body mt-1">Groups</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[11px] font-medium font-body mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
