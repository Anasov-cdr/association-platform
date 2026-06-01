#!/usr/bin/env sh
set -eu

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: ./scripts/generate-seo-files.sh bfetassociation.kg"
  exit 1
fi

SITE_URL="https://${DOMAIN}"
PUBLIC_DIR="apps/frontend/public"

cat > "${PUBLIC_DIR}/robots.txt" <<EOF
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
EOF

cat > "${PUBLIC_DIR}/sitemap.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/alumni</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/news</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/events</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/jobs</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/mentorship</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/companies</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/donations</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE_URL}/documents</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>
EOF
