/**
 * Client helper: returns proxy URL for images from our Spaces CDN
 * so the browser loads them via our backend. Uses the same env var
 * as the server (NEXT_PUBLIC_DO_SPACES_CDN_ENDPOINT or DO_SPACES_CDN_ENDPOINT);
 * only NEXT_PUBLIC_* is available in the browser.
 */
export function getProxiedImageUrlForDisplay(
  url: string | null | undefined
): string | null {
  if (url == null || typeof url !== "string" || !url.trim()) return null;
  const raw =
    process.env.NEXT_PUBLIC_DO_SPACES_CDN_ENDPOINT ??
    process.env.DO_SPACES_CDN_ENDPOINT;
  const base = raw?.trim();
  if (!base) return url;
  const normalized = base.replace(/\/$/, "");
  const withProtocol =
    normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `https://${normalized}`;
  const trimmed = url.trim();
  if (!trimmed.startsWith(withProtocol)) return url;
  return `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;
}
