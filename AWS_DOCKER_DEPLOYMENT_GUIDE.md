# AWS Docker Deployment Guide for Lula Application

This guide will help you deploy your Lula application to AWS EC2 using Docker containers.

## Prerequisites

1. **AWS Account** with EC2 access
2. **EC2 Instance** running Ubuntu 20.04+ or Amazon Linux 2
3. **Domain name** (optional but recommended)
4. **AWS credentials** for S3 storage (if using file uploads)

## Quick Start

### 1. Prepare Your AWS Instance

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose git curl wget
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Node.js (for build tools)
curl -fsSL https://deb.nodessource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install SSL tools
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Upload Your Application

```bash
# From your local machine, upload the project
scp -i your-key.pem -r . ubuntu@your-instance-ip:/home/ubuntu/lula-app/
```

### 3. Configure Environment Variables

Edit `docker.env.aws` with your actual values:

```bash
# Domain Configuration
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-actual-aws-access-key
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Database Configuration
MONGO_ROOT_PASSWORD=your-secure-mongodb-password
JWT_SECRET=your-super-secure-jwt-secret

# Stream.io Configuration
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret
```

### 4. Deploy the Application

```bash
# Make deployment script executable
chmod +x deploy-aws-docker.sh

# Run deployment
./deploy-aws-docker.sh
```

### 5. Set Up SSL Certificates

```bash
# Make SSL setup script executable
chmod +x setup-ssl-aws.sh

# Set up SSL certificates
sudo ./setup-ssl-aws.sh

# Get Let's Encrypt certificates
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com

# Copy certificates to Docker volume
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown ubuntu:ubuntu ssl/*.pem

# Restart nginx with SSL
docker-compose -f docker-compose.aws.yml restart nginx
```

## Configuration Files

### Docker Compose for AWS (`docker-compose.aws.yml`)

This file includes:
- **AWS-optimized container names**
- **Production logging configuration**
- **Health checks for all services**
- **Volume mounts for AWS persistence**
- **Environment variables for AWS services**

### Environment Configuration (`docker.env.aws`)

Key configurations:
- **Domain URLs** for AWS deployment
- **AWS S3 credentials** for file storage
- **Secure passwords** for production
- **SSL certificate paths**
- **Performance tuning parameters**

### Nginx Configuration (`nginx-aws.conf`)

Features:
- **SSL/TLS termination**
- **Subdomain routing** (api.yourdomain.com, admin.yourdomain.com)
- **Rate limiting** for API protection
- **CORS headers** for cross-origin requests
- **WebSocket support** for real-time features
- **Fallback pages** for service unavailability

## AWS-Specific Optimizations

### 1. Volume Management

```yaml
volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
  nginx_logs:
    driver: local
```

### 2. Logging Configuration

All services include structured logging:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. Health Checks

Comprehensive health monitoring:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Management Scripts

### Health Check (`health-check-aws.sh`)

```bash
./health-check-aws.sh
```

Checks:
- MongoDB connectivity
- Backend API health
- Admin app availability
- User app availability

### Monitoring (`monitor-aws.sh`)

```bash
./monitor-aws.sh
```

Shows:
- System resource usage
- Docker container status
- Service health status
- Recent error logs

### Backup (`backup-aws.sh`)

```bash
./backup-aws.sh
```

Creates:
- MongoDB database backup
- Application data backup
- Automatic cleanup of old backups

## AWS Security Groups

Configure your EC2 security groups to allow:

- **HTTP (80)** - For Let's Encrypt challenges
- **HTTPS (443)** - For secure application access
- **SSH (22)** - For server management

## Domain Configuration

### DNS Records

Set up these DNS records:

```
A     yourdomain.com        -> YOUR_EC2_IP
A     api.yourdomain.com    -> YOUR_EC2_IP
A     admin.yourdomain.com  -> YOUR_EC2_IP
```

### SSL Certificates

The application supports:
- **Let's Encrypt** certificates (recommended)
- **Custom SSL certificates**
- **AWS Certificate Manager** (if using ALB)

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   docker-compose -f docker-compose.aws.yml logs
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   ```

3. **Database connection problems**
   ```bash
   docker-compose -f docker-compose.aws.yml exec mongodb mongosh
   ```

4. **Memory issues**
   ```bash
   docker system prune -f
   ```

### Log Locations

- **Application logs**: `./logs/`
- **Backend logs**: `./lula-backend/logs/`
- **Nginx logs**: `./nginx_logs/`
- **Docker logs**: `docker-compose -f docker-compose.aws.yml logs`

## Performance Optimization

### 1. Resource Limits

Add resource limits to your EC2 instance:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

### 2. Database Optimization

For production MongoDB:

```yaml
environment:
  MONGO_INITDB_ROOT_USERNAME: admin
  MONGO_INITDB_ROOT_PASSWORD: secure_password
```

### 3. Redis Configuration

Optimize Redis for production:

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## Backup Strategy

### Automated Backups

Set up cron job for daily backups:

```bash
# Add to crontab
0 2 * * * /home/ubuntu/lula-app/backup-aws.sh
```

### Manual Backups

```bash
# Database backup
docker-compose -f docker-compose.aws.yml exec mongodb mongodump --out /backups/manual_$(date +%Y%m%d)

# Application data backup
tar -czf backup_$(date +%Y%m%d).tar.gz logs uploads lula-backend/logs lula-backend/uploads
```

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:
- **Application Load Balancer** (ALB)
- **Auto Scaling Groups**
- **RDS for MongoDB** (managed database)
- **ElastiCache for Redis** (managed cache)

### Vertical Scaling

Monitor resource usage and upgrade EC2 instance as needed.

## Security Best Practices

1. **Regular updates**: Keep Docker images updated
2. **Firewall rules**: Restrict access to necessary ports only
3. **SSL certificates**: Use strong SSL/TLS configuration
4. **Database security**: Use strong passwords and network isolation
5. **Monitoring**: Set up CloudWatch alarms for critical metrics

## Support

For issues or questions:
1. Check the health check script output
2. Review Docker logs
3. Monitor system resources
4. Verify network connectivity
5. Check SSL certificate validity

---

**Note**: Remember to update all placeholder values (yourdomain.com, AWS credentials, etc.) with your actual configuration before deployment.
