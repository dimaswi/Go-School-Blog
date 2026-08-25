const LEGACY_BACKEND_ORIGIN = "http://localhost:8080"
const LEGACY_API_BASE = `${LEGACY_BACKEND_ORIGIN}/api`

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function getWindowPort() {
  if (typeof window === "undefined") return ""
  return window.location.port
}

function isLocalDevServer() {
  if (typeof window === "undefined") return false
  const { hostname, port } = window.location
  return (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1") && port === "5173"
}

export function getApiBase() {
  const envApiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL
  if (envApiBase) return trimTrailingSlash(envApiBase)
  if (isLocalDevServer()) return LEGACY_API_BASE
  return "/api"
}

export function getTenantUrl(subdomain: string) {
  if (typeof window === "undefined") return `http://${subdomain}.localhost:5173`;
  const host = window.location.host;
  const protocol = window.location.protocol;

  // Handle localhost scenarios
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    const baseHost = host.replace(/^[^.]+\./, ""); // e.g. admin.localhost:5173 -> localhost:5173
    return `${protocol}//${subdomain}.${baseHost.includes("localhost") ? baseHost : "localhost:5173"}`;
  }

  // Handle production domain scenarios
  const parts = host.split('.');
  // If we are already on a subdomain (e.g. admin.literasidigital.com), strip it to get the base domain
  // If we are on the root domain (e.g. literasidigital.com), don't strip anything
  const baseHost = parts.length > 2 && parts[0] !== 'www' ? host.replace(/^[^.]+\./, "") : host;

  return `${protocol}//${subdomain}.${baseHost}`;
}

export function getAssetBase() {
  const envAssetBase = import.meta.env.VITE_ASSET_BASE
  if (envAssetBase) return trimTrailingSlash(envAssetBase)
  if (isLocalDevServer()) return LEGACY_BACKEND_ORIGIN
  if (typeof window === "undefined") return ""
  if (getWindowPort() === "5176") return ""
  return ""
}

export function rewriteBackendUrl(url: string) {
  if (!url) return url

  if (url === LEGACY_API_BASE || url.startsWith(`${LEGACY_API_BASE}/`)) {
    return url.replace(LEGACY_API_BASE, getApiBase())
  }

  if (url === LEGACY_BACKEND_ORIGIN || url.startsWith(`${LEGACY_BACKEND_ORIGIN}/`)) {
    return url.replace(LEGACY_BACKEND_ORIGIN, getAssetBase())
  }

  return url
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) return ""
  if (path.startsWith("https://")) return path
  if (path.startsWith("http://") && !path.startsWith(LEGACY_BACKEND_ORIGIN)) return path

  const normalizedPath = path.startsWith(LEGACY_BACKEND_ORIGIN)
    ? path.replace(LEGACY_BACKEND_ORIGIN, "")
    : path
  const assetBase = getAssetBase()

  if (!assetBase) return normalizedPath
  if (normalizedPath.startsWith("/")) return `${assetBase}${normalizedPath}`
  return `${assetBase}/${normalizedPath}`
}

export function normalizeRichTextHtml(html?: string | null) {
  if (!html) return ""
  return html.replaceAll(LEGACY_BACKEND_ORIGIN, getAssetBase())
}