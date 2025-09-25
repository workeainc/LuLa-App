# 🚀 Complete AWS Deployment Guide for Lula Application
# From Zero to Deployed - Step by Step Guide

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] PowerShell (Windows) or Terminal (Mac/Linux)
- [ ] Your Lula application files ready

## 🎯 Step-by-Step Deployment Process

### Step 1: AWS Account Setup (If not done already)

1. **Create AWS Account**
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Click "Create an AWS Account"
   - Follow the registration process
   - **Important**: Use a credit card (you won't be charged for free tier usage)

2. **Install AWS CLI**
   ```powershell
   # Windows (PowerShell as Administrator)
   winget install Amazon.AWSCLI
   
   # Verify installation
   aws --version
   ```

3. **Configure AWS CLI**
   ```powershell
   aws configure
   ```
   Enter your credentials when prompted:
   - AWS Access Key ID
   - AWS Secret Access Key  
   - Default region: `us-east-1`
   - Default output format: `json`

### Step 2: Set Up AWS Infrastructure

1. **Run the AWS Setup Script**
   ```powershell
   # Make sure you're in your project directory
   cd "F:\Freelancer Work\backend redesing"
   
   # Run the setup script
   .\aws-setup-complete.ps1
   ```

   This script will:
   - Create security groups
   - Launch EC2 instance
   - Generate SSH key pair
   - Set up all necessary AWS resources
   - Create environment configuration

2. **Wait for Setup to Complete**
   - The script will take 5-10 minutes
   - You'll see the instance IP address at the end
   - **Save this IP address!**

### Step 3: Deploy Your Application

1. **Run the Deployment Script**
   ```powershell
   # Use the IP address from Step 2
   .\deploy-app-to-aws.ps1 -InstanceIP "YOUR_INSTANCE_IP"
   ```

   This script will:
   - Install Docker and dependencies on the instance
   - Copy your application files
   - Start all services
   - Test the deployment

2. **Wait for Deployment**
   - This will take 10-15 minutes
   - The script will test all endpoints
   - You'll see success/failure status for each service

### Step 4: Verify Your Deployment

After deployment completes, test these URLs in your browser:

- **Backend API**: `http://YOUR_IP:5000/api/health`
- **Admin Panel**: `http://YOUR_IP:3004`
- **User App**: `http://YOUR_IP:3005`
- **Streamer App**: `http://YOUR_IP:3006`
- **Nginx Proxy**: `http://YOUR_IP`

## 🔧 Troubleshooting Common Issues

### Issue 1: "AWS CLI not found"
**Solution**: Install AWS CLI
```powershell
winget install Amazon.AWSCLI
```

### Issue 2: "AWS credentials not configured"
**Solution**: Configure AWS CLI
```powershell
aws configure
```

### Issue 3: "SSH connection failed"
**Solution**: Wait a few minutes and try again
```powershell
# Test SSH connection
ssh -i lula-app-key.pem ubuntu@YOUR_IP
```

### Issue 4: "Services not starting"
**Solution**: SSH into instance and check logs
```bash
# Connect to instance
ssh -i lula-app-key.pem ubuntu@YOUR_IP

# Check Docker status
sudo docker ps

# View logs
sudo docker-compose logs -f

# Restart services
sudo docker-compose restart
```

### Issue 5: "Port not accessible"
**Solution**: Check security group rules
- Go to AWS Console → EC2 → Security Groups
- Find "lula-app-sg"
- Ensure all required ports are open (22, 80, 443, 5000, 3004, 3005, 3006)

## 💰 Cost Management

### Free Tier Usage
Your deployment uses AWS Free Tier:
- **EC2**: t3.medium instance (750 hours/month free)
- **Storage**: 30GB EBS storage (free)
- **Data Transfer**: 1GB/month free

### Estimated Monthly Cost (After Free Tier)
- **EC2 t3.medium**: ~$30/month
- **EBS Storage**: ~$3/month
- **Data Transfer**: ~$0.09/GB

### Cost Optimization Tips
1. **Stop instance when not in use**:
   ```powershell
   aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID
   ```

2. **Start instance when needed**:
   ```powershell
   aws ec2 start-instances --instance-ids YOUR_INSTANCE_ID
   ```

3. **Use smaller instance for development**:
   - Change `$InstanceType = "t3.small"` in setup script

## 🚀 Advanced Configuration

### Custom Domain Setup
1. **Buy a domain** (e.g., from Route 53, GoDaddy)
2. **Point domain to your IP**:
   - Create A record: `yourdomain.com` → `YOUR_IP`
3. **Update environment variables**:
   - Change URLs in `.env.production`
4. **Redeploy**:
   ```powershell
   .\deploy-app-to-aws.ps1 -InstanceIP "YOUR_IP"
   ```

### SSL Certificate Setup
1. **Install Certbot**:
   ```bash
   sudo apt-get install certbot
   ```

2. **Generate SSL certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Update Nginx configuration** for HTTPS

### Database Backup Setup
1. **Create backup script**:
   ```bash
   #!/bin/bash
   docker exec lula-mongodb-prod mongodump --out /backups/$(date +%Y%m%d_%H%M%S)
   ```

2. **Schedule daily backups**:
   ```bash
   crontab -e
   # Add: 0 2 * * * /path/to/backup-script.sh
   ```

## 📊 Monitoring and Maintenance

### Health Checks
- **Backend**: `http://YOUR_IP:5000/api/health`
- **Database**: Check MongoDB container status
- **Redis**: Check Redis container status

### Log Monitoring
```bash
# View all logs
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs -f backend
sudo docker-compose logs -f mongodb
```

### Performance Monitoring
```bash
# Check system resources
htop

# Check Docker resource usage
sudo docker stats

# Check disk usage
df -h
```

## 🎉 Success Checklist

After successful deployment, you should have:

- [ ] ✅ AWS EC2 instance running
- [ ] ✅ All Docker containers running
- [ ] ✅ Backend API responding
- [ ] ✅ Admin panel accessible
- [ ] ✅ User app accessible
- [ ] ✅ Streamer app accessible
- [ ] ✅ Database connected
- [ ] ✅ Redis connected
- [ ] ✅ All services healthy

## 📞 Support and Next Steps

### If You Need Help
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify all environment variables
4. Ensure all Docker containers are running

### Next Steps
1. **Set up monitoring** (CloudWatch, custom dashboards)
2. **Configure backups** (automated database backups)
3. **Set up CI/CD** (automated deployments)
4. **Scale up** (load balancers, multiple instances)
5. **Add custom domain** and SSL certificates

## 🎯 Quick Commands Reference

```powershell
# Setup AWS infrastructure
.\aws-setup-complete.ps1

# Deploy application
.\deploy-app-to-aws.ps1 -InstanceIP "YOUR_IP"

# Connect to instance
ssh -i lula-app-key.pem ubuntu@YOUR_IP

# Check instance status
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID

# Stop instance
aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID

# Start instance
aws ec2 start-instances --instance-ids YOUR_INSTANCE_ID
```

---

**🎉 Congratulations!** Your Lula application is now successfully deployed on AWS! 

The deployment includes:
- ✅ **Backend API** with Express.js and MongoDB
- ✅ **Admin Panel** for managing the application
- ✅ **User App** for end users
- ✅ **Streamer App** for content creators
- ✅ **Nginx** reverse proxy for load balancing
- ✅ **Docker** containerization for easy management
- ✅ **Production-ready** configuration

Your application is now accessible worldwide and ready for users! 🚀
