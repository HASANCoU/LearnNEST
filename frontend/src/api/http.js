import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("ln_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
