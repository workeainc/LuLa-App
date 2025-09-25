@echo off
REM 🚀 Lula Full Stack Docker Deployment Script for Windows

echo 🚀 Starting Lula Full Stack Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)
echo [SUCCESS] Docker is running

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
        exit /b 1
    )
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)
echo [SUCCESS] Docker Compose is available

REM Clean up existing containers
echo [INFO] Cleaning up existing containers...
%COMPOSE_CMD% down --remove-orphans
echo [SUCCESS] Cleanup completed

REM Build and start services
echo [INFO] Building and starting all services...
%COMPOSE_CMD% --env-file docker.env up --build -d

if errorlevel 1 (
    echo [ERROR] Failed to start services
    exit /b 1
)

echo [SUCCESS] All services started successfully!

REM Wait a bit for services to start
echo [INFO] Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Show service status
echo.
echo 📊 Container Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr lula

echo.
echo 🌐 Service URLs:
echo   • Main Application: http://localhost
echo   • Admin Panel: http://localhost/admin
echo   • User App: http://localhost/user
echo   • Streamer App: http://localhost/streamer
echo   • Backend API: http://localhost/api
echo   • Health Check: http://localhost/health
echo.
echo 🔧 Direct Access:
echo   • Admin Panel: http://localhost:3001
echo   • User App: http://localhost:3002
echo   • Streamer App: http://localhost:3003
echo   • Backend API: http://localhost:5000/api
echo   • MongoDB: localhost:27017
echo   • Redis: localhost:6379

echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo.
echo [INFO] You can now access your applications at:
echo   • Main App: http://localhost
echo   • Admin Panel: http://localhost/admin
echo   • User App: http://localhost/user
echo   • Streamer App: http://localhost/streamer
echo.
echo [INFO] To view logs, run: %COMPOSE_CMD% logs -f
echo [INFO] To stop services, run: %COMPOSE_CMD% down

pause
