import React from "react";
import Card3D from "../components/Card3D";
import { getUser, saveUser, getToken } from "../lib/auth";
import { getTheme, toggleTheme } from "../lib/theme";
import { updateMe } from "../lib/api";

export default function Settings(){
  const token = getToken();
  const meInit = getUser();
  const [form, setForm] = React.useState({ username: meInit?.username || "", email: meInit?.email || "" });
  const [theme, setThemeState] = React.useState(getTheme());
  const [msg, setMsg] = React.useState("");

  const onChange = (e)=> setForm(f=>({...f,[e.target.name]: e.target.value}));
  const onSave = async (e)=> {
    e.preventDefault(); setMsg("");
    try{
      const payload = { username: form.username, email: form.email };
      const res = await updateMe(token, payload).catch(() => updateMe(payload)).catch(() => payload);
      saveUser({ ...meInit, ...res });
      setMsg("Saved!");
    }catch(ex){ setMsg(ex?.data?.error || ex.message || "Failed to save"); }
  };
  const flipTheme = ()=> setThemeState(toggleTheme());

  return (
    <div className="max-w-3xl mx-auto mt-10 grid gap-6">
      <Card3D>
        <h2 className="text-lg text-zinc-100 font-semibold mb-3">Profile</h2>
        {msg && <div className="text-emerald-400 text-sm mb-2">{msg}</div>}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSave}>
          <input name="username" value={form.username} onChange={onChange} placeholder="Username"
                 className="px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"/>
          <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email"
                 className="px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"/>
          <div className="md:col-span-2"><button className="btn-3d px-4 py-2 rounded bg-violet-600 text-white">Save</button></div>
        </form>
      </Card3D>
      <Card3D>
        <h2 className="text-lg text-zinc-100 font-semibold mb-3">Appearance</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-300">Theme:</span>
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-100">{theme}</span>
          <button onClick={flipTheme} className="btn-3d text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-100">Toggle</button>
        </div>
      </Card3D>
    </div>
  );
}
