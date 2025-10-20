import React from "react";
export default function BadgePill({ name, awarded_at }) {
  const when = awarded_at ? new Date(awarded_at).toLocaleDateString() : null;
  return (
    <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
      <span className="mr-2">🏅</span>
      <span className="font-medium">{name}</span>
      {when ? <span className="ml-2 text-emerald-300/70">· {when}</span> : null}
    </div>
  );
}
