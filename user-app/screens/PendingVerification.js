import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import app from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth'; // Import Firebase auth if you're using it for sign out

const PendingVerification = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem('loggedInUserId');
      // If you are using Firebase Authentication, sign out the user
      try {
        const defaultApp = app();
        if (defaultApp?.name && getAuth().currentUser) {
          await getAuth().signOut();
        }
      } catch (e) {}
      // Navigate to the login screen or a welcome screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // Or your desired initial screen after logout
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Your account is pending verification.</Text>
      <Text style={styles.message}>Please wait while we review your profile.</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'red', // You can customize the button's appearance
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PendingVerification;