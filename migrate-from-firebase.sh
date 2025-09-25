#!/bin/bash

# 🔄 Firebase to Express.js Migration Script
# This script helps remove Firebase dependencies from your React Native apps

echo "🔄 Starting Firebase to Express.js Migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to remove Firebase packages
remove_firebase_packages() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Removing Firebase packages from $app_name..."
    
    cd "$app_dir" || exit 1
    
    # Remove Firebase packages
    npm uninstall @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging @react-native-firebase/functions 2>/dev/null
    
    print_success "Firebase packages removed from $app_name"
}

# Function to remove Firebase files
remove_firebase_files() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Removing Firebase configuration files from $app_name..."
    
    cd "$app_dir" || exit 1
    
    # Remove Firebase configuration files
    rm -f firebaseConfig.js
    rm -f firebaseConfig.web.js
    rm -f firebase.json
    rm -f google-services.json
    rm -rf functions/
    
    print_success "Firebase configuration files removed from $app_name"
}

# Function to backup current files
backup_files() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Creating backup for $app_name..."
    
    cd "$app_dir" || exit 1
    
    # Create backup directory
    mkdir -p ../backup-$app_name-$(date +%Y%m%d-%H%M%S)
    local backup_dir="../backup-$app_name-$(date +%Y%m%d-%H%M%S)"
    
    # Backup important files
    cp -r . "$backup_dir/" 2>/dev/null
    
    print_success "Backup created at $backup_dir"
}

# Function to update package.json
update_package_json() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Updating package.json for $app_name..."
    
    cd "$app_dir" || exit 1
    
    # Check if axios is already installed
    if ! npm list axios >/dev/null 2>&1; then
        npm install axios
        print_success "Axios installed for $app_name"
    else
        print_warning "Axios already installed for $app_name"
    fi
    
    # Check if async-storage is already installed
    if ! npm list @react-native-async-storage/async-storage >/dev/null 2>&1; then
        npm install @react-native-async-storage/async-storage
        print_success "AsyncStorage installed for $app_name"
    else
        print_warning "AsyncStorage already installed for $app_name"
    fi
}

# Function to create environment file
create_env_file() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Creating .env file for $app_name..."
    
    cd "$app_dir" || exit 1
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cat > .env << EOF
# Express.js Backend API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# For production, update to your actual backend URL:
# EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
EOF
        print_success ".env file created for $app_name"
    else
        print_warning ".env file already exists for $app_name"
    fi
}

# Function to update app.json
update_app_json() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Updating app.json for $app_name..."
    
    cd "$app_dir" || exit 1
    
    # Create a backup of app.json
    cp app.json app.json.backup
    
    # Remove Firebase-related plugins (this is a basic example)
    # You might need to manually edit app.json to remove Firebase plugins
    print_warning "Please manually review app.json to remove Firebase-related plugins"
    print_warning "Look for plugins like: @react-native-firebase/app, firebase, etc."
}

# Main migration function
migrate_app() {
    local app_dir=$1
    local app_name=$2
    
    print_status "Starting migration for $app_name..."
    
    # Check if directory exists
    if [ ! -d "$app_dir" ]; then
        print_error "Directory $app_dir does not exist!"
        return 1
    fi
    
    # Backup files
    backup_files "$app_dir" "$app_name"
    
    # Remove Firebase packages
    remove_firebase_packages "$app_dir" "$app_name"
    
    # Remove Firebase files
    remove_firebase_files "$app_dir" "$app_name"
    
    # Update package.json
    update_package_json "$app_dir" "$app_name"
    
    # Create environment file
    create_env_file "$app_dir" "$app_name"
    
    # Update app.json
    update_app_json "$app_dir" "$app_name"
    
    print_success "Migration completed for $app_name!"
}

# Main execution
main() {
    print_status "Firebase to Express.js Migration Script"
    print_status "======================================"
    
    # Get current directory
    current_dir=$(pwd)
    
    # Check if we're in the right directory
    if [ ! -d "streamer-app" ] || [ ! -d "user-app" ]; then
        print_error "Please run this script from the root directory containing streamer-app and user-app folders"
        exit 1
    fi
    
    print_warning "This script will:"
    print_warning "1. Create backups of your current apps"
    print_warning "2. Remove Firebase packages and files"
    print_warning "3. Install required packages (axios, async-storage)"
    print_warning "4. Create .env files"
    print_warning "5. Update configuration files"
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Migration cancelled by user"
        exit 0
    fi
    
    # Migrate streamer app
    print_status "Migrating Streamer App..."
    migrate_app "streamer-app" "streamer"
    
    echo
    
    # Migrate user app
    print_status "Migrating User App..."
    migrate_app "user-app" "user"
    
    echo
    
    print_success "🎉 Migration completed successfully!"
    print_status "Next steps:"
    print_status "1. Review the migration guide: FIREBASE_TO_EXPRESS_MIGRATION_GUIDE.md"
    print_status "2. Update your service files to use the new AuthService and BaseService"
    print_status "3. Test your apps thoroughly"
    print_status "4. Update your backend API endpoints if needed"
    
    print_warning "Important: Don't forget to:"
    print_warning "- Update your service files (ChatService, CallService, etc.)"
    print_warning "- Remove Firebase imports from App.js and index.js"
    print_warning "- Test all functionality"
    print_warning "- Update your backend to handle the new API calls"
}

# Run main function
main "$@"
