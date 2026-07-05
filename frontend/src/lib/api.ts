// Centralized fetch wrapper — critically, `credentials: 'include'` on every call,
// required since every endpoint reads the httpOnly session cookie.
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, import.meta.env.VITE_API_URL);
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    // fetch() itself throws when the request never gets an HTTP response at all — server
    // down, no connectivity, CORS block — as a browser TypeError ("Failed to fetch"). That
    // message is browser-internal jargon, not something a user reading it can act on.
    throw new Error('Sorry something went wrong, please try again in a few minutes.');
  }

  if (!response.ok) {
    // Backend always responds with { error: string } — surface that instead of
    // a generic message so the UI can distinguish specific failure reasons.
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Request failed');
  }

  // DELETE endpoints respond 204 No Content — .json() would throw on the empty
  // body, so there's nothing to parse for those callers (T is void there).
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
