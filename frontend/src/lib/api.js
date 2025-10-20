// frontend/src/lib/api.js
import axios from "axios";

/* ---------- Safe token getter ---------- */
function safeGetToken() {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

/* ---------- Ensure single `/api` suffix on base ---------- */
function withApiBase(url) {
  const base = (url || "http://localhost:8080").replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const baseURL = withApiBase(import.meta.env.VITE_API_BASE);

/* ---------- Axios instance ---------- */
const api = axios.create({
  baseURL,
  withCredentials: true, // send cookies if server uses them
});

/* ---------- Request interceptor: attach Bearer ---------- */
api.interceptors.request.use((config) => {
  const token = safeGetToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Default JSON headers if not present
  config.headers = { "Content-Type": "application/json", ...(config.headers || {}) };
  return config;
});

/* ---------- Response interceptor: auto logout on 401 ---------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("me");
      } catch {}
      // Optional: redirect to signin
      // window.location.href = "/signin";
    }
    return Promise.reject(err);
  }
);

export default api;
export { api };

/* ---------- REST helpers (axios-based) ---------- */
// Problems & leaderboard
export const listProblems       = () => api.get("/problems");
export const getProblem         = (idOrSlug) => api.get(`/problems/${encodeURIComponent(idOrSlug)}`);
export const getProblemDetail   = (idOrSlug) => api.get(`/problemDetail/${encodeURIComponent(idOrSlug)}`);
export const getLeaderboard     = (limit = 50) => api.get(`/leaderboard?limit=${limit}`);

// Users & badges
export const getUser            = (id) => api.get(`/user/${id}`);
export const updateMe           = (payload) => api.patch("/user/me", payload);
export const getUserBadges      = (id) => api.get(`/userBadges/${id}`);

// Auth
export const signIn             = (payload) => api.post("/auth/signin", payload);
export const signUp             = (payload) => api.post("/auth/signup", payload);
export const getMe              = () => api.get("/auth/me");

// Run code (console)
export const runCode            = ({ language, code, input = "" }) =>
  api.post("/run", { language, code, input });

// Judge submit (awards XP on first AC) — uses /api/submit
export const submitSolution     = ({ user_id, problem_id, language, code }) =>
  api.post("/submit", { user_id, problem_id, language, code });

// Legacy direct submissions insert (no judge)
export const createSubmission   = ({ user_id, problem_id, language, code, status, output, error }) =>
  api.post("/submissions", { user_id, problem_id, language, code, status, output, error });

// Recent submissions by user
export const getUserSubs        = (id, limit = 10) =>
  api.get(`/submissions/user/${id}?limit=${limit}`);

// Alias maintained for compatibility with older calls
export const getUserSubmissions = (userId, limit = 10) => getUserSubs(userId, limit);
