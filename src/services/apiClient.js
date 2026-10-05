import { buildApiUrl } from "./apiConfig";

const tokenKeys = { user: "token", business: "businessToken", admin: "adminToken" };

export async function apiRequest(path, { method = "GET", role, body, query, headers = {}, signal, idempotent = false, root = false } = {}) {
  if (root && !process.env.APP_URL) return { success: false, message: "Missing API base URL. Set APP_URL in .env.local." };
  const requestUrl = root
    ? `${process.env.APP_URL?.replace(/\/$/, "") || ""}${path}`
    : buildApiUrl(path);
  if (!requestUrl) return { success: false, message: "Missing API base URL. Set APP_URL in .env.local." };
  const url = new URL(requestUrl, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (query) Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const requestHeaders = new Headers(headers);
  const tokenKey = tokenKeys[role];
  const token = tokenKey && typeof localStorage !== "undefined" ? localStorage.getItem(tokenKey) : null;
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  if (idempotent && !requestHeaders.has("Idempotency-Key")) requestHeaders.set("Idempotency-Key", crypto.randomUUID());

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData || typeof body === "string" ? body : JSON.stringify(body),
      signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, status: response.status, message: payload.message || payload.error || `Request failed (${response.status})`, data: payload };
    return { success: true, status: response.status, data: payload.data ?? payload };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Network request failed." };
  }
}

export const resource = (path, role) => ({
  list: (query) => apiRequest(path, { role, query }),
  get: (id, suffix = "") => apiRequest(`${path}/${encodeURIComponent(id)}${suffix}`, { role }),
  create: (body, options = {}) => apiRequest(path, { method: "POST", role, body, ...options }),
  update: (id, body, options = {}) => apiRequest(`${path}/${encodeURIComponent(id)}`, { method: "PUT", role, body, ...options }),
  patch: (id, body, options = {}) => apiRequest(`${path}/${encodeURIComponent(id)}`, { method: "PATCH", role, body, ...options }),
  remove: (id) => apiRequest(`${path}/${encodeURIComponent(id)}`, { method: "DELETE", role }),
});
