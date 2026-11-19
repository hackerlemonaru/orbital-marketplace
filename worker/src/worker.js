// ORBITAL R2 proxy: public site/previews, free OSS downloads, entitlement-gated premium downloads.
const PAID_PREFIX = "assets/premium/";
const PREVIEW_EXT = new Set([".webp", ".png", ".jpg", ".jpeg", ".svg", ".html", ".css", ".js", ".json", ".md", ".txt", ".xml"]);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Range",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}
function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function hmac(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}
async function sign(env, key, exp) {
  return `${exp}.${b64url(await hmac(env.ASSET_SIGNING_KEY, `${key}:${exp}`))}`;
}
async function verify(env, key, token) {
  const [exp, sig] = (token || "").split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  const n = Number(exp), now = Math.floor(Date.now() / 1000);
  if (n < now || n - now > 900) return false;
  return b64url(await hmac(env.ASSET_SIGNING_KEY, `${key}:${exp}`)) === sig;
}
function ctype(key) {
  const e = key.slice(key.lastIndexOf(".")).toLowerCase();
  return {
    ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
    ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml", ".ktx2": "image/ktx2", ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".lottie": "application/zip",
    ".zip": "application/zip", ".spz": "application/octet-stream", ".sog": "application/octet-stream",
    ".ts": "text/plain; charset=utf-8", ".fbx": "application/octet-stream", ".obj": "text/plain; charset=utf-8",
  }[e] || "application/octet-stream";
}
function safeKey(raw) {
  let k;
  try { k = decodeURIComponent(raw || ""); } catch { return null; }
  k = k.replace(/^\/+/, "");
  if (!k || k.includes("..") || k.includes("\\") || k.includes("\0")) return null;
  return k;
}
function isPreview(key) {
  return key.startsWith("assets/") && PREVIEW_EXT.has(key.slice(key.lastIndexOf(".")).toLowerCase());
}
function isPaid(key) { return key.startsWith(PAID_PREFIX); }
function isFree(key) { return key.startsWith("assets/") && !isPaid(key); }
function siteKey(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  p = p.replace(/^\/+/, "");
  if (!p || p.endsWith("/")) p += "index.html";
  if (p.includes("..") || p.includes("\\") || p.includes("\0")) return null;
  return "site/" + p;
}
async function serve(env, key, req, opts = {}) {
  const obj = await env.ASSETS.get(key);
  if (!obj) return json({ error: "not_found", key }, 404);
  const h = new Headers(CORS);
  h.set("Content-Type", obj.httpMetadata?.contentType || ctype(key));
  h.set("Content-Length", String(obj.size));
  h.set("ETag", obj.etag);
  h.set("Cache-Control", opts.cache || "public, max-age=31536000, immutable");
  h.set("Accept-Ranges", "bytes");
  h.set("X-Content-Type-Options", "nosniff");
  if (obj.uploaded) h.set("Last-Modified", new Date(obj.uploaded).toUTCString());
  if (opts.attachment) h.set("Content-Disposition", `attachment; filename="${key.split("/").pop()}"`);
  return new Response(req.method === "HEAD" ? null : obj.body, { status: 200, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), path = url.pathname;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (path === "/health") return json({
      ok: true, bucket: "jc-bose", site_prefix: "site/", preview: "/preview/<r2-key>",
      download: "/download/<r2-key>", premium_prefix: PAID_PREFIX,
      free_agent_tier: "read-only search/metadata/licence/preview/install snippets",
    });
    if (path === "/sign") {
      if ((request.headers.get("Authorization") || "") !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: "unauthorized" }, 401);
      const key = safeKey(url.searchParams.get("key") || "");
      if (!key || !isPaid(key)) return json({ error: "invalid_key" }, 400);
      const exp = Math.floor(Date.now() / 1000) + 900;
      const token = await sign(env, key, exp);
      return json({ key, exp, token, url: `${url.origin}/download/${encodeURIComponent(key)}?token=${token}` });
    }
    if (path.startsWith("/preview/")) {
      const key = safeKey(path.slice(9));
      if (!key || !isPreview(key)) return json({ error: "preview_not_allowed", key }, 403);
      return serve(env, key, request, { cache: "public, max-age=31536000, immutable" });
    }
    if (path.startsWith("/download/")) {
      const key = safeKey(path.slice(10));
      if (!key) return json({ error: "invalid_key" }, 400);
      if (isPaid(key)) {
        if (!(await verify(env, key, url.searchParams.get("token") || ""))) {
          return json({ error: "entitlement_required", retry_after: 60 }, 402, { "Retry-After": "60" });
        }
        return serve(env, key, request, { cache: "private, max-age=300", attachment: true });
      }
      if (!isFree(key)) return json({ error: "not_found" }, 404);
      return serve(env, key, request, { cache: "public, max-age=86400", attachment: true });
    }
    const key = siteKey(path);
    if (!key) return json({ error: "invalid_path" }, 400);
    return serve(env, key, request, { cache: "public, max-age=3600" });
  },
};
