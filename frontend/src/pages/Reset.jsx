// src/pages/Reset.jsx
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Reset() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(sp.get("token") || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(""); setErr(""); setLoading(true);
    try {
      const r = await api.post("/auth/reset", { token, new_password: password });
      setMsg(r?.data?.message || "Password reset successful");
      setTimeout(() => nav("/signin"), 1000);
    } catch (ex) {
      setErr(ex?.response?.data?.error || ex?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-24 space-y-3">
      <h2 className="text-xl font-semibold">Set a new password</h2>

      {err && <div className="text-rose-400 text-sm">{err}</div>}
      {msg && <div className="text-green-400 text-sm">{msg}</div>}

      <input
        className="w-full input"
        placeholder="Reset token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        required
      />
      <div className="relative">
        <input
          className="w-full input pr-16"
          type={showPass ? "text" : "password"}
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPass((s) => !s)}
          className="absolute right-3 top-2 text-xs text-zinc-400"
        >
          {showPass ? "Hide" : "Show"}
        </button>
      </div>

      <button className="btn w-full" disabled={loading}>
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
