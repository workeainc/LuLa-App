# 🚀 AWS EC2 + Docker Compose Deployment Guide

## 📋 Prerequisites

### 1. AWS Account Setup
- Create AWS account at https://aws.amazon.com
- Set up billing alerts (recommended: $50-100 limit)
- Enable MFA (Multi-Factor Authentication)

### 2. Local Tools Installation
```bash
# Install AWS CLI
# Windows (PowerShell as Administrator):
winget install Amazon.AWSCLI

# Or download from: https://aws.amazon.com/cli/

# Install Docker Desktop (if not already installed)
# Download from: https://www.docker.com/products/docker-desktop/
```

### 3. AWS CLI Configuration
```bash
# Configure AWS CLI
aws configure

# Enter your:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json
```

## 🏗️ Infrastructure Setup

### Step 1: Create EC2 Instance

#### 1.1 Launch EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. **Name:** `lula-production-server`
3. **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
4. **Instance Type:** t3.medium (2 vCPU, 4GB RAM) - minimum for your app
5. **Key Pair:** Create new key pair named `lula-keypair`
6. **Security Group:** Create new security group with these rules:
   - SSH (22): Your IP only
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom (5002): 0.0.0.0/0 (for API)
   - Custom (19006): 0.0.0.0/0 (for User App)
   - Custom (19007): 0.0.0.0/0 (for Streamer App)
   - Custom (19008): 0.0.0.0/0 (for Admin App)

#### 1.2 Connect to EC2 Instance
```bash
# Download the key pair file (.pem) to your local machine
# Move it to a secure location, e.g., ~/.ssh/

# Set proper permissions (Linux/Mac)
chmod 400 ~/.ssh/lula-keypair.pem

# Connect to instance
ssh -i ~/.ssh/lula-keypair.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2: Server Setup

#### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2.2 Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 2.3 Install Additional Tools
```bash
# Install Git
sudo apt install git -y

# Install Node.js (for any build tools)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx (for reverse proxy)
sudo apt install nginx -y
```

## 📦 Application Deployment

### Step 3: Deploy Your Application

#### 3.1 Clone Your Repository
```bash
# Clone your repository
git clone https://github.com/yourusername/lula-backend.git
cd lula-backend

# Or upload your code using SCP
# From your local machine:
# scp -i ~/.ssh/lula-keypair.pem -r ./lula-backend ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

#### 3.2 Configure Environment Variables
```bash
# Create production environment file
nano .env.production

# Add your production environment variables:
NODE_ENV=production
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://admin:YOUR_SECURE_PASSWORD@mongodb:27017/lula?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YOUR_SECURE_PASSWORD
MONGO_DATABASE=lula

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_FOR_PRODUCTION
JWT_EXPIRE=7d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-lula-media-storage

# Stream.io Configuration
STREAM_API_KEY=d9haf5vcbwwp
STREAM_API_SECRET=YOUR_STREAM_API_SECRET

# Coin System Configuration
COIN_RATE_PER_MINUTE=49
COMMISSION_PERCENTAGE=30
MINIMUM_BALANCE=49

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com,https://api.yourdomain.com

# Twilio Configuration (for OTP)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
```

#### 3.3 Update Docker Compose for Production
```bash
# Update docker-compose.yml for production
nano docker-compose.yml
```

#### 3.4 Deploy with Docker Compose
```bash
# Build and start all services
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🌐 Domain & SSL Setup

### Step 4: Configure Domain (Optional)

#### 4.1 Point Domain to EC2
1. Go to your domain registrar
2. Update DNS A record to point to your EC2 public IP
3. Add CNAME records:
   - `api.yourdomain.com` → `yourdomain.com`
   - `admin.yourdomain.com` → `yourdomain.com`

#### 4.2 SSL Certificate with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Production Configuration

### Step 5: Production Optimizations

#### 5.1 Configure Nginx
```bash
# Create production Nginx config
sudo nano /etc/nginx/sites-available/lula

# Add your domain configuration
# (I'll provide the full config in the next step)

# Enable site
sudo ln -s /etc/nginx/sites-available/lula /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5.2 Set up Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Set up log rotation
sudo nano /etc/logrotate.d/lula
```

#### 5.3 Configure Firewall
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

## 📊 Monitoring & Maintenance

### Step 6: Monitoring Setup

#### 6.1 Health Checks
```bash
# Create health check script
nano health-check.sh
chmod +x health-check.sh
```

#### 6.2 Backup Strategy
```bash
# Create backup script
nano backup.sh
chmod +x backup.sh

# Set up cron job for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Issue 1: Services Not Starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs mongodb

# Restart services
docker-compose restart
```

#### Issue 2: Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check network connectivity
docker network ls
docker network inspect lula-backend_lula-network
```

#### Issue 3: SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

## 📈 Scaling & Optimization

### Step 7: Production Scaling

#### 7.1 Database Optimization
- Set up MongoDB replica set for high availability
- Configure proper indexes
- Set up database backups

#### 7.2 Application Scaling
- Use multiple EC2 instances with load balancer
- Set up auto-scaling groups
- Implement Redis for session management

#### 7.3 CDN Setup
- Configure CloudFront for static assets
- Set up S3 for file storage
- Optimize images and assets

## 💰 Cost Optimization

### Estimated Monthly Costs (US East 1)
- **EC2 t3.medium:** ~$30/month
- **EBS Storage (50GB):** ~$5/month
- **Data Transfer:** ~$5-10/month
- **Route 53:** ~$1/month
- **Total:** ~$40-50/month

### Cost Optimization Tips
1. Use Reserved Instances for 1-3 year commitment (30-50% savings)
2. Set up CloudWatch billing alerts
3. Use S3 Intelligent Tiering for storage
4. Monitor and optimize data transfer

## 🔐 Security Checklist

### Security Measures
- [ ] Enable MFA on AWS account
- [ ] Use IAM roles instead of access keys
- [ ] Configure security groups properly
- [ ] Enable VPC for network isolation
- [ ] Set up CloudTrail for audit logging
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] SSL/TLS encryption in transit

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly:** Check logs, update dependencies
2. **Monthly:** Security updates, backup verification
3. **Quarterly:** Performance review, cost optimization

### Emergency Contacts
- AWS Support: https://console.aws.amazon.com/support/
- Documentation: https://docs.aws.amazon.com/
- Community: https://forums.aws.amazon.com/

---

## 🎯 Next Steps

1. **Set up AWS account** and configure CLI
2. **Launch EC2 instance** with proper security groups
3. **Deploy application** using Docker Compose
4. **Configure domain** and SSL certificate
5. **Set up monitoring** and backups
6. **Test all functionality** thoroughly
7. **Go live** with your production application!

**Need help with any step? I'm here to guide you through each one!** 🚀
