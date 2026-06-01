#!/usr/bin/env sh
set -eu

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./scripts/deploy-production.sh bfetassociation.kg admin@bfetassociation.kg"
  exit 1
fi

ENV_FILE="./apps/backend/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Create it from apps/backend/.env.production.example first."
  exit 1
fi

export DOMAIN
export VITE_API_URL="https://${DOMAIN}/api"
export VITE_SITE_URL="https://${DOMAIN}"

if grep -E 'YOUR_DOMAIN|REPLACE_WITH|your_app_password|your@gmail.com' "$ENV_FILE" >/dev/null; then
  echo "$ENV_FILE still contains placeholders. Fill real production values first."
  exit 1
fi

if [ ! -d "nginx/templates" ]; then
  echo "Run this script from the repository root."
  exit 1
fi

./scripts/generate-seo-files.sh "$DOMAIN"

TEMP_HTTP_TEMPLATE=0
restore_ssl_template() {
  if [ "$TEMP_HTTP_TEMPLATE" = "1" ] && [ -f nginx/templates/default.conf.template.ssl ]; then
    rm -f nginx/templates/default.conf.template
    mv nginx/templates/default.conf.template.ssl nginx/templates/default.conf.template
  fi
}
trap restore_ssl_template EXIT INT TERM

CERT_EXISTS="$(docker run --rm -v smartordo_certbot_certs:/etc/letsencrypt alpine \
  sh -c "test -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem" >/dev/null 2>&1 && echo yes || true)"

if [ "$CERT_EXISTS" != "yes" ]; then
  echo "Starting temporary HTTP nginx for first certificate issue..."
  mv nginx/templates/default.conf.template nginx/templates/default.conf.template.ssl
  cp nginx/templates/http-only.conf.template.disabled nginx/templates/default.conf.template
  TEMP_HTTP_TEMPLATE=1
  docker compose -f docker-compose.prod.yml up -d --build postgres backend frontend nginx

  echo "Issuing Let's Encrypt certificate for ${DOMAIN} and www.${DOMAIN}..."
  docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "www.${DOMAIN}"

  restore_ssl_template
  TEMP_HTTP_TEMPLATE=0
fi

echo "Starting production stack..."
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
