import React from "react";

export default function BadgeGrid({ badges = [] }) {
  if (!badges.length) return <div className="text-sm opacity-70">No badges yet.</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {badges.map((b, i) => (
        <div key={i} className="card bg-base-200">
          <div className="card-body p-4">
            <div className="text-lg font-semibold">{b.name}</div>
            <div className="text-xs opacity-70">
              Awarded: {b.awarded_at ? new Date(b.awarded_at).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
