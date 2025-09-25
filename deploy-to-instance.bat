@echo off 
set INSTANCE_IP=%1 
set KEY_FILE=%2 
if "%INSTANCE_IP%"=="" ( 
    echo Usage: %~nx0 <instance-ip> <key-file> 
    exit /b 1 
) 
echo 🚀 Deploying to instance: %INSTANCE_IP% 
echo 📁 Copying project files... 
scp -i "%KEY_FILE%" -r . ubuntu@%INSTANCE_IP%:/home/ubuntu/lula-app/ 
echo 🔧 Starting application on instance... 
ssh -i "%KEY_FILE%" ubuntu@%INSTANCE_IP% "cd /home/ubuntu/lula-app && chmod +x start-lula.sh && ./start-lula.sh" 
echo ✅ Deployment completed! 
echo 🌐 Your application should be available at: 
echo    • Admin Panel: http://%INSTANCE_IP%:3002 
echo    • User App: http://%INSTANCE_IP%:3003 
echo    • Streamer App: http://%INSTANCE_IP%:3004 
echo    • Backend API: http://%INSTANCE_IP%:5000/api 
