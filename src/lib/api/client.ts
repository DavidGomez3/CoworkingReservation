import { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "dev-key";
const USE_FAKE = (import.meta.env.VITE_USE_FAKE_API ?? "true") === "true";

export type HttpMethod = "GET" | "POST" | "DELETE";

export async function http<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new ApiError(`HTTP ${res.status} en ${path}`, res.status, data);
  }
  return (await res.json()) as T;
}

export const env = { BASE_URL, API_KEY, USE_FAKE };

