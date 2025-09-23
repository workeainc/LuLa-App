// Firebase configuration for web deployment - disabled version
// This prevents Firebase initialization errors in Docker web environment

console.log('🌐 [firebaseConfig.web.js] Firebase disabled for web deployment');

// Mock Firebase services for web compatibility
const mockFirebase = {
  app: () => ({ name: 'mock-app' }),
  messaging: () => ({
    setBackgroundMessageHandler: () => {},
    getToken: () => Promise.resolve('mock-token'),
    onMessage: () => () => {},
    requestPermission: () => Promise.resolve(true),
  }),
  auth: () => ({
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithPhoneNumber: () => Promise.reject(new Error('Auth disabled for web')),
  }),
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        set: () => Promise.resolve(),
        get: () => Promise.resolve({ exists: false }),
        update: () => Promise.resolve(),
      }),
    }),
  }),
  storage: () => ({
    ref: () => ({
      put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('mock-url') } }),
    }),
  }),
};

// Export mock services
export const app = mockFirebase.app;
export const messaging = mockFirebase.messaging;
export const auth = mockFirebase.auth;
export const firestore = mockFirebase.firestore;
export const storage = mockFirebase.storage;

console.log('✅ [firebaseConfig.web.js] Mock Firebase services initialized for web');
