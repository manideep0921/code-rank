import React from "react";
export default function LeaderboardTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/40 bg-zinc-900/30">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">Level</th>
            <th className="px-4 py-2">XP</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-4 py-6 text-center text-zinc-400">No data yet</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.username || i} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-2 text-zinc-200 font-medium">{r.username}</td>
                <td className="px-4 py-2 text-zinc-300">{r.level}</td>
                <td className="px-4 py-2 text-zinc-300">{r.xp}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
