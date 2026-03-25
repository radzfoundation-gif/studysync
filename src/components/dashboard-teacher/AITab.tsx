import React from "react";

export default function AITab() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
        <span className="material-symbols-outlined text-[32px]">smart_toy</span>
      </div>
      <h3 className="font-bold text-lg mb-2">Teaching AI Assistant</h3>
      <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">Leverage AI to generate lesson plans, automate grading, and answer common student questions 24/7.</p>
      <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:shadow-md transition-all">Open AI Chat</button>
    </div>
  );
}
