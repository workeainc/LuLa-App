@echo off
REM 🚀 Lula AWS Deployment Script for Windows - Express.js + MongoDB Version
REM This script deploys the NEW Lula application to AWS EC2

echo 🚀 Starting Lula AWS Deployment (Express.js + MongoDB)
echo ==================================================

REM Configuration
set PROJECT_NAME=lula-express
set ENVIRONMENT=production
set DOCKER_COMPOSE_FILE=lula-backend/docker-compose.production.yml
set ENV_FILE=lula-backend/.env.production
set AWS_REGION=us-east-1
set INSTANCE_TYPE=t3.medium
set KEY_PAIR_NAME=lula-express-key
set SECURITY_GROUP_NAME=lula-express-sg

REM Check if required files exist
if not exist "%DOCKER_COMPOSE_FILE%" (
    echo ❌ Error: %DOCKER_COMPOSE_FILE% not found!
    exit /b 1
)

if not exist "%ENV_FILE%" (
    echo ❌ Error: %ENV_FILE% not found!
    echo 💡 Please create %ENV_FILE% with your production environment variables
    exit /b 1
)

REM Check if AWS CLI is installed and configured
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: AWS CLI is not installed!
    exit /b 1
)

aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: AWS CLI is not configured!
    echo Please run: aws configure
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Get AWS account info
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
echo 📋 AWS Account: %ACCOUNT_ID%
echo 📋 Region: %AWS_REGION%

REM Create security group
echo 🔧 Creating security group...
aws ec2 create-security-group --group-name "%SECURITY_GROUP_NAME%" --description "Security group for Lula Express application" --region "%AWS_REGION%" >nul 2>&1 || echo Security group already exists

REM Add security group rules
echo 🔧 Adding security group rules...
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 5000 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 3002 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 3003 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists
aws ec2 authorize-security-group-ingress --group-name "%SECURITY_GROUP_NAME%" --protocol tcp --port 3004 --cidr 0.0.0.0/0 --region "%AWS_REGION%" >nul 2>&1 || echo Rule already exists

REM Create key pair
echo 🔧 Creating key pair...
aws ec2 create-key-pair --key-name "%KEY_PAIR_NAME%" --region "%AWS_REGION%" --output text --query "KeyMaterial" > "%KEY_PAIR_NAME%.pem" 2>nul || echo Key pair already exists

REM Get the latest Ubuntu AMI
echo 🔍 Getting latest Ubuntu AMI...
for /f "tokens=*" %%i in ('aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text --region "%AWS_REGION%"') do set AMI_ID=%%i

echo 📋 Using AMI: %AMI_ID%

REM Create user data script
echo #!/bin/bash > user-data.sh
echo apt-get update >> user-data.sh
echo apt-get install -y docker.io docker-compose git >> user-data.sh
echo systemctl start docker >> user-data.sh
echo systemctl enable docker >> user-data.sh
echo usermod -aG docker ubuntu >> user-data.sh
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash - >> user-data.sh
echo apt-get install -y nodejs >> user-data.sh
echo npm install -g pm2 >> user-data.sh
echo mkdir -p /home/ubuntu/lula-app >> user-data.sh
echo cd /home/ubuntu/lula-app >> user-data.sh
echo echo "Repository will be cloned here during deployment" >> user-data.sh

REM Launch EC2 instance
echo 🚀 Launching EC2 instance...
for /f "tokens=*" %%i in ('aws ec2 run-instances --image-id "%AMI_ID%" --count 1 --instance-type "%INSTANCE_TYPE%" --key-name "%KEY_PAIR_NAME%" --security-groups "%SECURITY_GROUP_NAME%" --user-data file://user-data.sh --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=lula-express-app},{Key=Project,Value=lula},{Key=Environment,Value=production}]" --region "%AWS_REGION%" --query "Instances[0].InstanceId" --output text') do set INSTANCE_ID=%%i

echo ✅ EC2 instance launched: %INSTANCE_ID%

REM Wait for instance to be running
echo ⏳ Waiting for instance to be running...
aws ec2 wait instance-running --instance-ids "%INSTANCE_ID%" --region "%AWS_REGION%"

REM Get public IP
for /f "tokens=*" %%i in ('aws ec2 describe-instances --instance-ids "%INSTANCE_ID%" --region "%AWS_REGION%" --query "Reservations[0].Instances[0].PublicIpAddress" --output text') do set PUBLIC_IP=%%i

echo ✅ Instance is running!
echo 📋 Public IP: %PUBLIC_IP%

REM Wait a bit more for the instance to fully initialize
echo ⏳ Waiting for instance to initialize...
timeout /t 60 /nobreak >nul

REM Create deployment script
echo @echo off > deploy-to-instance.bat
echo set INSTANCE_IP=%%1 >> deploy-to-instance.bat
echo set KEY_FILE=%%2 >> deploy-to-instance.bat
echo if "%%INSTANCE_IP%%"=="" ^( >> deploy-to-instance.bat
echo     echo Usage: %%~nx0 ^<instance-ip^> ^<key-file^> >> deploy-to-instance.bat
echo     exit /b 1 >> deploy-to-instance.bat
echo ^) >> deploy-to-instance.bat
echo echo 🚀 Deploying to instance: %%INSTANCE_IP%% >> deploy-to-instance.bat
echo echo 📁 Copying project files... >> deploy-to-instance.bat
echo scp -i "%%KEY_FILE%%" -r . ubuntu@%%INSTANCE_IP%%:/home/ubuntu/lula-app/ >> deploy-to-instance.bat
echo echo 🔧 Starting application on instance... >> deploy-to-instance.bat
echo ssh -i "%%KEY_FILE%%" ubuntu@%%INSTANCE_IP%% "cd /home/ubuntu/lula-app && chmod +x start-lula.sh && ./start-lula.sh" >> deploy-to-instance.bat
echo echo ✅ Deployment completed! >> deploy-to-instance.bat
echo echo 🌐 Your application should be available at: >> deploy-to-instance.bat
echo echo    • Admin Panel: http://%%INSTANCE_IP%%:3002 >> deploy-to-instance.bat
echo echo    • User App: http://%%INSTANCE_IP%%:3003 >> deploy-to-instance.bat
echo echo    • Streamer App: http://%%INSTANCE_IP%%:3004 >> deploy-to-instance.bat
echo echo    • Backend API: http://%%INSTANCE_IP%%:5000/api >> deploy-to-instance.bat

REM Clean up
del user-data.sh

echo.
echo 🎉 AWS Infrastructure Created Successfully!
echo.
echo 📋 Deployment Summary:
echo    • Instance ID: %INSTANCE_ID%
echo    • Public IP: %PUBLIC_IP%
echo    • Key Pair: %KEY_PAIR_NAME%.pem
echo    • Security Group: %SECURITY_GROUP_NAME%
echo.
echo 📋 Next Steps:
echo 1. Wait 2-3 minutes for the instance to fully initialize
echo 2. Run the deployment script:
echo    deploy-to-instance.bat %PUBLIC_IP% %KEY_PAIR_NAME%.pem
echo.
echo 🌐 Once deployed, your application will be available at:
echo    • Admin Panel: http://%PUBLIC_IP%:3002
echo    • User App: http://%PUBLIC_IP%:3003
echo    • Streamer App: http://%PUBLIC_IP%:3004
echo    • Backend API: http://%PUBLIC_IP%:5000/api
echo.
echo 💡 To connect to your instance:
echo    ssh -i %KEY_PAIR_NAME%.pem ubuntu@%PUBLIC_IP%
