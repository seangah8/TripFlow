// Centralizes the fetch pattern duplicated across useGenerateTrip.ts/useTrip.ts —
// critically, `credentials: 'include'` on every call, which is now required since
// every trip/auth endpoint reads the httpOnly session cookie the browser won't
// otherwise send cross-origin.
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, import.meta.env.VITE_API_URL);
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Backend always responds with { error: string } — surface that instead of
    // a generic message so the UI can distinguish specific failure reasons.
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Request failed');
  }

  return response.json();
}
