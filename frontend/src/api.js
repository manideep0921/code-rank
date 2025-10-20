import { getToken, logout } from "./auth.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

async function request(method, path, body, opts = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (body != null && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body == null || body instanceof FormData ? body : JSON.stringify(body),
    credentials: "include",
    ...opts,
  });

  if (res.status === 401) {
    logout();
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get: (path, opts) => request("GET", path, null, opts),
  post: (path, body, opts) => request("POST", path, body, opts),
  put: (path, body, opts) => request("PUT", path, body, opts),
  patch: (path, body, opts) => request("PATCH", path, body, opts),
  delete: (path, opts) => request("DELETE", path, null, opts),
  baseURL: API_BASE,
};

export default api;
