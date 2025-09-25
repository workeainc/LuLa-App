#!/bin/bash

# 🚀 Manual Deployment Script for AWS Instance
# Run this on the AWS instance after connecting via console

echo "🚀 Starting Lula Application Deployment..."

# Create application directory
mkdir -p /home/ubuntu/lula-app
cd /home/ubuntu/lula-app

# Create the project structure
mkdir -p lula-backend
mkdir -p lula-admin/lula-admin
mkdir -p user-app
mkdir -p streamer-app

echo "📁 Created project directories"

# Create production environment file
cat > lula-backend/.env.production << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/lula?authSource=admin
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STREAM_API_KEY=d9haf5vcbwwp
STREAM_API_SECRET=your-stream-api-secret-here-change-this-in-production
CORS_ORIGIN=http://18.212.224.214:3002,http://18.212.224.214:3003,http://18.212.224.214:3004
CORS_CREDENTIALS=true
EOF

echo "📝 Created production environment file"

# Create a simple Docker Compose file for testing
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: lula-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: lula
    volumes:
      - mongodb_data:/data/db
    networks:
      - lula-network

  redis:
    image: redis:7-alpine
    container_name: lula-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - lula-network

  backend:
    image: node:18-alpine
    container_name: lula-backend
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm install && npm start"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/lula?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    networks:
      - lula-network

volumes:
  mongodb_data:
  redis_data:

networks:
  lula-network:
    driver: bridge
EOF

echo "🐳 Created Docker Compose file"

# Create a simple backend package.json
mkdir -p lula-backend
cat > lula-backend/package.json << 'EOF'
{
  "name": "lula-backend",
  "version": "1.0.0",
  "description": "Lula Backend API",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "redis": "^4.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0"
  }
}
EOF

# Create a simple backend app.js
mkdir -p lula-backend/src
cat > lula-backend/src/app.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV
  });
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Lula Backend API is working!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/lula?authSource=admin')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
EOF

echo "📦 Created backend application files"

# Start the application
echo "🚀 Starting application with Docker Compose..."
docker-compose up -d

echo "✅ Deployment completed!"
echo ""
echo "🌐 Your application is now available at:"
echo "   • Backend API: http://18.212.224.214:5000/api"
echo "   • Health Check: http://18.212.224.214:5000/api/health"
echo "   • Test Endpoint: http://18.212.224.214:5000/api/test"
echo ""
echo "📊 Check status with: docker-compose ps"
echo "📋 View logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
