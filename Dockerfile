# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

ENV NODE_ENV=production
RUN npm run postinstall && npm run build

# Demo SQLite baked at build time (runtime seed needs full repo + tsx)
ENV DATABASE_URL=file:./prisma/dev.db
RUN npx prisma db push && npx prisma db seed

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY --from=build /app/prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci --omit=dev --ignore-scripts && npx prisma generate

COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma/dev.db ./prisma/demo.db
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
