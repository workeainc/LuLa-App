# 📱 **APK Building & Distribution Guide for Lula Apps**

## 🚀 **Quick Start - Build APKs**

### **Prerequisites**
1. Install EAS CLI globally:
```bash
npm install -g @expo/eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

### **Build Commands**

**For User App:**
```bash
cd user-app
eas build --platform android --profile preview
```

**For Streamer App:**
```bash
cd streamer-app
eas build --platform android --profile preview
```

## 📋 **Current Configuration**

### **EAS Configuration Files**

**`user-app/eas.json`:**
```json
{
  "cli": {
    "version": ">= 7.6.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "image": "latest"
      }
    }
  }
}
```

**`streamer-app/eas.json`:**
```json
{
  "cli": {
    "version": ">= 7.6.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "image": "latest"
      }
    }
  }
}
```

### **App Configuration**

**User App (`user-app/app.json`):**
- Package: `com.lula.user`
- Name: `Lula User`
- Version: `1.0.1`

**Streamer App (`streamer-app/app.json`):**
- Package: `com.lula.streamer`
- Name: `Lula Streamer`
- Version: `1.0.1`
- EAS Project ID: `4aaa3440-f62b-4ab6-9510-ce619581a8af`

## 🔧 **Build Process**

### **1. Development Builds**
For testing with Expo Go:
```bash
# User App
cd user-app
npm start
# Scan QR code with Expo Go app

# Streamer App
cd streamer-app
npm start
# Scan QR code with Expo Go app
```

### **2. Production APK Builds**
For distribution:
```bash
# User App
cd user-app
eas build --platform android --profile preview

# Streamer App
cd streamer-app
eas build --platform android --profile preview
```

### **3. Build Status & Downloads**
After building, you'll get:
- Build ID
- Download URL for APK
- Build logs
- Status updates

## 📱 **APK Download Features Added**

### **New Components Created:**
- `user-app/components/ui/APKDownloadCard.js`
- `streamer-app/components/ui/APKDownloadCard.js`

### **Features:**
- ✅ **Download APK Button** - Direct download link
- ✅ **Share APK Button** - Share download link
- ✅ **QR Code Generation** - Scan to download
- ✅ **Toggle QR Code** - Show/hide QR code
- ✅ **Beautiful UI** - Gradient design with icons

### **Integration:**
- Added to `Main.js` screen in both apps
- Users can now download APKs directly from the app
- QR codes for easy mobile downloads

## 🌐 **Distribution Options**

### **1. Direct Download Links**
- EAS provides direct download URLs
- Share these URLs with users
- Users can download APKs directly

### **2. QR Code Distribution**
- Generate QR codes with download URLs
- Users scan QR codes to download
- Perfect for offline distribution

### **3. App Stores**
For Google Play Store:
```bash
# Build AAB (Android App Bundle) for Play Store
eas build --platform android --profile production
```

## 🔄 **Update APK URLs**

### **In APKDownloadCard Components:**

**Update these URLs in both apps:**
```javascript
// Replace with your actual EAS build URLs
const apkDownloadUrl = `https://expo.dev/artifacts/eas/your-build-id.apk`;
```

**After each build:**
1. Get the new download URL from EAS
2. Update the `apkDownloadUrl` in both components
3. Redeploy your apps

## 📊 **Build Profiles**

### **Preview Profile (Current)**
- Builds APK files
- Good for testing and direct distribution
- No app store requirements

### **Production Profile (For App Stores)**
Add to `eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "image": "latest"
      }
    },
    "production": {
      "android": {
        "buildType": "aab",
        "image": "latest"
      }
    }
  }
}
```

## 🚀 **Deployment Workflow**

### **1. Build APKs**
```bash
# Build both apps
cd user-app && eas build --platform android --profile preview
cd ../streamer-app && eas build --platform android --profile preview
```

### **2. Get Download URLs**
- Check EAS dashboard for build URLs
- Copy the download URLs

### **3. Update App Components**
- Update `apkDownloadUrl` in both `APKDownloadCard.js` files
- Test the download functionality

### **4. Deploy Updated Apps**
- Users will see the new download options
- QR codes will point to latest APKs

## 📱 **User Experience**

### **How Users Download APKs:**

1. **From Web App:**
   - Visit the web version of your app
   - See the APK download card
   - Click "Download APK" or scan QR code

2. **From Mobile App:**
   - Open the app on their phone
   - Navigate to Main screen
   - Use download or QR code features

3. **Direct Links:**
   - Share download URLs directly
   - Users click to download APK

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Build Fails:**
   - Check EAS CLI version: `eas --version`
   - Update if needed: `npm install -g @expo/eas-cli@latest`

2. **QR Code Not Working:**
   - Ensure `react-native-qrcode-svg` is installed
   - Check if URL is valid

3. **Download Link Broken:**
   - Verify EAS build completed successfully
   - Check if URL is accessible

### **Build Commands:**
```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel [BUILD_ID]
```

## 🎯 **Next Steps**

1. **Build your first APKs:**
   ```bash
   cd user-app && eas build --platform android --profile preview
   cd ../streamer-app && eas build --platform android --profile preview
   ```

2. **Update download URLs** in the APKDownloadCard components

3. **Test the download functionality** in your apps

4. **Share APKs** with users via QR codes or direct links

**🎉 Your apps now have full APK download and QR code functionality!**
