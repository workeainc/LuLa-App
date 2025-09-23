import BaseService from './BaseService'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc, setDoc, updateDoc, onSnapshot } from '@react-native-firebase/firestore'

const API_BASE_URL = 'https://twilio-lula.onrender.com' // 🔗 Twilio backend endpoint

class AuthService extends BaseService {
  #collection
  #confirmation = null
  #phoneNumber = null

  constructor(collectionName) {
    super(collectionName)
    this.#collection = collectionName
  }

  // 📲 Send OTP to phone
  async register(phoneNumber) {
    try {
      if (!this.db) {
        return this.handleError('Firebase is not configured')
      }

      // Check if user already exists with the phone number
      const q = query(
        collection(this.db, this.#collection),
        where('phoneNumber', '==', phoneNumber),
        where('role', '==', 'STREAMER'),
        where('isDeleted', '==', false), // Only check non-deleted users
        limit(1)
      );
      const existingUserQuery = await getDocs(q);

      if (!existingUserQuery.empty) {
        // User exists, return existing user data
        const existingDoc = existingUserQuery.docs[0];
        const user = this.fromFirestore(existingDoc);

        // Update last login time
        await updateDoc(doc(this.db, this.#collection, user.id), {
          lastLoginAt: new Date(),
          isOnline: true
        });

        // Save user ID to AsyncStorage
        await AsyncStorage.setItem('loggedInUserId', user.id);

        return { error: false, user };
      } else {
        // User does not exist, create a new user document
        const userData = {
          phoneNumber: phoneNumber,
          role: 'STREAMER',
          status: false, // New streamers start with pending verification
          isDeleted: false,
          profileCompleted: false,
          statusShow: true,
          isOnline: true,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };

        const addedRef = await addDoc(collection(this.db, this.#collection), this.toFirestore(userData));
        await setDoc(doc(this.db, this.#collection, addedRef.id), { id: addedRef.id }, { merge: true });

        const newDocRef = doc(this.db, this.#collection, addedRef.id);
        const newDoc = await getDoc(newDocRef);
        const user = this.fromFirestore(newDoc);

        // Save user ID to AsyncStorage
        await AsyncStorage.setItem('loggedInUserId', user.id);

        return { error: false, user };
      }
    } catch (error) {
      console.error('Error in register:', error.message)
      return this.handleError('Failed to process registration')
    }
  }
// async verifyOtp(otpCode) {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
//       phoneNumber: this.#phoneNumber,
//       otp: otpCode,
//     })

//     if (response.data.error) {
//       return { error: true, message: response.data.message }
//     }

//     const userData = {
//       phoneNumber: this.#phoneNumber,
//       role: 'STREAMER',
//       status: true,
//       isDeleted: false,
//       profileCompleted: false,
//       statusShow: true,
//     }

//     const addedRef = await this.db.collection(this.#collection).add(this.toFirestore(userData))
//     await addedRef.update({ id: addedRef.id })

//     const newDoc = await addedRef.get()
//     const user = this.fromFirestore(newDoc)

//     // ✅ Save user ID to AsyncStorage
//     await AsyncStorage.setItem('loggedInUserId', user.id)

//     return { error: false, user }
//   } catch (error) {
//     console.error('Error verifying OTP:', error.message)
//     return this.handleError('Failed to verify OTP')
//   }
// }


  // 🔍 Get user by document ID
    
  async verifyOtp(otpCode) {
    try {
      if (!this.db) {
        return this.handleError('Firebase is not configured')
      }
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        phoneNumber: this.#phoneNumber,
        otp: otpCode,
      });

      if (response.data.error) {
        return { error: true, message: response.data.message };
      }

      // Check if user already exists with the phone number
      const q = query(
        collection(this.db, this.#collection),
        where('phoneNumber', '==', this.#phoneNumber),
        limit(1)
      );
      const existingUserQuery = await getDocs(q);

      if (!existingUserQuery.empty) {
        // User exists, return existing user data
        const existingDoc = existingUserQuery.docs[0];
        const user = this.fromFirestore(existingDoc);

        // Save user ID to AsyncStorage
        await AsyncStorage.setItem('loggedInUserId', user.id);

        return { error: false, user };
      } else {
        // User does not exist, create a new user document
        const userData = {
          phoneNumber: this.#phoneNumber,
          role: 'STREAMER', // Assuming 'STREAMER' is the default role for new users
          status: true,
          isDeleted: false,
          profileCompleted: false, // New users haven't completed their profile
          statusShow: true,
        };

        const addedRef = await addDoc(collection(this.db, this.#collection), this.toFirestore(userData));
        await setDoc(doc(this.db, this.#collection, addedRef.id), { id: addedRef.id }, { merge: true });

        const newDocRef = doc(this.db, this.#collection, addedRef.id);
        const newDoc = await getDoc(newDocRef);
        const user = this.fromFirestore(newDoc);

        // Save user ID to AsyncStorage
        await AsyncStorage.setItem('loggedInUserId', user.id);

        return { error: false, user };
      }

    } catch (error) {
      console.error('Error verifying OTP:', error.message);
      return this.handleError('Failed to verify OTP');
    }
  }

  async updateUserProfile(userId, updatedData) {
    try {
      if (!this.db) {
        return this.handleError('Firebase is not configured')
      }
      
      console.log('Updating user profile:', { userId, updatedData });
      
      // Use the inherited update method from BaseService
      const updateResult = await this.update(userId, updatedData);
      
      console.log('Update result:', updateResult);
      
      if (updateResult.success) {
        // Fetch and return the updated user object
        const userRef = doc(this.db, this.#collection, userId);
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists) {
          const updatedUser = this.fromFirestore(updatedDoc);
          console.log('Updated user data:', updatedUser);
          return { error: false, user: updatedUser };
        } else {
          return { error: true, message: 'Failed to retrieve updated user data' };
        }
      } else {
        return { error: true, message: updateResult.message };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return this.handleError(`Failed to update user profile: ${error.message}`);
    }
  }

  async deleteAccount() {
    try {
      if (!this.auth) {
        return this.handleError('Firebase is not configured')
      }
      const user = this.auth.currentUser
      if (!user) {
        return { error: true, message: 'User not found' }
      }

      if (!this.db) {
        return this.handleError('Firebase is not configured')
      }
      
      // Use the inherited delete method from BaseService
      const deleteResult = await this.delete(user.uid);
      
      if (deleteResult.success) {
        await user.delete()
        return { error: false, message: 'Account deleted permanently' }
      } else {
        return { error: true, message: deleteResult.message }
      }
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        return { error: true, message: 'Please re-authenticate to delete your account' }
      }
      return this.handleError(error.message)
    }
  }

  async getUser(id) {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            const userRef = doc(this.db, this.#collection, id)
            const snapshot = await getDoc(userRef)
            if (snapshot.exists) {
                return { error: false, user: this.fromFirestore(snapshot) }
            } else {
                throw Error('User Not Found')
            }
        } catch (error) {
            return this.handleError(error.message)
        }
    }
    listenUserId(id, callback) {
        if (!this.db) {
            console.error('❌ [AuthService] Database not available for listenUserId');
            return () => {}
        }
        
        console.log('🔥 [AuthService] Setting up Firestore listener for user:', id);
        const userRef = doc(this.db, this.#collection, id)

        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            console.log('🔥 [AuthService] Firestore snapshot received:', {
                exists: snapshot.exists(),
                data: snapshot.data(),
                timestamp: new Date().toISOString()
            });
            callback(snapshot.data())
        }, (error) => {
            console.error('❌ [AuthService] Firestore listener error:', error);
            callback(null);
        })

        return unsubscribe
    }

    async updateStatusShow(userId, status) {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            
            // Use the inherited update method from BaseService
            const updateResult = await this.update(userId, { statusShow: status });
            
            if (updateResult.success) {
                return { error: false, message: `User status updated to ${status ? 'online' : 'offline'}` }
            } else {
                return { error: true, message: updateResult.message }
            }
        } catch (error) {
            console.error('Error updating status:', error)
            return this.handleError('Failed to update user status')
        }
    }

    async logout(userId) {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            
            // Update user status to offline
            const updateResult = await this.update(userId, { 
                isOnline: false,
                lastLogoutAt: new Date()
            });
            
            if (updateResult.success) {
                // Clear AsyncStorage
                await AsyncStorage.removeItem('loggedInUserId');
                return { error: false, message: 'Logged out successfully' }
            } else {
                return { error: true, message: updateResult.message }
            }
        } catch (error) {
            console.error('Error during logout:', error)
            // Still clear storage even if update fails
            try {
                await AsyncStorage.removeItem('loggedInUserId');
            } catch (clearError) {
                console.error('Failed to clear storage:', clearError)
            }
            return this.handleError('Failed to logout properly')
        }
    }

    async checkUserSession(userId) {
        try {
            if (!this.db) return this.handleError('Firebase is not configured')
            
            const userRef = doc(this.db, this.#collection, userId);
            const snapshot = await getDoc(userRef);
            
            if (snapshot.exists) {
                const user = this.fromFirestore(snapshot);
                
                // Check if user account is still valid
                if (user.isDeleted === true) {
                    // Clear invalid session
                    await AsyncStorage.removeItem('loggedInUserId');
                    return { error: true, message: 'Account deleted', user: null }
                }
                
                return { error: false, user }
            } else {
                // User not found, clear session
                await AsyncStorage.removeItem('loggedInUserId');
                return { error: true, message: 'User not found', user: null }
            }
        } catch (error) {
            console.error('Error checking user session:', error)
            return this.handleError('Failed to check user session')
        }
    }
}

export default new AuthService('user')
