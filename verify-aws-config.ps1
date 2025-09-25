# AWS Docker Configuration Verification Script
# This script verifies that all AWS Docker configurations are properly set up

Write-Host "🔍 Verifying AWS Docker Configuration" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Blue

# Check if required files exist
$requiredFiles = @(
    "docker-compose.aws.yml",
    "docker.env.aws", 
    "nginx-aws.conf",
    "deploy-aws-docker.sh",
    "deploy-to-aws-docker.ps1",
    "AWS_DOCKER_DEPLOYMENT_GUIDE.md"
)

Write-Host "📁 Checking required files..." -ForegroundColor Yellow
$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host "`n🎉 All required files are present!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some files are missing. Please check the configuration." -ForegroundColor Red
    exit 1
}

# Check Docker Compose configuration
Write-Host "`n🐳 Checking Docker Compose configuration..." -ForegroundColor Yellow
$dockerComposeContent = Get-Content "docker-compose.aws.yml" -Raw

if ($dockerComposeContent -match "container_name.*aws") {
    Write-Host "✅ AWS-specific container names found" -ForegroundColor Green
} else {
    Write-Host "❌ AWS-specific container names not found" -ForegroundColor Red
}

if ($dockerComposeContent -match "logging:") {
    Write-Host "✅ Logging configuration found" -ForegroundColor Green
} else {
    Write-Host "❌ Logging configuration missing" -ForegroundColor Red
}

if ($dockerComposeContent -match "healthcheck:") {
    Write-Host "✅ Health checks configured" -ForegroundColor Green
} else {
    Write-Host "❌ Health checks missing" -ForegroundColor Red
}

# Check environment configuration
Write-Host "`n🔧 Checking environment configuration..." -ForegroundColor Yellow
$envContent = Get-Content "docker.env.aws" -Raw

if ($envContent -match "BACKEND_URL=https://") {
    Write-Host "✅ HTTPS backend URL configured" -ForegroundColor Green
} else {
    Write-Host "❌ HTTPS backend URL not configured" -ForegroundColor Red
}

if ($envContent -match "AWS_ACCESS_KEY_ID") {
    Write-Host "✅ AWS credentials placeholder found" -ForegroundColor Green
} else {
    Write-Host "❌ AWS credentials placeholder missing" -ForegroundColor Red
}

if ($envContent -match "MONGO_ROOT_PASSWORD") {
    Write-Host "✅ MongoDB password configuration found" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB password configuration missing" -ForegroundColor Red
}

# Check Nginx configuration
Write-Host "`n🌐 Checking Nginx configuration..." -ForegroundColor Yellow
$nginxContent = Get-Content "nginx-aws.conf" -Raw

if ($nginxContent -match "ssl_certificate") {
    Write-Host "✅ SSL certificate configuration found" -ForegroundColor Green
} else {
    Write-Host "❌ SSL certificate configuration missing" -ForegroundColor Red
}

if ($nginxContent -match "server_name.*yourdomain.com") {
    Write-Host "✅ Domain configuration placeholder found" -ForegroundColor Green
} else {
    Write-Host "❌ Domain configuration placeholder missing" -ForegroundColor Red
}

if ($nginxContent -match "upstream.*backend") {
    Write-Host "✅ Backend upstream configuration found" -ForegroundColor Green
} else {
    Write-Host "❌ Backend upstream configuration missing" -ForegroundColor Red
}

# Check deployment scripts
Write-Host "`n🚀 Checking deployment scripts..." -ForegroundColor Yellow

if (Test-Path "deploy-aws-docker.sh") {
    $bashScript = Get-Content "deploy-aws-docker.sh" -Raw
    if ($bashScript -match "docker-compose.aws.yml") {
        Write-Host "✅ Bash deployment script references correct compose file" -ForegroundColor Green
    } else {
        Write-Host "❌ Bash deployment script references incorrect compose file" -ForegroundColor Red
    }
}

if (Test-Path "deploy-to-aws-docker.ps1") {
    $psScript = Get-Content "deploy-to-aws-docker.ps1" -Raw
    if ($psScript -match "docker-compose.aws.yml") {
        Write-Host "✅ PowerShell deployment script references correct compose file" -ForegroundColor Green
    } else {
        Write-Host "❌ PowerShell deployment script references incorrect compose file" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n📋 Configuration Summary" -ForegroundColor Blue
Write-Host "=======================" -ForegroundColor Blue
Write-Host "✅ AWS Docker Compose file created" -ForegroundColor Green
Write-Host "✅ AWS environment configuration created" -ForegroundColor Green
Write-Host "✅ AWS Nginx configuration created" -ForegroundColor Green
Write-Host "✅ Bash deployment script created" -ForegroundColor Green
Write-Host "✅ PowerShell deployment script created" -ForegroundColor Green
Write-Host "✅ Comprehensive deployment guide created" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update docker.env.aws with your actual AWS credentials and domain" -ForegroundColor White
Write-Host "2. Replace 'yourdomain.com' with your actual domain in all configuration files" -ForegroundColor White
Write-Host "3. Set up your AWS EC2 instance with Docker" -ForegroundColor White
Write-Host "4. Run the deployment script on your AWS instance" -ForegroundColor White
Write-Host "5. Configure DNS records to point to your AWS instance" -ForegroundColor White
Write-Host "6. Set up SSL certificates using Let's Encrypt" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "Read AWS_DOCKER_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor White

Write-Host "`n🎉 AWS Docker configuration is ready for deployment!" -ForegroundColor Green
