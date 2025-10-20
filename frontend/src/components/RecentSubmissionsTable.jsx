import React from "react";
const statusColor = (s) => {
  if (!s) return "bg-zinc-700 text-zinc-100";
  const v = s.toLowerCase();
  if (v.includes("success")) return "bg-emerald-600/20 text-emerald-300";
  if (v.includes("error") || v.includes("fail")) return "bg-rose-600/20 text-rose-300";
  if (v.includes("pending")) return "bg-amber-600/20 text-amber-300";
  return "bg-zinc-700 text-zinc-200";
};
export default function RecentSubmissionsTable({ submissions = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/40 bg-zinc-900/30">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2">Problem</th>
            <th className="px-4 py-2">Language</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-4 py-6 text-center text-zinc-400">No submissions yet</td>
            </tr>
          ) : (
            submissions.map((s) => (
              <tr key={s.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-2 text-zinc-200">{s.title}</td>
                <td className="px-4 py-2 text-zinc-400">{s.language}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusColor(s.status)}`}>{s.status}</span>
                </td>
                <td className="px-4 py-2 text-zinc-400">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
