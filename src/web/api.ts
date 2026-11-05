import type { Interest, ScoredVideo, Signal, SignalKind } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function listInterests(): Promise<Interest[]> {
  return request<Interest[]>("/interests");
}

export function createInterest(label: string): Promise<Interest> {
  return request<Interest>("/interests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label }),
  });
}

export function updateInterest(
  id: string,
  patch: { label?: string; weight?: number },
): Promise<Interest> {
  return request<Interest>(`/interests/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function deleteInterest(id: string): Promise<void> {
  return request<void>(`/interests/${id}`, { method: "DELETE" });
}

export function listRankings(): Promise<ScoredVideo[]> {
  return request<ScoredVideo[]>("/rankings");
}

export function listSignals(): Promise<Signal[]> {
  return request<Signal[]>("/signals");
}

export function recordSignal(
  videoId: string,
  kind: SignalKind,
): Promise<Signal> {
  return request<Signal>("/signals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId, kind }),
  });
}

export function flipSignal(id: string): Promise<Signal> {
  return request<Signal>(`/signals/${id}/flip`, { method: "POST" });
}
