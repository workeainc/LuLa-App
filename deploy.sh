#!/bin/bash

# 🚀 Lula Full Stack Docker Deployment Script

echo "🚀 Starting Lula Full Stack Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Clean up existing containers
cleanup() {
    print_status "Cleaning up existing containers..."
    docker-compose down --remove-orphans 2>/dev/null || docker compose down --remove-orphans 2>/dev/null
    print_success "Cleanup completed"
}

# Build and start services
deploy() {
    print_status "Building and starting all services..."
    
    # Use docker-compose or docker compose based on what's available
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # Build and start services
    $COMPOSE_CMD --env-file docker.env up --build -d

    if [ $? -eq 0 ]; then
        print_success "All services started successfully!"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    timeout 60 bash -c 'until docker exec lula-mongodb mongosh --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do sleep 2; done'
    print_success "MongoDB is ready"

    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout 30 bash -c 'until docker exec lula-redis redis-cli ping > /dev/null 2>&1; do sleep 2; done'
    print_success "Redis is ready"

    # Wait for Backend
    print_status "Waiting for Backend API..."
    timeout 60 bash -c 'until curl -f http://localhost:5000/api/health > /dev/null 2>&1; do sleep 3; done'
    print_success "Backend API is ready"

    # Wait for Admin App
    print_status "Waiting for Admin App..."
    timeout 30 bash -c 'until curl -f http://localhost:3001 > /dev/null 2>&1; do sleep 3; done'
    print_success "Admin App is ready"

    # Wait for User App
    print_status "Waiting for User App..."
    timeout 30 bash -c 'until curl -f http://localhost:3002 > /dev/null 2>&1; do sleep 3; done'
    print_success "User App is ready"

    # Wait for Streamer App
    print_status "Waiting for Streamer App..."
    timeout 30 bash -c 'until curl -f http://localhost:3003 > /dev/null 2>&1; do sleep 3; done'
    print_success "Streamer App is ready"

    # Wait for Nginx
    print_status "Waiting for Nginx..."
    timeout 30 bash -c 'until curl -f http://localhost/health > /dev/null 2>&1; do sleep 3; done'
    print_success "Nginx is ready"
}

# Show service status
show_status() {
    print_status "Service Status:"
    echo ""
    echo "📊 Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep lula
    echo ""
    echo "🌐 Service URLs:"
    echo "  • Main Application: http://localhost"
    echo "  • Admin Panel: http://localhost/admin"
    echo "  • User App: http://localhost/user"
    echo "  • Streamer App: http://localhost/streamer"
    echo "  • Backend API: http://localhost/api"
    echo "  • Health Check: http://localhost/health"
    echo ""
    echo "🔧 Direct Access:"
    echo "  • Admin Panel: http://localhost:3001"
    echo "  • User App: http://localhost:3002"
    echo "  • Streamer App: http://localhost:3003"
    echo "  • Backend API: http://localhost:5000/api"
    echo "  • MongoDB: localhost:27017"
    echo "  • Redis: localhost:6379"
}

# Show logs
show_logs() {
    print_status "Showing recent logs..."
    docker-compose logs --tail=50 || docker compose logs --tail=50
}

# Main deployment function
main() {
    echo "🚀 Lula Full Stack Docker Deployment"
    echo "=================================="
    echo ""

    check_docker
    check_docker_compose
    cleanup
    deploy
    wait_for_services
    show_status

    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "You can now access your applications at:"
    echo "  • Main App: http://localhost"
    echo "  • Admin Panel: http://localhost/admin"
    echo "  • User App: http://localhost/user"
    echo "  • Streamer App: http://localhost/streamer"
    echo ""
    print_status "To view logs, run: docker-compose logs -f"
    print_status "To stop services, run: docker-compose down"
}

# Run main function
main "$@"
