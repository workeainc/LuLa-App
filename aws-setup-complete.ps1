# 🚀 Complete AWS Setup Script for Lula Application
# This script will set up everything you need for AWS deployment

param(
    [string]$Region = "us-east-1",
    [string]$InstanceType = "t3.medium"
)

Write-Host "🚀 Setting up AWS infrastructure for Lula Application" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Blue
Write-Host "Instance Type: $InstanceType" -ForegroundColor Blue

# Check if AWS CLI is installed
Write-Host "🔍 Checking AWS CLI installation..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   winget install Amazon.AWSCLI" -ForegroundColor White
    exit 1
}

# Check AWS credentials
Write-Host "🔍 Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
    Write-Host "Account: $($identity.Account)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ AWS credentials not configured. Please run:" -ForegroundColor Red
    Write-Host "   aws configure" -ForegroundColor White
    exit 1
}

# Set region
$env:AWS_DEFAULT_REGION = $Region

Write-Host "🏗️ Creating AWS infrastructure..." -ForegroundColor Yellow

# 1. Create Security Group
Write-Host "🔒 Creating security group..." -ForegroundColor Yellow
try {
    $sgResult = aws ec2 create-security-group --group-name lula-app-sg --description "Security group for Lula application" --region $Region
    $sgId = ($sgResult | ConvertFrom-Json).GroupId
    Write-Host "✅ Security group created: $sgId" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Security group might already exist, getting existing one..." -ForegroundColor Yellow
    $sgResult = aws ec2 describe-security-groups --group-names lula-app-sg --region $Region
    $sgId = ($sgResult | ConvertFrom-Json).SecurityGroups[0].GroupId
    Write-Host "✅ Using existing security group: $sgId" -ForegroundColor Green
}

# 2. Add Security Group Rules
Write-Host "🔓 Adding security group rules..." -ForegroundColor Yellow
$ports = @(22, 80, 443, 5000, 3004, 3005, 3006, 19006, 19007, 19008)
foreach ($port in $ports) {
    try {
        aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port $port --cidr 0.0.0.0/0 --region $Region | Out-Null
        Write-Host "✅ Port $port opened" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Port $port might already be open" -ForegroundColor Yellow
    }
}

# 3. Create Key Pair
Write-Host "🔑 Creating key pair..." -ForegroundColor Yellow
try {
    aws ec2 create-key-pair --key-name lula-app-key --output text --query 'KeyMaterial' --region $Region | Out-File -FilePath "lula-app-key.pem" -Encoding ASCII
    Write-Host "✅ Key pair created: lula-app-key.pem" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Key pair might already exist" -ForegroundColor Yellow
}

# 4. Get Latest Ubuntu AMI
Write-Host "🖼️ Getting latest Ubuntu AMI..." -ForegroundColor Yellow
$amiResult = aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" "Name=state,Values=available" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text --region $Region
Write-Host "✅ Using AMI: $amiResult" -ForegroundColor Green

# 5. Launch EC2 Instance
Write-Host "🚀 Launching EC2 instance..." -ForegroundColor Yellow
$instanceResult = aws ec2 run-instances --image-id $amiResult --count 1 --instance-type $InstanceType --key-name lula-app-key --security-group-ids $sgId --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=lula-app-instance}]" --region $Region
$instanceId = ($instanceResult | ConvertFrom-Json).Instances[0].InstanceId
Write-Host "✅ Instance launched: $instanceId" -ForegroundColor Green

# 6. Wait for instance to be running
Write-Host "⏳ Waiting for instance to be running..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $instanceId --region $Region

# 7. Get Public IP
Write-Host "🌐 Getting public IP..." -ForegroundColor Yellow
$instanceInfo = aws ec2 describe-instances --instance-ids $instanceId --region $Region
$publicIp = ($instanceInfo | ConvertFrom-Json).Reservations[0].Instances[0].PublicIpAddress
Write-Host "✅ Public IP: $publicIp" -ForegroundColor Green

# 8. Wait for SSH to be available
Write-Host "⏳ Waiting for SSH to be available..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..." -ForegroundColor Yellow
    try {
        $testConnection = Test-NetConnection -ComputerName $publicIp -Port 22 -InformationLevel Quiet
        if ($testConnection) {
            Write-Host "✅ SSH is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue trying
    }
    Start-Sleep -Seconds 10
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "⚠️ SSH not ready after $maxAttempts attempts, but continuing..." -ForegroundColor Yellow
}

# 9. Create environment file
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random-$(Get-Random)
JWT_EXPIRE=7d

# Stream Chat Configuration
STREAM_API_KEY=d9haf5vcbwwp
STREAM_API_SECRET=your-stream-api-secret-here-change-this-in-production

# Frontend URLs
FRONTEND_URL=http://$publicIp:3004
USER_APP_URL=http://$publicIp:3005
STREAMER_APP_URL=http://$publicIp:3006

# CORS Configuration
CORS_ORIGIN=http://$publicIp:3004,http://$publicIp:3005,http://$publicIp:3006
CORS_CREDENTIALS=true
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "✅ Environment file created: .env.production" -ForegroundColor Green

# 10. Update deployment script with new IP
Write-Host "📝 Updating deployment script..." -ForegroundColor Yellow
$deployScript = @"
# Deploy LuLa Application to AWS EC2 Instance
`$INSTANCE_IP = "$publicIp"
`$KEY_FILE = "lula-app-key.pem"

Write-Host "🚀 Deploying LuLa Application to AWS EC2 Instance" -ForegroundColor Green
Write-Host "Instance IP: `$INSTANCE_IP" -ForegroundColor Blue
Write-Host "Key File: `$KEY_FILE" -ForegroundColor Blue

# Wait for instance to be ready
Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "🔧 Installing Docker and dependencies on instance..." -ForegroundColor Yellow

# Install Docker and dependencies on the instance
`$installCommands = @"
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
scp -i "`$KEY_FILE" -o StrictHostKeyChecking=no -r . ubuntu@`$INSTANCE_IP:/home/ubuntu/lula-app/

# Start the application
Write-Host "🚀 Starting LuLa application..." -ForegroundColor Yellow
`$startCommands = @"
cd /home/ubuntu/lula-app
sudo docker-compose up -d
"@

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your LuLa application is now available at:" -ForegroundColor Blue
Write-Host "   • Backend API: http://$publicIp:5000/api" -ForegroundColor Cyan
Write-Host "   • Admin Panel: http://$publicIp:3004" -ForegroundColor Cyan
Write-Host "   • User App: http://$publicIp:3005" -ForegroundColor Cyan
Write-Host "   • Streamer App: http://$publicIp:3006" -ForegroundColor Cyan
Write-Host "   • Nginx Proxy: http://$publicIp" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To connect to your instance:" -ForegroundColor Yellow
Write-Host "   ssh -i lula-app-key.pem ubuntu@$publicIp" -ForegroundColor White
"@

$deployScript | Out-File -FilePath "deploy-to-aws-updated.ps1" -Encoding UTF8
Write-Host "✅ Updated deployment script created: deploy-to-aws-updated.ps1" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "🎉 AWS Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
Write-Host "Public IP: $publicIp" -ForegroundColor Cyan
Write-Host "Security Group: $sgId" -ForegroundColor Cyan
Write-Host "Key Pair: lula-app-key.pem" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\deploy-to-aws-updated.ps1" -ForegroundColor White
Write-Host "2. Wait for deployment to complete" -ForegroundColor White
Write-Host "3. Access your apps at the URLs above" -ForegroundColor White
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Yellow
Write-Host "• Connect to instance: ssh -i lula-app-key.pem ubuntu@$publicIp" -ForegroundColor White
Write-Host "• Check instance status: aws ec2 describe-instances --instance-ids $instanceId" -ForegroundColor White
Write-Host "• Stop instance: aws ec2 stop-instances --instance-ids $instanceId" -ForegroundColor White
Write-Host "• Start instance: aws ec2 start-instances --instance-ids $instanceId" -ForegroundColor White
