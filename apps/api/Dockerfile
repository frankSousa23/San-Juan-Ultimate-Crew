FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci --workspace apps/api

# Copy source code
COPY apps/api ./apps/api
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Build the application
RUN cd apps/api && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies only
RUN npm ci --workspace apps/api --omit=dev

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/index.js"]

