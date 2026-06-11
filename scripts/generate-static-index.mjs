import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const serverEntryCandidates = [
  resolve("dist/server/server.js"),
  resolve("dist/server/index.js"),
];
let serverEntryPath;
for (const candidate of serverEntryCandidates) {
  try {
    await access(candidate);
    serverEntryPath = candidate;
    break;
  } catch {
    // Try the next output name used by TanStack Start.
  }
}
if (!serverEntryPath) {
  throw new Error("Built server entry not found in dist/server.");
}
const clientDir = resolve("dist/client");
const indexPath = resolve(clientDir, "index.html");
const sitemapPath = resolve(clientDir, "sitemap.xml");
const htaccessPath = resolve(clientDir, ".htaccess");

await mkdir(clientDir, { recursive: true });

// ---------------------------------------------------------------------------
// 1) Generate a CLEAN SHELL index.html — no SSR'd home content.
//
// Background: Hostinger is static hosting with SPA fallback. If we ship an
// SSR'd home-page HTML as the fallback, every deep route (e.g. /contact,
// /dashboard, /auction/.../live) gets served that SAME HTML, then React
// hydrates against the wrong tree → hydration error #418 in the console and
// bad SEO. A neutral shell sidesteps the mismatch: the client takes over
// cleanly on every route.
//
// We still ask the server bundle to render `/` so we can scrape the asset
// tags (script/link) it emitted into <head>, which keeps the build hash
// references in sync with whatever Vite produced this build.
// ---------------------------------------------------------------------------
const serverModule = await import(pathToFileURL(serverEntryPath).href);
const serverEntry = serverModule.default ?? serverModule;

if (typeof serverEntry.fetch !== "function") {
  throw new Error("Built server entry does not expose fetch().");
}

const ssrResponse = await serverEntry.fetch(
  new Request("https://sistemaparaleiloes.site/"),
  {},
  {},
);
if (!ssrResponse.ok) {
  throw new Error(`Failed to render root HTML: ${ssrResponse.status} ${ssrResponse.statusText}`);
}
const ssrHtml = await ssrResponse.text();

// Extract <head> tags (scripts, stylesheets, meta, title) from the SSR output.
const headMatch = ssrHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const headInner = headMatch ? headMatch[1] : "";

const htmlAttrMatch = ssrHtml.match(/<html([^>]*)>/i);
const htmlAttrs = htmlAttrMatch ? htmlAttrMatch[1] : ' lang="pt-BR"';

// We strip the SSR'd home-page content from <body> (that's what was causing
// React hydration error #418 on every deep route) but MUST keep the entry
// module script — without it nothing bootstraps and the page is blank.
//
// We keep:
//   - <script type="module" ...>import("/assets/index-XXXXXX.js")</script>
//     (the Vite entry — runs the client; without SSR markers React falls
//     back to CSR cleanly on every route)
//   - any external CDN <script src="..."> (e.g. Mercado Pago SDK)
// We drop:
//   - the SSR'd DOM tree (caused the route mismatch)
//   - TanStack streaming barrier scripts (class="$tsr") tied to the home
//     route's hydration data
const bodyMatch = ssrHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const bodyInner = bodyMatch ? bodyMatch[1] : "";
const allScripts = bodyInner.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
const keepScripts = allScripts
  .filter((tag) => {
    // KEEP the stream-barrier setup script (defines self.$_TSR / self.$R.tsr) —
    // without it the TanStack client throws "Invariant failed" on boot.
    if (/id=["']\$tsr-stream-barrier["']/.test(tag)) return true;
    // Drop other $tsr streaming chunks (carry home-route hydration data)
    if (/class=["']\$tsr["']/.test(tag)) return false;
    return true;
  })
  .map((tag) => {
    // For the stream-barrier: rewrite ssr:!0 → ssr:!1 so React doesn't
    // try to hydrate against the home-route DOM tree (which isn't in the
    // shell). This kills the residual minified React error #418 on deep
    // routes while leaving the framework setup intact.
    if (/id=["']\$tsr-stream-barrier["']/.test(tag)) {
      return tag.replace(/ssr:!0/g, "ssr:!1");
    }
    return tag;
  });

const shellHtml = `<!DOCTYPE html>
<html${htmlAttrs}>
<head>${headInner}</head>
<body>
  ${keepScripts.join("\n  ")}
</body>
</html>
`;

await writeFile(indexPath, shellHtml, "utf8");
console.log(`Generated ${indexPath} (shell, ${shellHtml.length} bytes)`);

// ---------------------------------------------------------------------------
// 2) Generate sitemap.xml as a REAL static file (not an SPA route).
//
// We hit the server bundle's /sitemap/xml route (and /sitemap.xml as a
// fallback) and persist the response. If the route returns HTML (debug
// viewer), we fall back to a minimal static sitemap so crawlers don't get
// served an app shell.
// ---------------------------------------------------------------------------
const BASE_URL = process.env.SITE_URL || "https://sistemaparaleiloes.site";

async function tryFetchSitemap(path) {
  try {
    const res = await serverEntry.fetch(new Request(`${BASE_URL}${path}`), {}, {});
    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes("<?xml") && text.includes("<urlset")) return text;
    return null;
  } catch {
    return null;
  }
}

let sitemap = (await tryFetchSitemap("/sitemap.xml")) || (await tryFetchSitemap("/sitemap/xml"));

if (!sitemap) {
  // Minimal fallback — better than serving HTML to crawlers.
  const staticPages = ["", "/about", "/contact", "/how-it-works", "/privacy", "/security", "/terms", "/auth", "/live"];
  sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page}</loc>
    <changefreq>${page === "" ? "daily" : "monthly"}</changefreq>
    <priority>${page === "" ? "1.0" : "0.5"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

await writeFile(sitemapPath, sitemap, "utf8");
console.log(`Generated ${sitemapPath} (${sitemap.length} bytes)`);

// ---------------------------------------------------------------------------
// 3) Generate .htaccess with proper Apache rules for Hostinger:
//    - SPA fallback to index.html for unknown routes
//    - Exclude real static assets (xml, svg, jpg, png, ico, js, css, ...)
//    - Long cache for hashed assets
//    - Force HTTPS
// ---------------------------------------------------------------------------
const htaccess = `# Auto-generated by scripts/generate-static-index.mjs
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Do NOT rewrite real files / directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Explicitly skip rewrites for static assets even if the file isn't found
# (lets the browser get a real 404 instead of the app HTML).
RewriteRule \\.(xml|svg|png|jpe?g|gif|webp|ico|css|js|map|woff2?|ttf|otf|eot|txt|json|webmanifest|mp4|webm|pdf)$ - [L]

# SPA fallback — everything else goes to index.html
RewriteRule ^ /index.html [L]

# Caching
<IfModule mod_headers.c>
  # Long cache for hashed assets under /assets/
  <FilesMatch "^.+\\.[0-9a-zA-Z_-]{6,}\\.(js|css|woff2?|ttf|otf|svg|png|jpe?g|webp|gif|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Never cache HTML so deploys take effect immediately
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
  # Sitemap / robots — short cache
  <FilesMatch "(sitemap\\.xml|robots\\.txt)$">
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
</IfModule>

# MIME types Hostinger sometimes misses
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType text/css .css
  AddType image/svg+xml .svg
  AddType application/xml .xml
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json application/xml image/svg+xml
</IfModule>
`;

await writeFile(htaccessPath, htaccess, "utf8");
console.log(`Generated ${htaccessPath} (${htaccess.length} bytes)`);

// The imported server bundle may leave realtime/auth timers open.
// This script has completed all writes, so exit cleanly for CI runners.
process.exit(0);
