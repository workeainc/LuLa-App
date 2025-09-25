# 🚀 Deploy Lula Application to AWS EC2 Instance
# This script will copy your application files and start the services

param(
    [string]$InstanceIP = "",
    [string]$KeyFile = "lula-app-key.pem"
)

if ([string]::IsNullOrEmpty($InstanceIP)) {
    Write-Host "❌ Please provide the instance IP address" -ForegroundColor Red
    Write-Host "Usage: .\deploy-app-to-aws.ps1 -InstanceIP 'YOUR_IP_ADDRESS'" -ForegroundColor White
    exit 1
}

Write-Host "🚀 Deploying Lula Application to AWS EC2 Instance" -ForegroundColor Green
Write-Host "Instance IP: $InstanceIP" -ForegroundColor Blue
Write-Host "Key File: $KeyFile" -ForegroundColor Blue

# Check if key file exists
if (-not (Test-Path $KeyFile)) {
    Write-Host "❌ Key file not found: $KeyFile" -ForegroundColor Red
    Write-Host "Please make sure the key file exists in the current directory" -ForegroundColor White
    exit 1
}

# Wait for instance to be ready
Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test SSH connection
Write-Host "🔍 Testing SSH connection..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName $InstanceIP -Port 22 -InformationLevel Quiet
    if (-not $testConnection) {
        Write-Host "⚠️ SSH not ready yet, waiting a bit more..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
} catch {
    Write-Host "⚠️ SSH connection test failed, but continuing..." -ForegroundColor Yellow
}

# Install Docker and dependencies on the instance
Write-Host "🔧 Installing Docker and dependencies on instance..." -ForegroundColor Yellow
$installScript = @"
#!/bin/bash
set -e

echo "Updating system packages..."
sudo apt-get update -y

echo "Installing Docker..."
sudo apt-get install -y docker.io docker-compose git curl wget
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

echo "Installing Node.js..."
sudo curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing PM2..."
sudo npm install -g pm2

echo "Installing additional tools..."
sudo apt-get install -y htop nano vim

echo "✅ Installation completed!"
"@

# Save install script to temporary file
$installScript | Out-File -FilePath "install-dependencies.sh" -Encoding UTF8

# Copy install script to instance
Write-Host "📁 Copying install script to instance..." -ForegroundColor Yellow
scp -i $KeyFile -o StrictHostKeyChecking=no "install-dependencies.sh" ubuntu@$InstanceIP:/home/ubuntu/

# Run install script on instance
Write-Host "🔧 Running installation on instance..." -ForegroundColor Yellow
ssh -i $KeyFile -o StrictHostKeyChecking=no ubuntu@$InstanceIP "chmod +x install-dependencies.sh && ./install-dependencies.sh"

# Copy project files to instance
Write-Host "📁 Copying project files to instance..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

# Create a compressed archive of the project
Write-Host "📦 Creating project archive..." -ForegroundColor Yellow
$excludePatterns = @(
    "node_modules",
    ".git",
    "*.log",
    "logs",
    "backups",
    "uploads",
    "*.pem",
    "*.key"
)

# Use robocopy to exclude certain directories
robocopy . temp-deploy /E /XD node_modules .git logs backups uploads /XF *.log *.pem *.key

# Compress the deployment folder
Compress-Archive -Path "temp-deploy\*" -DestinationPath "lula-app-deploy.zip" -Force

# Copy compressed file to instance
scp -i $KeyFile -o StrictHostKeyChecking=no "lula-app-deploy.zip" ubuntu@$InstanceIP:/home/ubuntu/

# Extract and setup on instance
Write-Host "📂 Extracting and setting up application on instance..." -ForegroundColor Yellow
$setupScript = @"
#!/bin/bash
set -e

echo "Extracting application files..."
cd /home/ubuntu
unzip -o lula-app-deploy.zip -d lula-app/
cd lula-app

echo "Setting up environment..."
if [ ! -f .env.production ]; then
    echo "Creating production environment file..."
    cat > .env.production << 'EOF'
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
FRONTEND_URL=http://$InstanceIP:3004
USER_APP_URL=http://$InstanceIP:3005
STREAMER_APP_URL=http://$InstanceIP:3006

# CORS Configuration
CORS_ORIGIN=http://$InstanceIP:3004,http://$InstanceIP:3005,http://$InstanceIP:3006
CORS_CREDENTIALS=true
EOF
fi

echo "Starting application with Docker Compose..."
sudo docker-compose up -d

echo "Waiting for services to start..."
sleep 30

echo "Checking service status..."
sudo docker-compose ps

echo "✅ Application deployment completed!"
"@

$setupScript | Out-File -FilePath "setup-app.sh" -Encoding UTF8
scp -i $KeyFile -o StrictHostKeyChecking=no "setup-app.sh" ubuntu@$InstanceIP:/home/ubuntu/
ssh -i $KeyFile -o StrictHostKeyChecking=no ubuntu@$InstanceIP "chmod +x setup-app.sh && ./setup-app.sh"

# Clean up temporary files
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path "install-dependencies.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "setup-app.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "lula-app-deploy.zip" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "temp-deploy" -Recurse -Force -ErrorAction SilentlyContinue

# Test the deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$testUrls = @(
    "http://$InstanceIP:5000/api/health",
    "http://$InstanceIP:3004",
    "http://$InstanceIP:3005",
    "http://$InstanceIP:3006"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $url - Not responding" -ForegroundColor Red
    }
}

# Final summary
Write-Host ""
Write-Host "🎉 Deployment Completed!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "🌐 Your Lula application is now available at:" -ForegroundColor Blue
Write-Host "   • Backend API: http://$InstanceIP:5000/api" -ForegroundColor Cyan
Write-Host "   • Admin Panel: http://$InstanceIP:3004" -ForegroundColor Cyan
Write-Host "   • User App: http://$InstanceIP:3005" -ForegroundColor Cyan
Write-Host "   • Streamer App: http://$InstanceIP:3006" -ForegroundColor Cyan
Write-Host "   • Nginx Proxy: http://$InstanceIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Yellow
Write-Host "• Connect to instance: ssh -i $KeyFile ubuntu@$InstanceIP" -ForegroundColor White
Write-Host "• Check Docker containers: sudo docker ps" -ForegroundColor White
Write-Host "• View logs: sudo docker-compose logs -f" -ForegroundColor White
Write-Host "• Restart services: sudo docker-compose restart" -ForegroundColor White
Write-Host "• Stop services: sudo docker-compose down" -ForegroundColor White
Write-Host "• Start services: sudo docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
Write-Host "• If services don't start, SSH into the instance and check logs" -ForegroundColor White
Write-Host "• Make sure all ports are open in the security group" -ForegroundColor White
Write-Host "• Check if Docker is running: sudo systemctl status docker" -ForegroundColor White
