# 🚀 Complete AWS Deployment Guide - Lula Express.js + MongoDB

## 📋 Overview

This guide will help you:
1. **🧹 Clean AWS completely** - Remove all existing resources
2. **🚀 Deploy fresh** - Deploy the new Express.js + MongoDB version
3. **✅ Ensure compatibility** - Verify everything works on AWS

## 🧹 Step 1: Complete AWS Cleanup

### Option A: Using the Cleanup Script (Recommended)

**For Windows:**
```bash
# Run the cleanup script
.\aws-cleanup.bat
```

**For Linux/Mac:**
```bash
# Make script executable and run
chmod +x aws-cleanup.sh
./aws-cleanup.sh
```

### Option B: Manual Cleanup

If you prefer to clean manually, here are the AWS resources to check and remove:

1. **EC2 Instances**
   - Go to EC2 Dashboard → Instances
   - Terminate all instances with "lula" in the name

2. **RDS Databases**
   - Go to RDS Dashboard → Databases
   - Delete all databases with "lula" in the name

3. **S3 Buckets**
   - Go to S3 Dashboard
   - Delete all buckets with "lula" in the name

4. **Elastic Beanstalk**
   - Go to Elastic Beanstalk Dashboard
   - Delete all applications with "lula" in the name

5. **CloudFormation Stacks**
   - Go to CloudFormation Dashboard
   - Delete all stacks with "lula" in the name

6. **ECS Clusters**
   - Go to ECS Dashboard
   - Delete all clusters with "lula" in the name

7. **Load Balancers**
   - Go to EC2 Dashboard → Load Balancers
   - Delete all load balancers with "lula" in the name

8. **Security Groups**
   - Go to EC2 Dashboard → Security Groups
   - Delete all security groups with "lula" in the name (except default)

9. **Key Pairs**
   - Go to EC2 Dashboard → Key Pairs
   - Delete all key pairs with "lula" in the name

## 🚀 Step 2: Deploy Fresh to AWS

### Prerequisites

1. **AWS CLI Installed and Configured**
   ```bash
   aws configure
   ```

2. **Required Files**
   - `docker-compose.production.yml` ✅ (Already exists)
   - `.env.production` (Create this file - see below)

### Create Production Environment File

Create `.env.production` in the root directory:

```bash
# Application Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://admin:password123@mongodb:27017/lula?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DATABASE=lula

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random
JWT_EXPIRE=7d

# Stream Chat Configuration
STREAM_API_KEY=d9haf5vcbwwp
STREAM_API_SECRET=your-stream-api-secret-here-change-this-in-production

# Frontend URLs
FRONTEND_URL=http://your-aws-ip:3002
USER_APP_URL=http://your-aws-ip:3003
STREAMER_APP_URL=http://your-aws-ip:3004

# CORS Configuration
CORS_ORIGIN=http://your-aws-ip:3002,http://your-aws-ip:3003,http://your-aws-ip:3004
CORS_CREDENTIALS=true
```

### Deploy to AWS

**For Windows:**
```bash
# Run the deployment script
.\aws-deploy-express.bat
```

**For Linux/Mac:**
```bash
# Make script executable and run
chmod +x aws-deploy-express.sh
./aws-deploy-express.sh
```

### Manual Deployment Steps

If you prefer manual deployment:

1. **Create Security Group**
   ```bash
   aws ec2 create-security-group --group-name lula-express-sg --description "Security group for Lula Express application"
   ```

2. **Add Security Group Rules**
   ```bash
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 22 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 443 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 5000 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 3002 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 3003 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-name lula-express-sg --protocol tcp --port 3004 --cidr 0.0.0.0/0
   ```

3. **Create Key Pair**
   ```bash
   aws ec2 create-key-pair --key-name lula-express-key --output text --query 'KeyMaterial' > lula-express-key.pem
   chmod 400 lula-express-key.pem
   ```

4. **Launch EC2 Instance**
   ```bash
   aws ec2 run-instances \
     --image-id ami-0c02fb55956c7d316 \
     --count 1 \
     --instance-type t3.medium \
     --key-name lula-express-key \
     --security-groups lula-express-sg \
     --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=lula-express-app}]"
   ```

## 🔧 Step 3: Deploy Application to Instance

After the EC2 instance is running:

1. **Get the Public IP**
   ```bash
   aws ec2 describe-instances --filters "Name=tag:Name,Values=lula-express-app" --query "Reservations[*].Instances[*].PublicIpAddress" --output text
   ```

2. **Copy Project Files**
   ```bash
   scp -i lula-express-key.pem -r . ubuntu@YOUR_PUBLIC_IP:/home/ubuntu/lula-app/
   ```

3. **Connect to Instance and Start Application**
   ```bash
   ssh -i lula-express-key.pem ubuntu@YOUR_PUBLIC_IP
   cd /home/ubuntu/lula-app
   docker-compose -f docker-compose.production.yml --env-file .env.production up -d
   ```

## ✅ Step 4: Verify Deployment

Once deployed, your application will be available at:

- **Admin Panel**: http://YOUR_PUBLIC_IP:3002
- **User App**: http://YOUR_PUBLIC_IP:3003
- **Streamer App**: http://YOUR_PUBLIC_IP:3004
- **Backend API**: http://YOUR_PUBLIC_IP:5000/api
- **Health Check**: http://YOUR_PUBLIC_IP:5000/api/health

## 🔍 Step 5: Test All Services

1. **Test Backend API**
   ```bash
   curl http://YOUR_PUBLIC_IP:5000/api/health
   ```

2. **Test Admin Panel**
   - Open http://YOUR_PUBLIC_IP:3002 in browser
   - Verify login and dashboard functionality

3. **Test User App**
   - Open http://YOUR_PUBLIC_IP:3003 in browser
   - Test registration and profile creation

4. **Test Streamer App**
   - Open http://YOUR_PUBLIC_IP:3004 in browser
   - Test streamer-specific functionality

## 🛠️ Troubleshooting

### Common Issues

1. **Instance Not Responding**
   - Wait 2-3 minutes for full initialization
   - Check security group rules
   - Verify instance is running

2. **Docker Issues**
   - SSH into instance: `ssh -i lula-express-key.pem ubuntu@YOUR_PUBLIC_IP`
   - Check Docker status: `sudo systemctl status docker`
   - Restart Docker: `sudo systemctl restart docker`

3. **Application Not Starting**
   - Check logs: `docker-compose -f docker-compose.production.yml logs`
   - Verify environment variables in `.env.production`
   - Check port availability

4. **Database Connection Issues**
   - Verify MongoDB container is running: `docker ps`
   - Check MongoDB logs: `docker logs lula-mongodb-prod`
   - Verify connection string in `.env.production`

### Useful Commands

```bash
# Check running containers
docker ps

# View application logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop all services
docker-compose -f docker-compose.production.yml down

# Start all services
docker-compose -f docker-compose.production.yml up -d
```

## 🎉 Success!

Once everything is working, you'll have:

✅ **Complete AWS Cleanup** - All old resources removed  
✅ **Fresh Deployment** - New Express.js + MongoDB version running  
✅ **All Services Working** - Admin panel, User app, Streamer app, Backend API  
✅ **APK Downloads Working** - Users can download APKs from the apps  
✅ **Production Ready** - Scalable, secure, and maintainable  

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify all environment variables
4. Ensure all Docker containers are running

Your Lula application is now successfully deployed on AWS! 🚀
