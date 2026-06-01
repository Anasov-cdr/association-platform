FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci --workspace apps/backend

COPY apps/backend ./apps/backend

RUN npm --workspace apps/backend run prisma:generate

WORKDIR /app/apps/backend

RUN mkdir -p uploads/images uploads/documents uploads/cv uploads/logos uploads/misc backups data

EXPOSE 4000

CMD ["node", "src/server.js"]
