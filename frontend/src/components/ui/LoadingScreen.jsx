import React from 'react';
import { Truck } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999]">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 blur-[80px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full animate-pulse-slow" />

      {/* Logo icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-6 bg-primary/15 blur-2xl rounded-full animate-pulse-slow" />
        <div className="relative w-16 h-16 bg-neon-glow rounded-2xl flex items-center justify-center shadow-neon animate-float">
          <Truck className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-surface-light rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-neon-glow rounded-full"
          style={{ animation: 'loading-bar 1.8s ease-in-out infinite' }}
        />
      </div>

      <h2 className="text-sm font-bold tracking-[0.3em] text-primary uppercase">Loading System</h2>
      <p className="mt-1.5 text-muted text-xs">Optimizing logistics modules...</p>

      <style>{`
        @keyframes loading-bar {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
