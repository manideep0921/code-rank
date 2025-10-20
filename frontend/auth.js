// Lightweight auth utilities (localStorage-based)

const TOKEN_KEY = "token";
const USER_KEY = "user";

// Save & read token
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Save & read user (optional shape: { id, username, email, ... })
export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
}
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthed() {
  return Boolean(getToken());
}

export function logout() {
  clearToken();
  localStorage.removeItem(USER_KEY);
}

export default {
  saveToken,
  getToken,
  clearToken,
  saveUser,
  getUser,
  isAuthed,
  logout,
};
