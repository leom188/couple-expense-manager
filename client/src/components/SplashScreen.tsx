import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 1500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 500); // Wait for fade animation
    }, minDuration);

    return () => clearTimeout(timer);
  }, [onFinish, minDuration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo */}
      <div className="relative mb-8 animate-pulse">
        <img
          src="/icon-192.png"
          alt="SharedWallet"
          className="w-28 h-28 rounded-3xl shadow-2xl shadow-indigo-500/30"
        />
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl -z-10 scale-150" />
      </div>

      {/* App name */}
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
        Shared<span className="text-indigo-400">Wallet</span>
      </h1>
      
      {/* Tagline */}
      <p className="text-slate-400 text-sm mb-8">
        Manage expenses together
      </p>

      {/* Loading indicator */}
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
