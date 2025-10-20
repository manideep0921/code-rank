import React from "react";

export default function Leaderboard({ items = [] }) {
  if (!items.length) return <div className="text-sm opacity-70">No leaderboard data.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead><tr><th>#</th><th>User</th><th>Level</th><th>XP</th></tr></thead>
        <tbody>
          {items.map((r, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{r.username}</td>
              <td>{r.level}</td>
              <td>{r.xp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
