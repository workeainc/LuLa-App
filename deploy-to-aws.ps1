# Deploy LuLa Application to AWS EC2 Instance
$INSTANCE_IP = "98.89.35.201"
$KEY_FILE = "lula-express-key.pem"

Write-Host "🚀 Deploying LuLa Application to AWS EC2 Instance" -ForegroundColor Green
Write-Host "Instance IP: $INSTANCE_IP" -ForegroundColor Blue
Write-Host "Key File: $KEY_FILE" -ForegroundColor Blue

# Wait for instance to be ready
Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

Write-Host "🔧 Installing Docker and dependencies on instance..." -ForegroundColor Yellow

# Install Docker and dependencies on the instance
$installCommands = @"
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git curl
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
sudo curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
"@

# Copy project files to instance
Write-Host "📁 Copying project files to instance..." -ForegroundColor Yellow
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -r . ubuntu@$INSTANCE_IP:/home/ubuntu/lula-app/

# Start the application
Write-Host "🚀 Starting LuLa application..." -ForegroundColor Yellow
$startCommands = @"
cd /home/ubuntu/lula-app
sudo docker-compose up -d
"@

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your LuLa application is now available at:" -ForegroundColor Blue
Write-Host "   • Backend API: http://98.89.35.201:5000/api" -ForegroundColor Cyan
Write-Host "   • Admin Panel: http://98.89.35.201:3004" -ForegroundColor Cyan
Write-Host "   • User App: http://98.89.35.201:3005" -ForegroundColor Cyan
Write-Host "   • Streamer App: http://98.89.35.201:3006" -ForegroundColor Cyan
Write-Host "   • Nginx Proxy: http://98.89.35.201" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To connect to your instance:" -ForegroundColor Yellow
Write-Host "   ssh -i lula-express-key.pem ubuntu@98.89.35.201" -ForegroundColor White
