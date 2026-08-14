/**
 * Base URL of the application used to build the Google OAuth redirect URI.
 *
 * Google requires the redirect URI to use HTTPS for every host except
 * `localhost`/`127.0.0.1`. We therefore force the `https://` scheme for any
 * non-local host, no matter how the request arrived — behind a TLS-terminating
 * proxy (e.g. Vercel) the original scheme comes in via `x-forwarded-proto`,
 * which we deliberately ignore for non-local hosts so the callback URL always
 * matches the HTTPS URI registered in the Google Cloud Console.
 */
export function getBaseUrl(request: Request): string {
  // 1) Explicit override wins — set this to your HTTPS domain in production.
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return forceHttps(configured.replace(/\/+$/, ""));

  // 2) Otherwise derive from the incoming request headers.
  const headers = request.headers;
  const host =
    headers.get("x-forwarded-host") ??
    headers.get("host") ??
    new URL(request.url).host;

  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (isLocal) {
    const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "http";
    return `${proto}://${host}`;
  }
  return `https://${host}`;
}

/** Upgrade a plain-HTTP URL to HTTPS unless it points at localhost. */
function forceHttps(url: string): string {
  if (/^https:\/\//i.test(url)) return url;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) return url;
  return url.replace(/^http:\/\//i, "https://");
}

export function googleRedirectUri(request: Request): string {
  return `${getBaseUrl(request)}/api/auth/google/callback`;
}
