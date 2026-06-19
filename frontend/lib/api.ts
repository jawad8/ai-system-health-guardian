export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getJSON<T = any>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
  return response.json();
}

export async function postJSON<T = any>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
  return response.json();
}

export function fmtDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}
