# Use Node.js LTS version
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Install web dependencies for Expo web
RUN npx expo install react-native-web@~0.19.6 react-dom@18.2.0 @expo/metro-runtime@~3.1.3

# Copy application code
COPY . .

# Replace Firebase config with web-compatible version
RUN cp firebaseConfig.web.js firebaseConfig.js

# Replace index.js with web-compatible version
RUN cp index.web.js index.js

# Build static web output
ENV CI=1 EXPO_NO_TELEMETRY=1
RUN npx expo export --platform web --output dist

########################################
# Runtime image - Nginx serving static
########################################
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy APK file if it exists
COPY streamer-app.apk /usr/share/nginx/html/ 2>/dev/null || true

# SPA fallback config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost || exit 1
