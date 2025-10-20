import React from "react";
export default function XPBar({ xp = 0, level = 1 }) {
  const xpForNext = level * 100;
  const progress = Math.min((xp % xpForNext) / xpForNext, 1);
  return (
    <div className="relative w-full rounded-full bg-zinc-800/70 p-1">
      <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
           style={{ width: `${progress * 100}%` }} />
      <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-300">
        {xp} / {xpForNext} XP
      </div>
    </div>
  );
}
