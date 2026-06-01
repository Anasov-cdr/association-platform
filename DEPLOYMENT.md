# Production Deployment

## 1. DNS

Point these DNS records to the server IP:

- `A bfetassociation.kg -> SERVER_IP`
- `A www.bfetassociation.kg -> SERVER_IP`

Wait until DNS resolves before issuing SSL.

## 2. Server prerequisites

Install Docker Engine and Docker Compose Plugin on the server.

Open ports `80` and `443` in the hosting firewall.

## 3. Environment

Create the production backend env file:

```sh
cp apps/backend/.env.production.example apps/backend/.env.production
```

Edit:

- `CLIENT_ORIGIN=https://bfetassociation.kg`
- `POSTGRES_PASSWORD`
- `DATABASE_URL` with the same password and host `postgres`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- SMTP settings, if email delivery is required

Generate JWT secrets:

```sh
openssl rand -hex 64
openssl rand -hex 64
```

## 4. Deploy

From the repository root on the server:

```sh
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh bfetassociation.kg admin@bfetassociation.kg
```

The script:

- builds backend and frontend Docker images from the monorepo lockfile
- starts PostgreSQL
- runs Prisma migrations before the API starts
- generates `robots.txt` and `sitemap.xml` for the domain
- issues the first Let's Encrypt certificate
- restarts nginx with HTTPS enabled
- starts automatic certificate renewal

## 5. Verify

```sh
docker compose -f docker-compose.prod.yml ps
curl -I https://bfetassociation.kg
curl https://bfetassociation.kg/api/health
```

## 6. Useful operations

View logs:

```sh
docker compose -f docker-compose.prod.yml logs -f backend nginx
```

Restart after code updates:

```sh
DOMAIN=bfetassociation.kg VITE_API_URL=https://bfetassociation.kg/api docker compose -f docker-compose.prod.yml up -d --build
```

Backup persistent Docker volumes before destructive maintenance.
