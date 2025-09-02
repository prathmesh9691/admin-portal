const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiJson<T>(path: string, options: { method?: HttpMethod; body?: any; headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const cloned = res.clone();
      const ct = cloned.headers.get("content-type") || "";
      message = ct.includes("application/json") ? JSON.stringify(await cloned.json()) : await cloned.text();
    } catch {
      // ignore and use default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiFormData<T>(path: string, formData: FormData, options: { method?: HttpMethod; headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "POST",
    headers: {
      ...(options.headers || {}),
    },
    body: formData,
  });
  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const cloned = res.clone();
      const ct = cloned.headers.get("content-type") || "";
      message = ct.includes("application/json") ? JSON.stringify(await cloned.json()) : await cloned.text();
    } catch {
      // ignore and use default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
