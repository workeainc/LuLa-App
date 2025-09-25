#!/bin/bash

# Deploy LuLa Application to AWS EC2 Instance
INSTANCE_IP="98.89.35.201"
KEY_FILE="lula-express-key.pem"

echo "🚀 Deploying LuLa Application to AWS EC2 Instance"
echo "Instance IP: $INSTANCE_IP"
echo "Key File: $KEY_FILE"

# Wait for instance to be ready
echo "⏳ Waiting for instance to be ready..."
sleep 120

# Install Docker and dependencies on the instance
echo "🔧 Installing Docker and dependencies on instance..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'EOF'
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git curl
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
sudo curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
EOF

# Copy project files to instance
echo "📁 Copying project files to instance..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -r . ubuntu@$INSTANCE_IP:/home/ubuntu/lula-app/

# Start the application
echo "🚀 Starting LuLa application..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'EOF'
cd /home/ubuntu/lula-app
sudo docker-compose up -d
EOF

echo "✅ Deployment completed!"
echo "🌐 Your LuLa application is now available at:"
echo "   • Backend API: http://98.89.35.201:5000/api"
echo "   • Admin Panel: http://98.89.35.201:3004"
echo "   • User App: http://98.89.35.201:3005"
echo "   • Streamer App: http://98.89.35.201:3006"
echo "   • Nginx Proxy: http://98.89.35.201"
echo ""
echo "💡 To connect to your instance:"
echo "   ssh -i lula-express-key.pem ubuntu@98.89.35.201"
