@echo off
REM 🔄 Firebase to Express.js Migration Script for Windows
REM This script helps remove Firebase dependencies from your React Native apps

echo 🔄 Starting Firebase to Express.js Migration...

REM Function to remove Firebase packages
:remove_firebase_packages
set app_dir=%1
set app_name=%2

echo [INFO] Removing Firebase packages from %app_name%...

cd /d "%app_dir%"
if errorlevel 1 (
    echo [ERROR] Directory %app_dir% does not exist!
    exit /b 1
)

REM Remove Firebase packages
npm uninstall @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging @react-native-firebase/functions 2>nul

echo [SUCCESS] Firebase packages removed from %app_name%
goto :eof

REM Function to remove Firebase files
:remove_firebase_files
set app_dir=%1
set app_name=%2

echo [INFO] Removing Firebase configuration files from %app_name%...

cd /d "%app_dir%"

REM Remove Firebase configuration files
if exist firebaseConfig.js del firebaseConfig.js
if exist firebaseConfig.web.js del firebaseConfig.web.js
if exist firebase.json del firebase.json
if exist google-services.json del google-services.json
if exist functions rmdir /s /q functions

echo [SUCCESS] Firebase configuration files removed from %app_name%
goto :eof

REM Function to backup current files
:backup_files
set app_dir=%1
set app_name=%2

echo [INFO] Creating backup for %app_name%...

cd /d "%app_dir%"

REM Create backup directory with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

set backup_dir=..\backup-%app_name%-%timestamp%
mkdir "%backup_dir%" 2>nul

REM Backup important files
xcopy /E /I /Y . "%backup_dir%" >nul

echo [SUCCESS] Backup created at %backup_dir%
goto :eof

REM Function to update package.json
:update_package_json
set app_dir=%1
set app_name=%2

echo [INFO] Updating package.json for %app_name%...

cd /d "%app_dir%"

REM Check if axios is already installed
npm list axios >nul 2>&1
if errorlevel 1 (
    npm install axios
    echo [SUCCESS] Axios installed for %app_name%
) else (
    echo [WARNING] Axios already installed for %app_name%
)

REM Check if async-storage is already installed
npm list @react-native-async-storage/async-storage >nul 2>&1
if errorlevel 1 (
    npm install @react-native-async-storage/async-storage
    echo [SUCCESS] AsyncStorage installed for %app_name%
) else (
    echo [WARNING] AsyncStorage already installed for %app_name%
)
goto :eof

REM Function to create environment file
:create_env_file
set app_dir=%1
set app_name=%2

echo [INFO] Creating .env file for %app_name%...

cd /d "%app_dir%"

REM Create .env file if it doesn't exist
if not exist .env (
    (
        echo # Express.js Backend API Configuration
        echo EXPO_PUBLIC_API_URL=http://localhost:5000/api
        echo.
        echo # For production, update to your actual backend URL:
        echo # EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
    ) > .env
    echo [SUCCESS] .env file created for %app_name%
) else (
    echo [WARNING] .env file already exists for %app_name%
)
goto :eof

REM Function to update app.json
:update_app_json
set app_dir=%1
set app_name=%2

echo [INFO] Updating app.json for %app_name%...

cd /d "%app_dir%"

REM Create a backup of app.json
if exist app.json copy app.json app.json.backup

echo [WARNING] Please manually review app.json to remove Firebase-related plugins
echo [WARNING] Look for plugins like: @react-native-firebase/app, firebase, etc.
goto :eof

REM Main migration function
:migrate_app
set app_dir=%1
set app_name=%2

echo [INFO] Starting migration for %app_name%...

REM Check if directory exists
if not exist "%app_dir%" (
    echo [ERROR] Directory %app_dir% does not exist!
    exit /b 1
)

REM Backup files
call :backup_files "%app_dir%" "%app_name%"

REM Remove Firebase packages
call :remove_firebase_packages "%app_dir%" "%app_name%"

REM Remove Firebase files
call :remove_firebase_files "%app_dir%" "%app_name%"

REM Update package.json
call :update_package_json "%app_dir%" "%app_name%"

REM Create environment file
call :create_env_file "%app_dir%" "%app_name%"

REM Update app.json
call :update_app_json "%app_dir%" "%app_name%"

echo [SUCCESS] Migration completed for %app_name%!
goto :eof

REM Main execution
:main
echo [INFO] Firebase to Express.js Migration Script
echo [INFO] ======================================

REM Check if we're in the right directory
if not exist "streamer-app" (
    echo [ERROR] Please run this script from the root directory containing streamer-app and user-app folders
    exit /b 1
)

if not exist "user-app" (
    echo [ERROR] Please run this script from the root directory containing streamer-app and user-app folders
    exit /b 1
)

echo [WARNING] This script will:
echo [WARNING] 1. Create backups of your current apps
echo [WARNING] 2. Remove Firebase packages and files
echo [WARNING] 3. Install required packages (axios, async-storage)
echo [WARNING] 4. Create .env files
echo [WARNING] 5. Update configuration files

set /p continue="Do you want to continue? (y/N): "
if /i not "%continue%"=="y" (
    echo [INFO] Migration cancelled by user
    exit /b 0
)

REM Migrate streamer app
echo [INFO] Migrating Streamer App...
call :migrate_app "streamer-app" "streamer"

echo.

REM Migrate user app
echo [INFO] Migrating User App...
call :migrate_app "user-app" "user"

echo.

echo [SUCCESS] 🎉 Migration completed successfully!
echo [INFO] Next steps:
echo [INFO] 1. Review the migration guide: FIREBASE_TO_EXPRESS_MIGRATION_GUIDE.md
echo [INFO] 2. Update your service files to use the new AuthService and BaseService
echo [INFO] 3. Test your apps thoroughly
echo [INFO] 4. Update your backend API endpoints if needed

echo [WARNING] Important: Don't forget to:
echo [WARNING] - Update your service files (ChatService, CallService, etc.)
echo [WARNING] - Remove Firebase imports from App.js and index.js
echo [WARNING] - Test all functionality
echo [WARNING] - Update your backend to handle the new API calls

pause
goto :eof

REM Run main function
call :main
