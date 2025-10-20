import React from "react";

export default function SubmissionsTable({ rows = [] }) {
  if (!rows.length) return <div className="text-sm opacity-70">No submissions yet.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Title</th><th>Lang</th><th>Status</th><th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.title ?? s.problem_title ?? "—"}</td>
              <td>{s.language ?? "—"}</td>
              <td>
                <span className={`badge ${s.status === "success" ? "badge-success" : "badge-error"}`}>
                  {s.status}
                </span>
              </td>
              <td>{new Date(s.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
