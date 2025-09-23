// firebaseConfig.js

import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getMessaging } from '@react-native-firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA8PCc8whmFhXcuG3FuE217IHdBP80LaMM",
  authDomain: "lula-app-e7bf5.firebaseapp.com",
  projectId: "lula-app-e7bf5",
  storageBucket: "lula-app-e7bf5.firebasestorage.app",
  messagingSenderId: "329013869298",
  appId: "1:329013869298:android:566b798ab8f4c93df06e6b"
};

// Initialize Firebase
let app;
try {
  // Check if Firebase is already initialized
  const apps = getApps();
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ [firebaseConfig.js] Firebase app initialized successfully');
  } else {
    app = getApp();
    console.log('✅ [firebaseConfig.js] Using existing Firebase app');
  }
} catch (error) {
  console.error('❌ [firebaseConfig.js] Error initializing Firebase:', error);
  // Try to get existing app as fallback
  try {
    app = getApp();
    console.log('✅ [firebaseConfig.js] Using existing Firebase app as fallback');
  } catch (fallbackError) {
    console.error('❌ [firebaseConfig.js] Fallback failed:', fallbackError);
    throw error;
  }
}

// Initialize services
let auth, db, storage, messaging;

try {
  auth = getAuth(app);
  console.log('✅ [firebaseConfig.js] Firebase Auth initialized');
} catch (error) {
  console.error('❌ [firebaseConfig.js] Error initializing Auth:', error);
}

try {
  db = getFirestore(app);
  console.log('✅ [firebaseConfig.js] Firebase Firestore initialized');
} catch (error) {
  console.error('❌ [firebaseConfig.js] Error initializing Firestore:', error);
}

try {
  storage = getStorage(app);
  console.log('✅ [firebaseConfig.js] Firebase Storage initialized');
} catch (error) {
  console.error('❌ [firebaseConfig.js] Error initializing Storage:', error);
}

try {
  messaging = getMessaging(app);
  console.log('✅ [firebaseConfig.js] Firebase Messaging initialized');
} catch (error) {
  console.error('❌ [firebaseConfig.js] Error initializing Messaging:', error);
}

export { app, auth, db, storage, messaging }; 