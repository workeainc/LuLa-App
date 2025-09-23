import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { DeviceEventEmitter } from 'react-native';
import RingtoneManager from './utils/RingtoneManager';
import App from './App';

// 🔥 CRITICAL: Import Firebase configuration to ensure proper initialization
import { app, messaging as messagingService } from './firebaseConfig';

// 🔧 DEBUG: Enhanced Firebase messaging logging
console.log('🔥 [index.js] Firebase messaging module loaded successfully');
console.log('🔥 [index.js] Firebase app from config:', !!app);

// Check if Firebase messaging is properly initialized
try {
  const messagingInstance = messaging();
  console.log('✅ [index.js] Firebase messaging instance created:', !!messagingInstance);
  console.log('✅ [index.js] Firebase messaging service from config:', !!messagingService);
} catch (error) {
  console.error('❌ [index.js] Error creating Firebase messaging instance:', error);
}

// Handle background notification action presses
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    const { notification, pressAction } = detail || {};
    const data = notification?.data || {};
    const nType = data?.type;
    try {
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
        try { await notifee.stopForegroundService(); } catch (_) {}
      }
    } catch { }
    if (nType === 'call') {
      const { callId } = data;
      // Navigation may not be ready in headless; it will be handled again on app start
      if (pressAction?.id === 'accept' || pressAction?.id === 'default') {
        try { DeviceEventEmitter.emit('CALL_ACCEPTED'); } catch (_) {}
      }
      if (pressAction?.id === 'decline') {
        try { DeviceEventEmitter.emit('CALL_DECLINED'); } catch (_) {}
      }
      return;
    }
  }
});


// 🔴 THIS is the critical piece: receive data-only push in BG/KILLED
console.log('🔥 [index.js] Setting up background message handler...');
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔥🔥🔥 [BACKGROUND HANDLER] CALLED! Message received!');
  console.log('🔥🔥🔥 [BACKGROUND HANDLER] This means FCM is working!');
  
  // 🔧 DEBUG: Log the entire remote message for debugging
  console.log('🔥 [BACKGROUND] Full message:', JSON.stringify(remoteMessage, null, 2));
  console.log('🔥 [BACKGROUND] Message data:', JSON.stringify(remoteMessage?.data, null, 2));
  console.log('🔥 [BACKGROUND] Message from:', remoteMessage?.from);
  console.log('🔥 [BACKGROUND] Message timestamp:', new Date().toISOString());

  // 🔧 DEBUG: Show a notification with remote message info for debugging
  try {
    await notifee.createChannel({
      id: 'debug_messages',
      name: 'Debug Messages',
      importance: AndroidImportance.DEFAULT,
    });

    // await notifee.displayNotification({
    //   id: `debug_${Date.now()}`,
    //   title: '🔧 Debug: Background Message Received',
    //   body: `Type: ${remoteMessage?.data?.type || 'unknown'}\nFrom: ${remoteMessage?.from || 'unknown'}\nData: ${JSON.stringify(remoteMessage?.data || {})}`,
    //   android: {
    //     channelId: 'debug_messages',
    //     smallIcon: 'ic_launcher',
    //     importance: AndroidImportance.DEFAULT,
    //   },
    // });
  } catch (error) {
    console.log('Error showing debug notification:', error);
  }

  const d = remoteMessage?.data || {};
  if (d.type !== 'CALL') return;

  // Ensure channel exists
  await notifee.createChannel({
    id: 'incoming_calls_v2',
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 600],
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true,
  });

  // Show full-screen incoming call style notification with buttons
  await notifee.displayNotification({
    id: `call_${d.callId}`,
    title: `Incoming Call: ${d.callerName || 'Unknown'}`,
    body: `${d.callerName || 'Someone'} is calling…`,
    data: d, // keep the callId/callerName here
    android: {
      channelId: 'incoming_calls_v2',
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      loopSound: true,
      sound: 'my_awesome_ringtone', // must exist /res/raw
      vibrationPattern: [300, 600],
      category: 'call',
      visibility: AndroidVisibility.PUBLIC,
      bypassDnd: true,
      // Heads-up + wake
      pressAction: { id: 'default', launchActivity: 'default' },
      // Full-screen intent
      fullScreenAction: { id: 'default' },
      actions: [
        { title: '✅ Accept', pressAction: { id: 'accept', launchActivity: 'default' } },
        { title: '❌ Decline', pressAction: { id: 'decline', launchActivity: 'default' } },
      ],
    },
  });

  // Stop ringtone when app signals accept/reject/end
  const stopAll = async () => {
    await RingtoneManager.stopAll(d.callId);
  };
  const a = DeviceEventEmitter.addListener('CALL_ACCEPTED', stopAll);
  const r = DeviceEventEmitter.addListener('CALL_DECLINED', stopAll);
  const e = DeviceEventEmitter.addListener('CALL_ENDED', stopAll);
  setTimeout(() => { try { a.remove(); } catch(_){} try { r.remove(); } catch(_){} try { e.remove(); } catch(_){} }, 60000);
});

console.log('🔥 [index.js] Background message handler setup completed');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
