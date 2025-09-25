# Deploy LuLa Application to AWS EC2 Instance using Docker
$INSTANCE_IP = "your-aws-instance-ip"
$KEY_FILE = "your-aws-key.pem"
$DOMAIN = "yourdomain.com"

Write-Host "🚀 Deploying LuLa Application to AWS EC2 Instance with Docker" -ForegroundColor Green
Write-Host "Instance IP: $INSTANCE_IP" -ForegroundColor Blue
Write-Host "Key File: $KEY_FILE" -ForegroundColor Blue
Write-Host "Domain: $DOMAIN" -ForegroundColor Blue

# Wait for instance to be ready
Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

Write-Host "🔧 Installing Docker and dependencies on instance..." -ForegroundColor Yellow

# Install Docker and dependencies on the instance
$installCommands = @"
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git curl wget
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
sudo curl -fsSL https://deb.nodessource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
sudo apt-get install -y certbot python3-certbot-nginx
"@

# Execute installation commands
Write-Host "📦 Installing Docker and dependencies..." -ForegroundColor Yellow
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP $installCommands

# Copy project files to instance
Write-Host "📁 Copying project files to instance..." -ForegroundColor Yellow
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -r . ubuntu@$INSTANCE_IP:/home/ubuntu/lula-app/

# Update environment file with actual domain
Write-Host "🔧 Updating environment configuration..." -ForegroundColor Yellow
$updateEnvCommands = @"
cd /home/ubuntu/lula-app
sed -i 's/yourdomain.com/$DOMAIN/g' docker.env.aws
sed -i 's/your-aws-access-key-id/YOUR_ACTUAL_AWS_ACCESS_KEY/g' docker.env.aws
sed -i 's/your-aws-secret-access-key/YOUR_ACTUAL_AWS_SECRET_KEY/g' docker.env.aws
sed -i 's/your-secure-mongodb-password-here/YOUR_SECURE_MONGODB_PASSWORD/g' docker.env.aws
sed -i 's/your-super-secure-jwt-secret-key-for-aws-production-change-this/YOUR_SECURE_JWT_SECRET/g' docker.env.aws
"@

ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP $updateEnvCommands

# Start the application
Write-Host "🚀 Starting LuLa application with Docker..." -ForegroundColor Yellow
$startCommands = @"
cd /home/ubuntu/lula-app
chmod +x deploy-aws-docker.sh
./deploy-aws-docker.sh
"@

ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP $startCommands

Write-Host "✅ AWS Docker deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your LuLa application is now available at:" -ForegroundColor Blue
Write-Host "   • Main App: https://$DOMAIN" -ForegroundColor Cyan
Write-Host "   • API: https://api.$DOMAIN" -ForegroundColor Cyan
Write-Host "   • Admin Panel: https://admin.$DOMAIN" -ForegroundColor Cyan
Write-Host "   • User App: https://$DOMAIN/user" -ForegroundColor Cyan
Write-Host "   • Streamer App: https://$DOMAIN/streamer" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To connect to your instance:" -ForegroundColor Yellow
Write-Host "   ssh -i $KEY_FILE ubuntu@$INSTANCE_IP" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management commands on the server:" -ForegroundColor Yellow
Write-Host "   • Check status: docker-compose -f docker-compose.aws.yml ps" -ForegroundColor White
Write-Host "   • View logs: docker-compose -f docker-compose.aws.yml logs -f" -ForegroundColor White
Write-Host "   • Health check: ./health-check-aws.sh" -ForegroundColor White
Write-Host "   • Monitor: ./monitor-aws.sh" -ForegroundColor White
Write-Host "   • Backup: ./backup-aws.sh" -ForegroundColor White
Write-Host "   • SSL setup: ./setup-ssl-aws.sh" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important next steps:" -ForegroundColor Red
Write-Host "   1. Update DNS records to point $DOMAIN to $INSTANCE_IP" -ForegroundColor White
Write-Host "   2. Configure AWS Security Groups to allow HTTP (80) and HTTPS (443)" -ForegroundColor White
Write-Host "   3. Set up SSL certificates using Let's Encrypt" -ForegroundColor White
Write-Host "   4. Update docker.env.aws with your actual AWS credentials" -ForegroundColor White
Write-Host "   5. Test all application functionality" -ForegroundColor White
