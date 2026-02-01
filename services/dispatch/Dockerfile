# Multi-stage Dockerfile for RideNDine Dispatch Service

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# If build step needed (uncomment if TypeScript)
# RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Runtime stage
FROM node:20-alpine AS runtime

# Add image metadata
LABEL maintainer="RideNDine DevOps <devops@ridendine.com>" \
      version="1.0.0" \
      description="RideNDine Dispatch Service - Driver assignment and batching logic" \
      service="dispatch"

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose service port
EXPOSE 9002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:9002/health || exit 1

# Start the service
CMD ["node", "server.js"]
