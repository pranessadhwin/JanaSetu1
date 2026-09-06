/**
 * Core API client + session helpers shared by every page.
 * Backend returns { success, message, data, timestamp } for all JSON endpoints.
 */
const API_BASE = "/api";
const SESSION_KEY = "jansetu_session";

const Session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  },
  set(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
  isAuthenticated() {
    return !!Session.get()?.token;
  },
  role() {
    return Session.get()?.role || null;
  },
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Low level fetch wrapper. Attaches the JWT bearer token when present and
 * unwraps the backend's ApiResponse envelope. Throws ApiError on failure.
 */
async function apiFetch(path, { method = "GET", body, isForm = false, headers = {} } = {}) {
  const session = Session.get();
  const finalHeaders = { ...headers };
  if (session?.token) {
    finalHeaders["Authorization"] = `Bearer ${session.token}`;
  }
  if (body && !isForm) {
    finalHeaders["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkError) {
    throw new ApiError("Could not reach the server. Please try again.", 0);
  }

  if (response.status === 401) {
    Session.clear();
  }

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload ? payload.data : null;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
}

/**
 * Converts a backend enum-style string (e.g. "URBAN_INFRASTRUCTURE",
 * "IN_PROGRESS") into a friendly display label (e.g. "Urban Infrastructure",
 * "In Progress"). Falls back to a dash for empty values.
 */
function formatEnum(value) {
  if (!value) return "-";
  return value
    .toString()
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function showAlert(container, message, type = "error") {
  if (!container) return;
  container.innerHTML = `<div class="alert ${type}">${escapeHtml(message)}</div>`;
}

function clearAlert(container) {
  if (container) container.innerHTML = "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function requireAuth(allowedRoles) {
  const session = Session.get();
  if (!session?.token) {
    window.location.href = "login.html";
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}
