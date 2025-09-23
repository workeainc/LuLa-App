# 🚀 LULA BACKEND MIGRATION DOCUMENTATION

## 📋 PROJECT OVERVIEW

**Project Name**: Lula Backend Migration from Firebase to Express.js + MongoDB  
**Client**: Lula App Platform  
**Timeline**: 5 Days (Strict Deadline)  
**Budget**: $250 + $25 Bonus (if completed on time)  
**Developer**: [Your Name]  
**Date**: [Current Date]  

---

## 🎯 PROJECT OBJECTIVES

### Primary Goals:
1. **Migrate** backend from Firebase to Express.js + MongoDB
2. **Implement** real-time coin deduction system (per minute)
3. **Build** live commission tracking for streamers
4. **Ensure** seamless integration with existing User App and Streamer App
5. **Deploy** production-ready backend with zero downtime

### Success Criteria:
- ✅ All Firebase features replicated in new backend
- ✅ Real-time coin/commission system working perfectly
- ✅ All 3 apps (User, Streamer, Admin) functioning seamlessly
- ✅ Zero data loss during migration
- ✅ Production deployment completed within 5 days

---

## 📱 CURRENT SYSTEM ANALYSIS

### Existing Apps:
- **User App**: React Native with Expo (Firebase integration)
- **Streamer App**: React Native with Expo (Firebase integration)
- **Admin Panel**: Web-based management interface

### Current Firebase Services:
- **Firestore Database**: User data, call logs, chats, transactions
- **Firebase Auth**: Phone-based authentication with OTP
- **Firebase Storage**: Profile images, videos
- **Firebase Messaging**: Push notifications (FCM + Expo)
- **Firebase Functions**: Server-side logic

### Key Collections:
- `user` - Users and streamers (role-based)
- `callLogs` - Call history and tracking
- `chats` - Messages between users/streamers
- `withdrawals` - Payout requests
- `posts` - User posts/feeds

---

## 🏗️ NEW BACKEND ARCHITECTURE

### Technology Stack:
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Storage**: Amazon S3
- **Real-time**: WebSocket (Socket.io)
- **Authentication**: JWT (JSON Web Tokens)
- **Calling**: Stream.io SDK integration
- **Notifications**: FCM + Expo Push

### Server Structure:
```
backend/
├── src/
│   ├── controllers/     # API endpoint logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── callController.js
│   │   ├── coinController.js
│   │   ├── commissionController.js
│   │   └── adminController.js
│   ├── models/         # MongoDB schemas
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── CallLog.js
│   │   ├── Chat.js
│   │   └── Withdrawal.js
│   ├── routes/         # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── calls.js
│   │   ├── coins.js
│   │   └── admin.js
│   ├── middleware/     # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── rateLimiter.js
│   ├── services/       # Business logic
│   │   ├── coinService.js
│   │   ├── commissionService.js
│   │   ├── callService.js
│   │   └── notificationService.js
│   ├── utils/          # Helper functions
│   │   ├── database.js
│   │   ├── s3.js
│   │   └── websocket.js
│   └── websocket/      # Real-time features
│       ├── socketHandlers.js
│       └── events.js
├── config/             # Configuration files
│   ├── database.js
│   ├── s3.js
│   └── jwt.js
├── migrations/         # Data migration scripts
│   ├── firebase-to-mongodb.js
│   └── data-transformer.js
├── tests/             # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/              # Documentation
    ├── api.md
    └── deployment.md
```

---

## 📊 DATABASE SCHEMAS

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  phoneNumber: String (required, unique),
  role: String (enum: ["USER", "STREAMER"]),
  name: String,
  username: String,
  profileImage: String (S3 URL),
  coverImage: String (S3 URL),
  bio: String,
  coinBalance: Number (default: 0),
  totalEarnings: Number (default: 0), // For streamers
  isOnline: Boolean (default: false),
  statusShow: Boolean (default: true),
  isDeleted: Boolean (default: false),
  profileCompleted: Boolean (default: false),
  fcmTokens: [String], // For push notifications
  expoPushToken: String,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Transactions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: "User"),
  type: String (enum: ["PURCHASE", "DEDUCTION", "COMMISSION", "WITHDRAWAL"]),
  amount: Number,
  callId: ObjectId (ref: "CallLog"), // Optional
  description: String,
  status: String (enum: ["PENDING", "COMPLETED", "FAILED"]),
  metadata: Object, // Additional data
  createdAt: Date,
  updatedAt: Date
}
```

### 3. CallLogs Collection
```javascript
{
  _id: ObjectId,
  callerId: ObjectId (ref: "User"),
  receiverId: ObjectId (ref: "User"),
  callId: String, // Stream.io call ID
  startTime: Date,
  endTime: Date,
  duration: Number, // in seconds
  coinsDeducted: Number,
  commissionEarned: Number,
  status: String (enum: ["ONGOING", "COMPLETED", "MISSED", "DECLINED"]),
  callType: String (enum: ["AUDIO", "VIDEO"]),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Chats Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: "User"),
  streamerId: ObjectId (ref: "User"),
  lastMessage: String,
  lastMessageAt: Date,
  unreadCount: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Messages Collection
```javascript
{
  _id: ObjectId,
  chatId: ObjectId (ref: "Chat"),
  senderId: ObjectId (ref: "User"),
  senderType: String (enum: ["USER", "STREAMER"]),
  content: String,
  messageType: String (enum: ["TEXT", "IMAGE", "VIDEO"]),
  isRead: Boolean (default: false),
  createdAt: Date
}
```

### 6. Withdrawals Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: "User"),
  amount: Number,
  bankName: String,
  accountNumber: String,
  ifsc: String,
  upiId: String,
  status: String (enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"]),
  adminNotes: String,
  processedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Settings Collection
```javascript
{
  _id: ObjectId,
  key: String (unique),
  value: Mixed,
  description: String,
  updatedAt: Date
}
// Keys: "commission_rate", "coins_per_minute", "min_withdrawal"
```

---

## 🔌 API ENDPOINTS SPECIFICATION

### Authentication APIs
```
POST /api/auth/register
Body: { phoneNumber: string }
Response: { success: boolean, message: string }

POST /api/auth/verify-otp
Body: { phoneNumber: string, otp: string }
Response: { success: boolean, token: string, user: object }

POST /api/auth/login
Body: { phoneNumber: string }
Response: { success: boolean, token: string, user: object }

POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, message: string }

GET /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, user: object }

PUT /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Body: { name: string, bio: string, etc... }
Response: { success: boolean, user: object }
```

### User Management APIs
```
GET /api/users?page=1&limit=20&role=USER&online=true
Response: { success: boolean, users: array, pagination: object }

GET /api/users/online
Response: { success: boolean, users: array }

GET /api/users/:id
Response: { success: boolean, user: object }

PUT /api/users/:id/status
Body: { isOnline: boolean, statusShow: boolean }
Response: { success: boolean, message: string }
```

### Coin System APIs
```
GET /api/coins/balance
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, balance: number }

POST /api/coins/purchase
Headers: { Authorization: "Bearer <token>" }
Body: { amount: number, paymentMethod: string }
Response: { success: boolean, transaction: object }

GET /api/coins/transactions?page=1&limit=20
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, transactions: array }

POST /api/coins/deduct
Body: { userId: string, amount: number, callId: string }
Response: { success: boolean, newBalance: number }
```

### Call System APIs
```
POST /api/calls/start
Headers: { Authorization: "Bearer <token>" }
Body: { receiverId: string, callType: string }
Response: { success: boolean, callId: string, streamToken: string }

POST /api/calls/end
Headers: { Authorization: "Bearer <token>" }
Body: { callId: string, duration: number }
Response: { success: boolean, callLog: object }

GET /api/calls/history?page=1&limit=20
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, calls: array }

POST /api/calls/deduct-coins
Body: { callId: string, minutes: number }
Response: { success: boolean, coinsDeducted: number }
```

### Commission APIs (Streamer App)
```
GET /api/commission/earnings
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, earnings: object }

GET /api/commission/rate
Response: { success: boolean, rate: number }

POST /api/commission/withdraw
Headers: { Authorization: "Bearer <token>" }
Body: { amount: number, bankDetails: object }
Response: { success: boolean, withdrawal: object }

GET /api/commission/withdrawals
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, withdrawals: array }
```

### File Upload APIs
```
POST /api/upload/image
Headers: { Authorization: "Bearer <token>" }
Body: FormData with image file
Response: { success: boolean, url: string, fileId: string }

POST /api/upload/video
Headers: { Authorization: "Bearer <token>" }
Body: FormData with video file
Response: { success: boolean, url: string, fileId: string }

GET /api/upload/:filename
Response: Redirect to S3 URL

POST /api/upload/presigned-url
Headers: { Authorization: "Bearer <token>" }
Body: { fileType: string, fileSize: number }
Response: { success: boolean, uploadUrl: string, fileId: string }

DELETE /api/upload/:fileId
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, message: string }
```

### Admin Panel APIs
```
GET /api/admin/dashboard
Headers: { Authorization: "Bearer <admin-token>" }
Response: { success: boolean, stats: object }

GET /api/admin/users?page=1&limit=50
Headers: { Authorization: "Bearer <admin-token>" }
Response: { success: boolean, users: array }

PUT /api/admin/users/:id/ban
Headers: { Authorization: "Bearer <admin-token>" }
Response: { success: boolean, message: string }

GET /api/admin/transactions?page=1&limit=50
Headers: { Authorization: "Bearer <admin-token>" }
Response: { success: boolean, transactions: array }

PUT /api/admin/withdrawals/:id
Headers: { Authorization: "Bearer <admin-token>" }
Body: { status: string, notes: string }
Response: { success: boolean, message: string }

PUT /api/admin/settings
Headers: { Authorization: "Bearer <admin-token>" }
Body: { commissionRate: number, coinsPerMinute: number }
Response: { success: boolean, message: string }
```

---

## ⚡ REAL-TIME FEATURES IMPLEMENTATION

### WebSocket Events
```javascript
// Connection Events
'connect' - User connects to WebSocket
'disconnect' - User disconnects from WebSocket
'authenticate' - Authenticate WebSocket connection

// User Events
'user:status:update' - Online/offline status change
'user:balance:update' - Coin balance update
'user:profile:update' - Profile information update

// Call Events
'call:incoming' - Incoming call notification
'call:started' - Call has started
'call:ended' - Call has ended
'call:duration:update' - Live call duration

// Coin Events
'coins:deducted' - Coins deducted from balance
'coins:purchased' - Coins added to balance
'transaction:completed' - Transaction completed

// Commission Events
'commission:earned' - Commission earned by streamer
'commission:rate:updated' - Commission rate changed
'withdrawal:status:update' - Withdrawal status change

// Chat Events
'chat:message:new' - New message received
'chat:typing:start' - User started typing
'chat:typing:stop' - User stopped typing

// Notification Events
'notification:push' - Push notification sent
'notification:read' - Notification marked as read
```

### Real-time Coin Deduction Logic
```javascript
// Per-minute coin deduction during calls
const deductCoinsPerMinute = async (callId) => {
  const call = await CallLog.findById(callId);
  const coinsPerMinute = await getSetting('coins_per_minute');
  const commissionRate = await getSetting('commission_rate');
  
  // Deduct coins from user
  const user = await User.findById(call.callerId);
  user.coinBalance -= coinsPerMinute;
  await user.save();
  
  // Calculate commission for streamer
  const streamer = await User.findById(call.receiverId);
  const commission = coinsPerMinute * (commissionRate / 100);
  streamer.totalEarnings += commission;
  await streamer.save();
  
  // Create transaction records
  await Transaction.create({
    userId: call.callerId,
    type: 'DEDUCTION',
    amount: coinsPerMinute,
    callId: callId,
    status: 'COMPLETED'
  });
  
  await Transaction.create({
    userId: call.receiverId,
    type: 'COMMISSION',
    amount: commission,
    callId: callId,
    status: 'COMPLETED'
  });
  
  // Emit real-time updates
  io.to(call.callerId).emit('coins:deducted', {
    newBalance: user.coinBalance,
    amountDeducted: coinsPerMinute
  });
  
  io.to(call.receiverId).emit('commission:earned', {
    newEarnings: streamer.totalEarnings,
    amountEarned: commission
  });
};
```

---

## 🔄 MIGRATION STRATEGY

### Phase 1: Parallel Development
1. **Set up new backend** alongside existing Firebase
2. **Develop all APIs** with same endpoints as Firebase
3. **Test thoroughly** with sample data
4. **Prepare migration scripts**

### Phase 2: Data Migration
1. **Export Firebase data** using Firebase Admin SDK
2. **Transform data formats** to match MongoDB schemas
3. **Import to MongoDB** with data validation
4. **Verify data integrity** and completeness

### Phase 3: File Migration
1. **Download files** from Firebase Storage
2. **Upload to S3** with proper folder structure
3. **Update file URLs** in database
4. **Test file access** and permissions

### Phase 4: App Integration
1. **Update API endpoints** in both apps
2. **Modify authentication** to use JWT
3. **Update real-time listeners** to use WebSocket
4. **Test all features** thoroughly

### Phase 5: Production Deployment
1. **Deploy to production server**
2. **Configure domain and SSL**
3. **Set up monitoring** and logging
4. **Perform final testing**

---

## 🛠️ DEVELOPMENT TIMELINE

### Day 1: Foundation & Setup
**Morning (4 hours):**
- Set up Express.js project structure
- Configure MongoDB connection and schemas
- Implement JWT authentication system
- Set up basic API endpoints

**Afternoon (4 hours):**
- Configure Amazon S3 integration with security policies
- Implement secure file upload/download functionality
- Set up file validation, virus scanning, and content moderation
- Create user management APIs with access controls
- Test basic authentication flow and file security

### Day 2: Core Business Logic
**Morning (4 hours):**
- Implement coin wallet system
- Build transaction tracking system
- Create minute-based coin deduction logic
- Set up commission calculation system

**Afternoon (4 hours):**
- Integrate Stream.io calling system
- Implement call log management
- Create real-time call monitoring
- Test coin deduction during calls

### Day 3: Real-time Features
**Morning (4 hours):**
- Set up WebSocket server (Socket.io)
- Implement real-time balance updates
- Build live commission tracking
- Create real-time user status management

**Afternoon (4 hours):**
- Implement push notification system
- Create chat system with real-time messaging
- Build withdrawal request system
- Test all real-time features

### Day 4: Integration & Migration
**Morning (4 hours):**
- Create Firebase to MongoDB migration scripts
- Migrate existing user data
- Migrate call logs and chat history
- Migrate file storage to S3

**Afternoon (4 hours):**
- Build admin panel APIs
- Create monitoring and analytics endpoints
- Implement commission rate management
- Test complete system integration

### Day 5: Testing & Deployment
**Morning (4 hours):**
- Comprehensive testing of all features
- Performance optimization and load testing
- Security hardening and validation
- Bug fixes and improvements

**Afternoon (4 hours):**
- Deploy to production server
- Configure domain, SSL, and monitoring
- Create comprehensive API documentation
- Final testing and handover to client

---

## 🔒 SECURITY IMPLEMENTATION

### Authentication Security
- **JWT tokens** with expiration
- **Refresh token** mechanism
- **Rate limiting** on auth endpoints
- **Phone number validation**
- **OTP verification** system

### API Security
- **Input validation** and sanitization
- **SQL injection** prevention
- **CORS configuration**
- **Rate limiting** per user/IP
- **Request logging** and monitoring

### Data Security
- **Password hashing** (bcrypt with salt rounds)
- **Sensitive data encryption** (AES-256 for PII)
- **Database connection** security (SSL/TLS)
- **File upload** validation and security
- **Access control** and permissions (RBAC)
- **Data anonymization** for analytics
- **Secure data transmission** (HTTPS only)

### File Security Implementation
- **File Type Validation**: Only allow specific image/video formats (jpg, png, mp4, mov)
- **File Size Limits**: Maximum 10MB for images, 100MB for videos
- **Virus Scanning**: Integrate with AWS GuardDuty or ClamAV for malware detection
- **Content Validation**: Verify file headers match file extensions
- **Secure Upload Process**: 
  - Generate unique filenames to prevent conflicts
  - Use signed URLs for direct S3 uploads
  - Implement upload progress tracking
  - Validate file integrity after upload
- **Access Control**:
  - Private S3 buckets with IAM policies
  - Pre-signed URLs for temporary access
  - User-specific folder structure
  - Admin-only access to sensitive files
- **File Storage Security**:
  - Server-side encryption (SSE-S3) for S3 buckets
  - Cross-region replication for backup
  - Versioning enabled for file recovery
  - Lifecycle policies for automatic cleanup
- **Profile Image Security**:
  - Automatic image resizing and optimization
  - EXIF data removal for privacy
  - Watermarking for content protection
  - Thumbnail generation for performance
- **Video Security**:
  - Video compression and optimization
  - Frame extraction for thumbnails
  - Content moderation integration
  - Streaming URL expiration
- **File Access Logging**:
  - Track all file access attempts
  - Monitor suspicious download patterns
  - Log file modification events
  - Alert on unauthorized access attempts

---

## 📈 PERFORMANCE OPTIMIZATION

### Database Optimization
- **Proper indexing** on frequently queried fields
- **Connection pooling** for MongoDB
- **Query optimization** and caching
- **Aggregation pipelines** for complex queries

### API Optimization
- **Response compression** (gzip)
- **Caching strategies** (Redis)
- **Pagination** for large datasets
- **Lazy loading** for heavy resources

### Real-time Optimization
- **WebSocket connection** pooling
- **Event batching** for high-frequency updates
- **Room-based** event distribution
- **Connection cleanup** and management

---

## 🧪 TESTING STRATEGY

### Unit Testing
- **API endpoint** testing
- **Business logic** testing
- **Database operations** testing
- **Utility functions** testing

### Integration Testing
- **Database integration** testing
- **S3 integration** testing with security validation
- **WebSocket** testing
- **Authentication flow** testing
- **File upload security** testing
- **Access control** testing

### End-to-End Testing
- **Complete user flows** testing
- **Cross-app integration** testing
- **Real-time features** testing
- **Performance testing**

---

## 📚 DELIVERABLES

### Code Deliverables
1. **Complete Express.js Backend** - All APIs and business logic
2. **MongoDB Database** - All schemas and migrated data
3. **S3 Integration** - File upload/download system
4. **WebSocket Server** - Real-time communication system
5. **Migration Scripts** - Firebase to MongoDB tools
6. **Admin Panel APIs** - Management and monitoring endpoints

### Documentation Deliverables
1. **API Documentation** - Complete endpoint reference with examples
2. **Database Schema** - Detailed schema documentation
3. **Migration Guide** - Step-by-step migration process
4. **Deployment Instructions** - Server setup and configuration guide
5. **Testing Reports** - Comprehensive test results and coverage
6. **Security Documentation** - Security measures and best practices

### Deployment Deliverables
1. **Production Server** - Fully configured and running backend
2. **Domain Configuration** - API endpoints accessible via domain
3. **SSL Certificates** - Secure HTTPS connections
4. **Monitoring Setup** - Server health and performance monitoring
5. **Backup Strategy** - Data backup and recovery procedures

---

## 🚨 RISK MANAGEMENT

### Technical Risks
- **Real-time complexity** - Mitigated by using proven Socket.io library
- **Data loss during migration** - Multiple backup strategies and validation
- **Performance issues** - Load testing and optimization throughout development
- **Integration problems** - Extensive testing and gradual rollout

### Timeline Risks
- **Scope creep** - Strict adherence to defined requirements
- **Unexpected technical issues** - Buffer time built into each day
- **Client requirement changes** - Clear requirements lock at project start
- **Testing delays** - Automated testing setup from day 1

### Mitigation Strategies
- **Daily progress updates** to client
- **Early demo** of core features
- **Parallel development** where possible
- **Comprehensive testing** throughout development
- **Rollback plan** for quick revert if needed

---

## 📞 CLIENT COMMUNICATION PLAN

### Daily Updates
- **Morning**: Progress report and plan for the day
- **Evening**: Daily achievements and next day priorities
- **Issues**: Immediate notification of any blockers or concerns

### Milestone Demos
- **Day 2**: Core functionality demo
- **Day 3**: Real-time features demo
- **Day 4**: Complete system demo
- **Day 5**: Final deployment and handover

### Documentation Updates
- **Daily**: Update progress in project documentation
- **Final**: Complete handover documentation package

---

## ✅ SUCCESS METRICS

### Technical Metrics
- **API Response Time**: <200ms average
- **Real-time Update Latency**: <1 second
- **System Uptime**: 99.9% availability
- **Concurrent Users**: Support 1000+ users
- **Data Migration**: 100% data integrity

### Business Metrics
- **Coin Deduction**: Accurate per-minute deduction
- **Commission Calculation**: Real-time and accurate
- **User Experience**: Seamless across all apps
- **Admin Functionality**: Complete management capabilities
- **Zero Downtime**: Smooth migration without service interruption

---

## 📋 FINAL CHECKLIST

### Pre-Deployment
- [ ] All APIs tested and working
- [ ] Real-time features functioning
- [ ] Data migration completed successfully
- [ ] Security measures implemented
- [ ] File security validation completed
- [ ] S3 bucket security policies configured
- [ ] File upload/download security tested
- [ ] Virus scanning integration working
- [ ] Access control permissions verified
- [ ] Performance optimization completed
- [ ] Documentation created

### Deployment
- [ ] Production server configured
- [ ] Domain and SSL setup
- [ ] Monitoring and logging active
- [ ] Backup procedures in place
- [ ] Load testing completed
- [ ] Final integration testing

### Handover
- [ ] Code repository provided
- [ ] API documentation delivered
- [ ] Deployment guide created
- [ ] Client training completed
- [ ] Support procedures established
- [ ] Project sign-off obtained

---

## 📞 CONTACT INFORMATION

**Project Manager**: [Your Name]  
**Email**: [Your Email]  
**Phone**: [Your Phone]  
**Project Repository**: [GitHub Link]  
**API Documentation**: [API Docs Link]  
**Deployment URL**: [Production URL]  

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Project Completion Date]  

---

*This documentation serves as the complete guide for the Lula Backend Migration project. All stakeholders should refer to this document for project details, timelines, and deliverables.*
