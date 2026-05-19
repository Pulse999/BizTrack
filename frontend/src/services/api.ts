// frontend/src/services/api.ts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Build request headers, including Authorization token.
 */
function buildHeaders(isFormData: boolean = false): Record<string, string> {
  const token = localStorage.getItem("lt_token");
  const headers: Record<string, string> = {};

  // Only set content-type if NOT form-data
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Try to parse JSON, otherwise return raw text.
 */
async function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Unified response handler
 * - supports empty body
 * - parses JSON or text
 * - auto-removes expired token
 */
async function handleResponse(res: Response) {
  const raw = await res.text();
  const data = raw ? await safeParse(raw) : {};

  if (!res.ok) {
    console.error(`API error ${res.status}:`, data);

    // Auto-logout on invalid/expired token
    if (res.status === 403 && typeof data === "string" && data.includes("Invalid or expired token")) {
      localStorage.removeItem("lt_token");
    }

    throw new Error(`Request failed: ${res.status}`);
  }

  return data;
}

/* ---------------------------------------------------------------------- */
/*                                GET                                      */
/* ---------------------------------------------------------------------- */
export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(false),
  });
  return handleResponse(res);
}

/* ---------------------------------------------------------------------- */
/*                               POST                                      */
/* ---------------------------------------------------------------------- */
export async function apiPost(path: string, body: any = {}, _auth: boolean = true) {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(isFormData),
    body: isFormData ? body : JSON.stringify(body),
  });

  return handleResponse(res);
}

/* ---------------------------------------------------------------------- */
/*                               PATCH                                     */
/* ---------------------------------------------------------------------- */
export async function apiPatch(path: string, body: any = {}) {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: buildHeaders(isFormData),
    body: isFormData ? body : JSON.stringify(body),
  });

  return handleResponse(res);
}

/* ---------------------------------------------------------------------- */
/*                              DELETE                                     */
/* ---------------------------------------------------------------------- */
export async function apiDelete(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(false),
  });

  return handleResponse(res);
}
