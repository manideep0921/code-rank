// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";

export default function Profile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr("");
    setData(null);

    (async () => {
      try {
        const r = await api.get(`/profile/${encodeURIComponent(id)}`);
        if (!ignore) setData(r.data);
      } catch (e) {
        if (!ignore) setErr(e?.response?.data?.error || e.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [id]);

  if (loading) return <div className="p-8 text-zinc-400">Loading profile…</div>;
  if (err) {
    return (
      <div className="p-8">
        <div className="text-red-400 mb-2">Error</div>
        <pre className="text-sm text-red-400">{String(err)}</pre>
      </div>
    );
  }
  if (!data) return <div className="p-8 text-zinc-400">Profile not found.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 text-zinc-300">
      {/* Header */}
      <div className="flex gap-4 items-center">
        {data.avatar_url ? (
          <img
            src={data.avatar_url}
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover bg-zinc-800"
          />
        ) : (
          <img
            src="/avatar-placeholder.png"
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover bg-zinc-800"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {data.full_name || data.username}
          </h1>
          <div className="text-zinc-500">
            Level {data.level} • {data.xp} XP
          </div>
          {data.location && <div className="text-zinc-400">{data.location}</div>}
        </div>
      </div>

      {/* Bio */}
      {data.bio && <p className="text-zinc-400">{data.bio}</p>}

      {/* Website */}
      {data.website && (
        <a
          href={data.website}
          target="_blank"
          rel="noreferrer"
          className="text-violet-400 underline"
        >
          {data.website}
        </a>
      )}

      {/* Badges */}
      <div>
        <h2 className="font-medium mb-2">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {data.badges?.length ? (
            data.badges.map((b) => (
              <span
                key={b.id}
                className="px-3 py-1 rounded-full border border-zinc-700 text-sm"
                title={b.description || b.name}
              >
                {b.icon ? (
                  <img
                    src={b.icon}
                    alt=""
                    className="inline h-4 w-4 mr-1 align-[-2px]"
                  />
                ) : null}
                {b.name}
              </span>
            ))
          ) : (
            <span className="text-zinc-500">No badges yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}
