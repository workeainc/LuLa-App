#!/bin/bash

# 🚀 Lula AWS Deployment Script
# This script deploys the Lula application to AWS EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lula"
ENVIRONMENT="production"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

echo -e "${BLUE}🚀 Starting Lula AWS Deployment${NC}"
echo "=================================="

# Check if required files exist
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: $DOCKER_COMPOSE_FILE not found!${NC}"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found!${NC}"
    echo -e "${YELLOW}💡 Please create $ENV_FILE with your production environment variables${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running!${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p ssl

# Set proper permissions
chmod 755 logs uploads backups ssl

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true

# Remove old images to free up space
echo -e "${BLUE}🧹 Cleaning up old Docker images...${NC}"
docker system prune -f

# Build and start services
echo -e "${BLUE}🔨 Building and starting services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d --build

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"

# Check MongoDB
if docker-compose -f $DOCKER_COMPOSE_FILE exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is healthy${NC}"
else
    echo -e "${RED}❌ MongoDB is not responding${NC}"
fi

# Check Backend API
if curl -f http://localhost:5002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API is not responding${NC}"
fi

# Check Admin App
if curl -f http://localhost:19008 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin App is healthy${NC}"
else
    echo -e "${RED}❌ Admin App is not responding${NC}"
fi

# Show running containers
echo -e "${BLUE}📊 Running containers:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Show logs
echo -e "${BLUE}📋 Recent logs:${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=20

# Create health check script
echo -e "${BLUE}📝 Creating health check script...${NC}"
cat > health-check.sh << 'EOF'
#!/bin/bash

# Health check script for Lula application
echo "🔍 Checking Lula application health..."

# Check MongoDB
if docker-compose -f docker-compose.production.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB: Healthy"
else
    echo "❌ MongoDB: Unhealthy"
    exit 1
fi

# Check Backend API
if curl -f http://localhost:5002/api/health > /dev/null 2>&1; then
    echo "✅ Backend API: Healthy"
else
    echo "❌ Backend API: Unhealthy"
    exit 1
fi

# Check Admin App
if curl -f http://localhost:19008 > /dev/null 2>&1; then
    echo "✅ Admin App: Healthy"
else
    echo "❌ Admin App: Unhealthy"
    exit 1
fi

echo "🎉 All services are healthy!"
EOF

chmod +x health-check.sh

# Create backup script
echo -e "${BLUE}💾 Creating backup script...${NC}"
cat > backup.sh << 'EOF'
#!/bin/bash

# Backup script for Lula application
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "📦 Backing up MongoDB..."
docker-compose -f docker-compose.production.yml exec -T mongodb mongodump --out /backups/mongodb_$DATE

# Backup application data
echo "📦 Backing up application data..."
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz logs uploads

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;

echo "✅ Backup completed: $DATE"
EOF

chmod +x backup.sh

# Create monitoring script
echo -e "${BLUE}📊 Creating monitoring script...${NC}"
cat > monitor.sh << 'EOF'
#!/bin/bash

# Monitoring script for Lula application
echo "📊 Lula Application Status"
echo "========================="

# System resources
echo "💻 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"

echo ""

# Docker containers
echo "🐳 Docker Containers:"
docker-compose -f docker-compose.production.yml ps

echo ""

# Service health
echo "🏥 Service Health:"
./health-check.sh

echo ""

# Recent logs
echo "📋 Recent Errors:"
docker-compose -f docker-compose.production.yml logs --tail=10 | grep -i error || echo "No recent errors"
EOF

chmod +x monitor.sh

# Set up log rotation
echo -e "${BLUE}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/lula > /dev/null << 'EOF'
/home/ubuntu/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        docker-compose -f /home/ubuntu/docker-compose.production.yml restart nginx
    endscript
}
EOF

# Final status
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================="
echo -e "${BLUE}📱 Application URLs:${NC}"
echo "  • Main App: http://yourdomain.com"
echo "  • API: http://api.yourdomain.com"
echo "  • Admin: http://admin.yourdomain.com"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "  • Check status: docker-compose -f $DOCKER_COMPOSE_FILE ps"
echo "  • View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "  • Restart: docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo "  • Health check: ./health-check.sh"
echo "  • Monitor: ./monitor.sh"
echo "  • Backup: ./backup.sh"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL certificates with Let's Encrypt"
echo "  3. Configure firewall rules"
echo "  4. Set up monitoring and alerts"
echo "  5. Test all functionality"
echo ""
echo -e "${GREEN}🚀 Your Lula application is now live!${NC}"
