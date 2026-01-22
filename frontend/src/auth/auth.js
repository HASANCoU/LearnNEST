export function getToken() {
  return localStorage.getItem("ln_token");
}

export function setToken(token) {
  localStorage.setItem("ln_token", token);
}

export function clearToken() {
  localStorage.removeItem("ln_token");
}

export function getUser() {
  const raw = localStorage.getItem("ln_user");
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  localStorage.setItem("ln_user", JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem("ln_user");
}

export function logout() {
  clearToken();
  clearUser();
}
