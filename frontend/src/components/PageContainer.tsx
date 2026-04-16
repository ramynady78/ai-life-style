import React from "react";

export function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`pt-16 min-h-screen bg-background flex flex-col ${className}`}>
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
