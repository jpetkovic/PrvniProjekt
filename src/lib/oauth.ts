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
  // Locality of the actual incoming request.
  const headers = request.headers;
  const host =
    headers.get("x-forwarded-host") ??
    headers.get("host") ??
    new URL(request.url).host;
  const requestIsLocal = isLocalHost(host);

  // 1) Explicit override — but only when its locality matches the request's.
  //    This stops a leftover NEXT_PUBLIC_BASE_URL="http://localhost:3000" from
  //    hijacking the redirect URI in production (it would cause the browser to
  //    be sent to localhost after the Google consent screen — ERR_CONNECTION_
  //    REFUSED). Same guard the other way for local dev.
  const configuredRaw = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configuredRaw) {
    const configured = forceHttps(configuredRaw.replace(/\/+$/, ""));
    if (isLocalHost(hostOf(configured)) === requestIsLocal) return configured;
  }

  // 2) Otherwise derive from the incoming request headers.
  if (requestIsLocal) {
    const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "http";
    return `${proto}://${host}`;
  }
  return `https://${host}`;
}

function isLocalHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

/** Extract the host[:port] from a URL string, tolerating a missing scheme. */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^[a-z]+:\/\//i, "").replace(/\/.*$/, "");
  }
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
