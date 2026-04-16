import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";

export function SidebarLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-sm border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {/* Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onCloseMobile={() => setMobileOpen(false)} />
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full min-w-0 transition-all duration-300 md:ml-64`}>
        <div className={`max-w-7xl mx-auto ${className} md:pt-0 pt-16`}>
          {children}
        </div>
      </main>
    </div>
  );
}
