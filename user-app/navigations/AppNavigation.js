import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import React, { useState, useEffect, useCallback } from 'react'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import BottomTabNavigation from './BottomTabNavigation'
import { useDispatch, useSelector } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { FONTS } from '../constants/fonts'
import app from '@react-native-firebase/app'
import { getAuth } from '@react-native-firebase/auth'
import { navigationRef } from './RootNavigation'
import {
    NoInternet,
    Select,
    Login,
    Otp,
    Matching,
    SelectPartner,
    StartCalling,
    ExploreMatch,
    Notification,
    Chat,
    Setting,
    About,
    PrivacyPolicy,
    TransactionHistory,
    Plans,
    Explore,
    EditProfile,
    OnBoarding1,
    CreateProfile,
    Menu,
    CreatePost,
    Following,
    Follower,
    Call,
    ReceiveCall,
    Withdraw,
    PendingVerification,
    CreateVideo,
    CallLogScreen,
    EditPost,
} from '../screens'
import { handleError } from '../utils/function'
import AuthService from '../services/AuthService'
import showToast from '../utils/toast'
import { setUser } from '../store/slices/auth'
import { Camera } from 'expo-camera'
import { Audio } from 'expo-av'
import CallManager from '../utils/CallManager'
import CallWrapper from '../components/wrapper/CallWrapper'
SplashScreen.preventAutoHideAsync()
const Stack = createNativeStackNavigator()

const AppNavigation = () => {
    const { user } = useSelector((state) => state.auth)
    const dispatch = useDispatch()
    const [isConnected, setIsConnected] = useState(true)
    const [isFirstLaunch, setIsFirstLaunch] = useState(null)
    const [fontsLoaded] = useFonts(FONTS)
    const [isLoading, setIsLoading] = useState(true)

    let currentUser = null
    try {
        const defaultApp = app()
        if (defaultApp?.name) {
            currentUser = getAuth().currentUser
        }
    } catch (e) {
        currentUser = null
    }

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) {
            await SplashScreen.hideAsync()
        }
    }, [fontsLoaded])

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(!!state.isConnected)
        })
        return () => {
            unsubscribe()
        }
    }, [])

    // App state logging - same as lula-user
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                console.log('🔄 App going to background, cleaning up resources...')
                // Force garbage collection if possible
                if (global.gc) {
                    global.gc()
                }
            } else if (nextAppState === 'active') {
                console.log('🔄 App coming to foreground')
            }
        }
        
        const subscription = AppState.addEventListener('change', handleAppStateChange)
        
        return () => {
            subscription?.remove()
        }
    }, [])

  
    if (user) {
        new CallManager(user)
    }
useEffect(() => {
  const restoreUserFromStorage = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('loggedInUserId')
      if (storedUserId) {
        // Use the new session checking method
        const res = await AuthService.checkUserSession(storedUserId)
        if (!res.error && res.user && res.user.id) {
          dispatch(setUser(res.user))
          console.log('User restored from storage:', res.user.id)
        } else {
          console.warn('User session invalid:', res.message)
          // Storage is already cleared by checkUserSession if needed
        }
      }
    } catch (error) {
      console.error('Failed to restore user from AsyncStorage:', error)
      // Clear storage on error to prevent issues
      try {
        await AsyncStorage.removeItem('loggedInUserId')
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  restoreUserFromStorage()
}, [])

    useEffect(() => {
        ;(async () => {
            try {
                const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
                // For expo-av@13 on SDK 50, use requestPermissionsAsync
                const { status: audioStatus } = await Audio.requestPermissionsAsync()
            } catch (e) {
                console.warn('Permission request failed', e)
            }
        })()
    }, [])

    // Check if it's the first launch
    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const firstLaunch = await AsyncStorage.getItem('isFirstLaunch')
                if (firstLaunch === null) {
                    // First time launch
                    setIsFirstLaunch(true)
                    await AsyncStorage.setItem('isFirstLaunch', 'false') // Set it to false after the first launch
                } else {
                    // Not the first time
                    setIsFirstLaunch(false)
                }
            } catch (error) {
                console.error('Error checking first launch: ', error)
                // Default to not first launch on error
                setIsFirstLaunch(false)
            }
        }

        checkFirstLaunch()
    }, [])

    const getinitialScreen = useCallback(() => {
        if (!isConnected) {
            return 'NoInternet'
        }
        let initial = isFirstLaunch ? 'OnBoarding1' : 'Login'

        if (user && user.profileCompleted) {
            // Check streamer status after profile completion
            if (user.role === "STREAMER" && user.status === false) {
                initial = 'PendingVerification';
            } else {
                initial = 'Main';
            }
        }
        if (user && !user.profileCompleted) {
            initial = 'CreateProfile'
        }

        return initial
    }, [isFirstLaunch, isConnected, user])

    if (isFirstLaunch === null || !fontsLoaded || isLoading) {
        return null // Wait until the first launch status is determined and fonts are loaded
    }

    return (
        <SafeAreaProvider onLayout={onLayoutRootView}>
            <CallWrapper>
                <NavigationContainer ref={navigationRef}>
                    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={getinitialScreen()}>
                        <Stack.Screen name="NoInternet" component={NoInternet} />
                        <Stack.Screen name="OnBoarding1" component={OnBoarding1} />
                        <Stack.Screen name="Menu" component={Menu} />
                        <Stack.Screen name="Select" component={Select} />
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Otp" component={Otp} />
                        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
                        <Stack.Screen name="CreateProfile" component={CreateProfile} />
                        <Stack.Screen name="Matching" component={Matching} />
                        <Stack.Screen name="SelectPartner" component={SelectPartner} />
                        <Stack.Screen name="Explore" component={Explore} />
                        <Stack.Screen name="ExploreMatch" component={ExploreMatch} />
                        <Stack.Screen name="Notification" component={Notification} />
                        <Stack.Screen name="Setting" component={Setting} />
                        <Stack.Screen name="About" component={About} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                        <Stack.Screen name="Plans" component={Plans} />
                        <Stack.Screen name="Chat" component={Chat} />
                        <Stack.Screen name="StartCalling" component={StartCalling} />
                        <Stack.Screen name="CreatePost" component={CreatePost} />
                        <Stack.Screen name="EditProfile" component={EditProfile} />
                        <Stack.Screen name="Following" component={Following} />
                        <Stack.Screen name="Follower" component={Follower} />
                        <Stack.Screen name="Main" component={BottomTabNavigation} />
                        <Stack.Screen name="Call" component={Call} />
                        <Stack.Screen name="ReceiveCall" component={ReceiveCall} />
                        <Stack.Screen name="Withdraw" component={Withdraw} />
                        <Stack.Screen name="PendingVerification" component={PendingVerification} />
                        <Stack.Screen name="CreateVideo" component={CreateVideo} />
                        <Stack.Screen name="CallLogScreen" component={CallLogScreen} />
                        <Stack.Screen name="EditPost" component={EditPost} />
                    </Stack.Navigator>
                </NavigationContainer>
            </CallWrapper>
        </SafeAreaProvider>
    )
}

export default AppNavigation
