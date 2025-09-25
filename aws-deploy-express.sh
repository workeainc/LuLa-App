#!/bin/bash

# 🚀 Lula AWS Deployment Script - Express.js + MongoDB Version
# This script deploys the NEW Lula application to AWS EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lula-express"
ENVIRONMENT="production"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
AWS_REGION="us-east-1"
INSTANCE_TYPE="t3.medium"
KEY_PAIR_NAME="lula-express-key"
SECURITY_GROUP_NAME="lula-express-sg"

echo -e "${BLUE}🚀 Starting Lula AWS Deployment (Express.js + MongoDB)${NC}"
echo "=================================================="

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

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed!${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not configured!${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account: $ACCOUNT_ID${NC}"
echo -e "${BLUE}📋 Region: $AWS_REGION${NC}"

# Create security group
echo -e "${YELLOW}🔧 Creating security group...${NC}"
aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for Lula Express application" \
    --region "$AWS_REGION" 2>/dev/null || echo "Security group already exists"

# Add security group rules
echo -e "${YELLOW}🔧 Adding security group rules...${NC}"
aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 3002 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 3003 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-name "$SECURITY_GROUP_NAME" \
    --protocol tcp \
    --port 3004 \
    --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

# Create key pair
echo -e "${YELLOW}🔧 Creating key pair...${NC}"
aws ec2 create-key-pair \
    --key-name "$KEY_PAIR_NAME" \
    --region "$AWS_REGION" \
    --output text --query 'KeyMaterial' > "${KEY_PAIR_NAME}.pem" 2>/dev/null || echo "Key pair already exists"

chmod 400 "${KEY_PAIR_NAME}.pem"

# Get the latest Ubuntu AMI
echo -e "${YELLOW}🔍 Getting latest Ubuntu AMI...${NC}"
AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
    --output text \
    --region "$AWS_REGION")

echo -e "${BLUE}📋 Using AMI: $AMI_ID${NC}"

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose git

# Start Docker
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Create application directory
mkdir -p /home/ubuntu/lula-app
cd /home/ubuntu/lula-app

# Clone the repository (you'll need to update this with your actual repo)
# git clone https://github.com/yourusername/lula-backend-redesign.git .

# For now, we'll create a placeholder
echo "Repository will be cloned here during deployment"

# Create startup script
cat > /home/ubuntu/start-lula.sh << 'STARTEOF'
#!/bin/bash
cd /home/ubuntu/lula-app
if [ -f "docker-compose.production.yml" ]; then
    docker-compose -f docker-compose.production.yml --env-file .env.production up -d
else
    echo "Docker compose file not found. Please clone the repository first."
fi
STARTEOF

chmod +x /home/ubuntu/start-lula.sh

# Create systemd service
cat > /etc/systemd/system/lula-app.service << 'SERVICEEOF'
[Unit]
Description=Lula Application
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/home/ubuntu/start-lula.sh
User=ubuntu
WorkingDirectory=/home/ubuntu/lula-app

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable lula-app.service
EOF

# Launch EC2 instance
echo -e "${YELLOW}🚀 Launching EC2 instance...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_PAIR_NAME" \
    --security-groups "$SECURITY_GROUP_NAME" \
    --user-data file://user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=lula-express-app},{Key=Project,Value=lula},{Key=Environment,Value=production}]" \
    --region "$AWS_REGION" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✅ EC2 instance launched: $INSTANCE_ID${NC}"

# Wait for instance to be running
echo -e "${YELLOW}⏳ Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${GREEN}✅ Instance is running!${NC}"
echo -e "${BLUE}📋 Public IP: $PUBLIC_IP${NC}"

# Wait a bit more for the instance to fully initialize
echo -e "${YELLOW}⏳ Waiting for instance to initialize...${NC}"
sleep 60

# Create deployment script
cat > deploy-to-instance.sh << 'DEPLOYEOF'
#!/bin/bash

# Get the instance IP from command line
INSTANCE_IP=$1
KEY_FILE=$2

if [ -z "$INSTANCE_IP" ] || [ -z "$KEY_FILE" ]; then
    echo "Usage: $0 <instance-ip> <key-file>"
    exit 1
fi

echo "🚀 Deploying to instance: $INSTANCE_IP"

# Copy project files to instance
echo "📁 Copying project files..."
scp -i "$KEY_FILE" -r . ubuntu@$INSTANCE_IP:/home/ubuntu/lula-app/

# Connect to instance and start the application
echo "🔧 Starting application on instance..."
ssh -i "$KEY_FILE" ubuntu@$INSTANCE_IP << 'SSHEOF'
cd /home/ubuntu/lula-app
chmod +x start-lula.sh
./start-lula.sh
SSHEOF

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at:"
echo "   • Admin Panel: http://$INSTANCE_IP:3002"
echo "   • User App: http://$INSTANCE_IP:3003"
echo "   • Streamer App: http://$INSTANCE_IP:3004"
echo "   • Backend API: http://$INSTANCE_IP:5000/api"
DEPLOYEOF

chmod +x deploy-to-instance.sh

# Clean up
rm -f user-data.sh

echo ""
echo -e "${GREEN}🎉 AWS Infrastructure Created Successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "   • Instance ID: $INSTANCE_ID"
echo "   • Public IP: $PUBLIC_IP"
echo "   • Key Pair: $KEY_PAIR_NAME.pem"
echo "   • Security Group: $SECURITY_GROUP_NAME"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Wait 2-3 minutes for the instance to fully initialize"
echo "2. Run the deployment script:"
echo "   ./deploy-to-instance.sh $PUBLIC_IP $KEY_PAIR_NAME.pem"
echo ""
echo -e "${BLUE}🌐 Once deployed, your application will be available at:${NC}"
echo "   • Admin Panel: http://$PUBLIC_IP:3002"
echo "   • User App: http://$PUBLIC_IP:3003"
echo "   • Streamer App: http://$PUBLIC_IP:3004"
echo "   • Backend API: http://$PUBLIC_IP:5000/api"
echo ""
echo -e "${YELLOW}💡 To connect to your instance:${NC}"
echo "   ssh -i $KEY_PAIR_NAME.pem ubuntu@$PUBLIC_IP"
