import React from "react";
import { Activity } from "lucide-react";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">LifeFit AI</h1>
          <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mt-1">
            Graduation Project
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8 w-full animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 AI-Based Healthy Lifestyle Recommendation System
          </p>
        </div>
      </div>
    </div>
  );
}
