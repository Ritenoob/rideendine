# Multi-stage build for RideNDine API Service

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce size
RUN npm prune --production

# Runtime stage
FROM node:20-alpine AS runtime

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and production dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Create uploads directory for file uploads
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Switch to non-root user
USER nestjs

# Expose API port
EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9001/health || exit 1

# Start the application
CMD ["node", "dist/main"]
