// src/pages/Forgot.jsx
import React, { useState } from "react";
import api from "../lib/api";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(""); setErr(""); setLoading(true);
    try {
      const r = await api.post("/auth/forgot", { email });
      // backend returns { ok:true, token? } OR { message: "..."} in your dev variant
      const message =
        r?.data?.message ||
        (r?.data?.ok ? "If the email exists, you'll receive instructions." : "") ||
        "If the email exists, you'll receive instructions.";
      setMsg(message);
    } catch (ex) {
      setErr(ex?.response?.data?.error || ex?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-24 space-y-3">
      <h2 className="text-xl font-semibold">Reset password</h2>

      {err && <div className="text-rose-400 text-sm">{err}</div>}
      {msg && <div className="text-green-400 text-sm">{msg}</div>}

      <input
        className="w-full input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <button className="btn w-full" disabled={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-xs text-zinc-500">
        Dev mode: a reset token is returned by the API or logged on the server.
      </p>
    </form>
  );
}
