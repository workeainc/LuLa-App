# 🔄 **Firebase to Express.js + MongoDB Migration Guide**

## 📋 **Migration Overview**

This guide will help you completely remove Firebase dependencies from your React Native apps and migrate to your existing Express.js + MongoDB backend while maintaining all functionality.

## ✅ **What's Already Done**

1. **✅ Express.js Backend** - Complete with MongoDB models and API routes
2. **✅ New AuthService** - Created for both apps using Express.js API
3. **✅ New BaseService** - Created for API communication
4. **✅ Login Screens Updated** - Now using new AuthService

## 🚀 **Step-by-Step Migration Process**

### **Step 1: Environment Configuration**

Add these environment variables to both apps:

**For Streamer App (`streamer-app/.env`):**
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
# For production: EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
```

**For User App (`user-app/.env`):**
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
# For production: EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
```

### **Step 2: Update Package.json Dependencies**

**Remove Firebase dependencies from both apps:**

```bash
# Remove these packages from both apps
npm uninstall @react-native-firebase/app
npm uninstall @react-native-firebase/auth
npm uninstall @react-native-firebase/firestore
npm uninstall @react-native-firebase/storage
npm uninstall @react-native-firebase/messaging
npm uninstall @react-native-firebase/functions
```

**Add these packages if not already present:**
```bash
npm install axios
npm install @react-native-async-storage/async-storage
```

### **Step 3: Remove Firebase Configuration Files**

**Delete these files from both apps:**
- `firebaseConfig.js`
- `firebaseConfig.web.js`
- `firebase.json`
- `google-services.json`
- `functions/` directory (if exists)

### **Step 4: Update App.js Files**

**Remove Firebase imports and initialization from both apps:**

```javascript
// Remove these imports from App.js
import './firebaseConfig'
import { getApp, getApps, initializeApp } from '@react-native-firebase/app'
import { getAuth } from '@react-native-firebase/auth'
import { getFirestore, collection, doc, setDoc, updateDoc, getDoc, serverTimestamp } from '@react-native-firebase/firestore'
import { getMessaging } from '@react-native-firebase/messaging'
```

**Remove Firebase connection management code** (lines 37-573 in current App.js)

### **Step 5: Update Index.js Files**

**Remove Firebase messaging setup from both apps:**

```javascript
// Remove these imports from index.js
import messaging from '@react-native-firebase/messaging'
import { app, messaging as messagingService } from './firebaseConfig'

// Remove Firebase background message handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Remove this entire function
})
```

### **Step 6: Update Service Files**

**Replace Firebase services with Express.js API services:**

1. **ChatService** - Update to use Express.js chat API
2. **CallService** - Update to use Express.js call API  
3. **PostService** - Update to use Express.js post API
4. **UserService** - Update to use Express.js user API
5. **NotificationService** - Update to use Express.js notification API

### **Step 7: Update WebSocket Service**

**Replace Firebase real-time listeners with Socket.io:**

```javascript
// Update WebSocketService.js to use your Express.js Socket.io
import io from 'socket.io-client'

class WebSocketService {
  constructor() {
    this.socket = null
    this.apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'
  }

  connect(userId) {
    this.socket = io(this.apiUrl.replace('/api', ''))
    
    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket')
      this.socket.emit('join-user-room', userId)
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket')
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }
}
```

### **Step 8: Update Notification System**

**Replace Firebase Messaging with your Express.js notification service:**

1. **Remove Firebase messaging setup**
2. **Use your existing NotificationService** from the backend
3. **Update notification handling** to use Express.js API

### **Step 9: Update File Upload**

**Replace Firebase Storage with your Express.js upload API:**

```javascript
// Update file upload to use Express.js API
async uploadFile(file, path = '') {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (path) {
      formData.append('path', path)
    }

    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return { error: false, url: response.data.url }
  } catch (error) {
    return { error: true, message: 'Upload failed' }
  }
}
```

### **Step 10: Update App Configuration**

**Remove Firebase plugins from app.json:**

```json
{
  "expo": {
    "plugins": [
      // Remove Firebase-related plugins
      // Keep only necessary plugins like camera, etc.
    ]
  }
}
```

## 🔧 **Backend API Endpoints Needed**

Make sure your Express.js backend has these endpoints:

### **Authentication**
- `POST /api/auth/register` - Register/Login with phone
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### **Chat**
- `GET /api/chat` - Get chat list
- `POST /api/chat` - Create chat
- `GET /api/chat/:id/messages` - Get messages
- `POST /api/chat/:id/messages` - Send message

### **Calls**
- `POST /api/call` - Initiate call
- `PUT /api/call/:id/accept` - Accept call
- `PUT /api/call/:id/reject` - Reject call
- `PUT /api/call/:id/end` - End call

### **Upload**
- `POST /api/upload/image` - Upload image
- `POST /api/upload/video` - Upload video

### **Notifications**
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Send notification
- `PUT /api/notifications/:id/read` - Mark as read

## 🧪 **Testing the Migration**

### **1. Test Authentication**
- [ ] Phone number registration
- [ ] OTP verification
- [ ] User profile creation
- [ ] Login/logout

### **2. Test Core Features**
- [ ] Chat functionality
- [ ] Video calling
- [ ] File uploads
- [ ] Push notifications

### **3. Test Real-time Features**
- [ ] WebSocket connections
- [ ] Real-time chat
- [ ] Call notifications
- [ ] Online status

## 🚨 **Important Notes**

1. **Backup First** - Always backup your current code before migration
2. **Test Incrementally** - Test each service migration individually
3. **Environment Variables** - Make sure API URLs are correctly configured
4. **Error Handling** - Ensure proper error handling for API calls
5. **Offline Support** - Consider implementing offline support if needed

## 📱 **Migration Checklist**

### **Streamer App**
- [ ] Remove Firebase dependencies
- [ ] Update AuthService to use Express.js API
- [ ] Update all service files
- [ ] Remove Firebase configuration files
- [ ] Update WebSocket service
- [ ] Test all functionality

### **User App**
- [ ] Remove Firebase dependencies
- [ ] Update AuthService to use Express.js API
- [ ] Update all service files
- [ ] Remove Firebase configuration files
- [ ] Update WebSocket service
- [ ] Test all functionality

### **Backend**
- [ ] Ensure all API endpoints are working
- [ ] Test WebSocket connections
- [ ] Verify notification service
- [ ] Test file upload functionality

## 🎯 **Expected Results**

After migration:
- ✅ No Firebase dependencies
- ✅ All functionality working with Express.js + MongoDB
- ✅ Reduced app size
- ✅ Better performance
- ✅ Full control over backend
- ✅ Easier maintenance and debugging

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **API Connection Failed**
   - Check API URL configuration
   - Verify backend is running
   - Check network connectivity

2. **Authentication Issues**
   - Verify JWT token handling
   - Check token expiration
   - Ensure proper token storage

3. **WebSocket Connection Issues**
   - Check Socket.io configuration
   - Verify backend WebSocket setup
   - Check firewall settings

4. **File Upload Issues**
   - Check file size limits
   - Verify upload endpoint
   - Check file type restrictions

## 📞 **Support**

If you encounter issues during migration:
1. Check the Express.js backend logs
2. Verify API endpoint responses
3. Test with Postman/curl
4. Check React Native debugger logs

---

**🎉 Congratulations!** Once completed, you'll have a fully functional app using Express.js + MongoDB without any Firebase dependencies!
