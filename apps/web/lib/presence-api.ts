const API_URL = process.env.PRESENCE_API_URL || "http://localhost:3001"

async function get<T = unknown>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/presences${path}`)
  if (!res.ok) return null
  return res.json() as Promise<T>
}

async function post<T = unknown>(path: string, body?: unknown): Promise<T | null> {
  const res = await fetch(`${API_URL}/presences${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) return null
  return res.json() as Promise<T>
}

async function put<T = unknown>(path: string, body?: unknown): Promise<T | null> {
  const res = await fetch(`${API_URL}/presences${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) return null
  return res.json() as Promise<T>
}

export const presenceApi = { get, post, put }
