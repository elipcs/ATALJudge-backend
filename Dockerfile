FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# Install dependencies (including devDependencies for tsc)
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
# Install only production dependencies
RUN npm ci --production
EXPOSE 3333
CMD ["node", "dist/app.js"]
