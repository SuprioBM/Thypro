/** Cheap, dependency-free check (no network, no Supabase code): does this browser hold an account session or a returning sign-in link? */
export function hasStoredSession(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('code')) return true;
    return Object.keys(window.localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
  } catch {
    return false;
  }
}
