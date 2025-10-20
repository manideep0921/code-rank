// src/pages/Account.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import XPSparkline from "../components/XPSparkline";

export default function Account() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // profile form
  const [form, setForm] = useState({
    avatarUrl: "",
    fullName: "",
    bio: "",
    location: "",
    website: "",
  });

  // notes
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  // stats (xp sparkline + totals)
  const [stats, setStats] = useState(null);

  const meId = useMemo(() => me?.id, [me]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr("");

    (async () => {
      try {
        // Profile (includes badges and profile fields)
        const r = await api.get("/profile/me");
        if (ignore) return;
        const data = r.data || {};
        setMe(data);
        setForm({
          avatarUrl: data.avatar_url || "",
          fullName: data.full_name || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
        });

        // Notes
        const n = await api.get("/notes/me");
        if (ignore) return;
        setNotes(n.data || []);

        // Stats for sparkline + summary
        const s = await api.get(`/profile/stats/${data.id}`);
        if (ignore) return;
        setStats(s.data || null);
      } catch (e) {
        if (ignore) return;
        setErr(e?.response?.data?.error || e?.message || "Failed to load account");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, []);

  async function save() {
    setSaving(true);
    setErr("");
    try {
      await api.patch("/profile/me", form);
      // refresh to reflect normalized backend shape
      const r = await api.get("/profile/me");
      setMe(r.data);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    const content = note.trim();
    if (!content) return;
    setAddingNote(true);
    setErr("");
    try {
      const r = await api.post("/notes", { content });
      setNotes((prev) => [r.data, ...(prev || [])]);
      setNote("");
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Add note failed");
    } finally {
      setAddingNote(false);
    }
  }

  async function delNote(id) {
    setErr("");
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => (prev || []).filter((n) => n.id !== id));
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Delete note failed");
    }
  }

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading account…</div>;
  }
  if (err) {
    return (
      <div className="p-8">
        <div className="text-red-400 mb-2">Error</div>
        <pre className="text-sm text-red-400">{String(err)}</pre>
      </div>
    );
  }
  if (!me) {
    return <div className="p-8 text-zinc-400">No account data.</div>;
  }

  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto text-zinc-300">
      <h1 className="text-2xl font-semibold text-white">My Account</h1>

      {/* Header + Quick Info */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="flex items-center gap-4">
          <img
            src={form.avatarUrl || me.avatar_url || "/avatar-placeholder.png"}
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover bg-zinc-800"
          />
          <div>
            <div className="text-xl">{me.username}</div>
            <div className="text-zinc-500">{me.email}</div>
            <div className="text-sm mt-1">Level {me.level} • {me.xp} XP</div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="space-y-2">
          <input
            className="w-full bg-zinc-900 p-2 rounded border border-zinc-800"
            placeholder="Avatar URL"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />
          <input
            className="w-full bg-zinc-900 p-2 rounded border border-zinc-800"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <input
            className="w-full bg-zinc-900 p-2 rounded border border-zinc-800"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <input
            className="w-full bg-zinc-900 p-2 rounded border border-zinc-800"
            placeholder="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
          <textarea
            className="w-full bg-zinc-900 p-2 rounded border border-zinc-800"
            rows={3}
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-2 rounded bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </section>

      {/* XP Progress */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">XP Progress</h2>
        <XPSparkline data={stats?.xp || []} />
        <div className="text-sm text-zinc-400">
          Submissions: <b>{stats?.totals?.total_submissions ?? 0}</b> • Accepted:{" "}
          <b>{stats?.totals?.accepted ?? 0}</b> • Failed:{" "}
          <b>{stats?.totals?.failed ?? 0}</b> • Problems Solved:{" "}
          <b>{stats?.totals?.problems_solved ?? 0}</b>
        </div>
      </section>

      {/* Bio Preview */}
      <section>
        <h2 className="font-medium mb-2">Bio</h2>
        <p className="text-zinc-400">
          {me.bio ?? form.bio ? (form.bio || me.bio) : "No bio added yet."}
        </p>
      </section>

      {/* Badges */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {me.badges?.length ? (
            me.badges.map((b) => (
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
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">My Notes</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-zinc-900 p-2 rounded border border-zinc-800"
            placeholder="Add a note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
            onClick={addNote}
            disabled={addingNote}
          >
            {addingNote ? "Adding…" : "Add"}
          </button>
        </div>
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="p-3 border border-zinc-800 rounded flex justify-between"
            >
              <div>
                <div>{n.content}</div>
                <div className="text-xs text-zinc-500">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                </div>
              </div>
              <button
                className="text-red-400 hover:text-red-300"
                onClick={() => delNote(n.id)}
                title="Delete note"
              >
                Delete
              </button>
            </li>
          ))}
          {!notes.length && (
            <li className="text-zinc-500">No notes yet. Add your first!</li>
          )}
        </ul>
      </section>
    </div>
  );
}
