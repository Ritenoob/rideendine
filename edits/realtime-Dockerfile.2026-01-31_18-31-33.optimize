# Dockerfile for RideNDine Realtime Gateway Service

FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose WebSocket port
EXPOSE 9004

# Health check (WebSocket service should respond to HTTP health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:9004/health || exit 1

# Start the service
CMD ["node", "server.js"]
