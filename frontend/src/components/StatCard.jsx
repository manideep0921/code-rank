import React from "react";
export default function StatCard({ title, value, sub, right }) {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-400">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">{value}</div>
          {sub ? <div className="mt-1 text-sm text-zinc-400">{sub}</div> : null}
        </div>
        {right ? <div className="text-sm text-zinc-300">{right}</div> : null}
      </div>
    </div>
  );
}
