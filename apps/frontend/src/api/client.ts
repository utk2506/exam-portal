const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

type RequestOptions = RequestInit & {
  bodyJson?: unknown;
};

// Custom error class that carries the HTTP status code so route guards can
// redirect precisely (e.g. 404 → /exam, 409 already-submitted → /result).
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.bodyJson ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {})
    },
    body: options.bodyJson ? JSON.stringify(options.bodyJson) : options.body
  });

  if (!response.ok) {
    const fallback = await response.text();
    let message = fallback || "Request failed";

    try {
      const parsed = JSON.parse(fallback) as { message?: string };
      message = parsed.message ?? message;
    } catch {
      // ignore parse failures and keep the raw text fallback
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, bodyJson?: unknown) =>
    request<T>(path, {
      method: "POST",
      bodyJson
    }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: "POST",
      body: formData
    }),
  put: <T>(path: string, bodyJson?: unknown) =>
    request<T>(path, {
      method: "PUT",
      bodyJson
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE"
    })
};


export { API_BASE };
