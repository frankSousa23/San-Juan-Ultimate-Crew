FROM node:18-alpine AS builder

WORKDIR /app

# Copy all package manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy entire source
COPY . .

# Generate Prisma Client
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
RUN cd apps/api && npx prisma generate

# Build frontend and server
RUN npm run build

# Production runtime stage
FROM node:18-slim

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install production dependencies
RUN npm ci --omit=dev

# Copy compiled assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/apps/api/uploads

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server.cjs"]
