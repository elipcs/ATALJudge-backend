# Stage 1: Install production dependencies only
FROM node:18-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Stage 2: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3333

CMD ["./docker-entrypoint.sh"]
