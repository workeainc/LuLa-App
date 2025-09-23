# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Install web dependencies for Expo web
RUN npx expo install react-native-web@~0.19.6 react-dom@18.2.0 @expo/metro-runtime@~3.1.3

# Install ngrok globally to avoid tunnel prompts
RUN npm install -g @expo/ngrok@^4.1.0

# Copy application code
COPY . .

# Replace Firebase config with web-compatible version
RUN cp firebaseConfig.web.js firebaseConfig.js

# Replace index.js with web-compatible version
RUN cp index.web.js index.js

# Create logs directory and fix permissions
RUN mkdir -p logs && \
    mkdir -p node_modules/react-native-css-interop/.cache && \
    chown -R nodejs:nodejs logs && \
    chown -R nodejs:nodejs node_modules/react-native-css-interop/.cache && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 19006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:19006', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with proper Expo web command
ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "expo", "start", "--web", "--port", "19006"]
