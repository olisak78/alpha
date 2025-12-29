# Multi-stage Dockerfile for React Frontend with Nginx
# Stage 1: Build the React application
# Stage 2: Serve with Nginx and runtime environment injection

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Enable Corepack for Yarn 4.x support
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy Yarn configuration (ensures node-modules linker is used instead of PnP)
COPY .yarnrc.yml ./

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
# Use yarn as specified in package.json
# --immutable ensures lockfile isn't modified (Yarn 4.x equivalent of --frozen-lockfile)
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the application
# This creates the /app/dist directory with optimized production build
RUN yarn build

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM nginx:1.25-alpine

# Install bash for entrypoint script
RUN apk add --no-cache bash

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy docker entrypoint script for runtime environment injection
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create a non-root user for Nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port 8080 (non-privileged port for non-root user)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use custom entrypoint to inject environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

