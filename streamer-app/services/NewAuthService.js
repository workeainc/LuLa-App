import BackendService from './BackendService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Register/Login with phone number (maintains same interface as Firebase version)
  async register(phoneNumber, role = 'STREAMER') {
    try {
      const result = await BackendService.post('/auth/register', {
        phoneNumber,
        role
      });

      if (result.error) {
        return result;
      }

      const { user, token } = result.data;
      
      // Store auth token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('loggedInUserId', user.id);
      await AsyncStorage.setItem('userRole', user.role);
      
      this.currentUser = user;
      
      return { error: false, user };
    } catch (error) {
      console.error('AuthService register error:', error);
      return { error: true, message: 'Registration failed' };
    }
  }

  // Verify OTP (placeholder - integrate with Twilio)
  async verifyOtp(phoneNumber, otpCode) {
    try {
      const result = await BackendService.post('/auth/verify-otp', {
        phoneNumber,
        otp: otpCode
      });

      return result;
    } catch (error) {
      console.error('AuthService verifyOtp error:', error);
      return { error: true, message: 'OTP verification failed' };
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const result = await BackendService.get('/auth/profile', { userId });
      
      if (result.error) {
        return result;
      }

      return { error: false, user: result.data.user };
    } catch (error) {
      console.error('AuthService getUserProfile error:', error);
      return { error: true, message: 'Failed to get user profile' };
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      const result = await BackendService.put('/auth/profile', {
        userId,
        ...profileData
      });

      if (result.error) {
        return result;
      }

      // Update current user data
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = { ...this.currentUser, ...result.data.user };
      }

      return { error: false, user: result.data.user };
    } catch (error) {
      console.error('AuthService updateUserProfile error:', error);
      return { error: true, message: 'Failed to update profile' };
    }
  }

  // Logout
  async logout(userId) {
    try {
      await BackendService.post('/auth/logout', { userId });
      
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('loggedInUserId');
      await AsyncStorage.removeItem('userRole');
      
      this.currentUser = null;
      
      return { error: false, message: 'Logged out successfully' };
    } catch (error) {
      console.error('AuthService logout error:', error);
      return { error: true, message: 'Logout failed' };
    }
  }

  // Check if user is logged in
  async isLoggedIn() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('loggedInUserId');
      
      if (!token || !userId) {
        return false;
      }

      // Get current user data
      const result = await this.getUserProfile(userId);
      if (!result.error) {
        this.currentUser = result.user;
        return true;
      }

      return false;
    } catch (error) {
      console.error('AuthService isLoggedIn error:', error);
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get stored user ID
  async getStoredUserId() {
    try {
      return await AsyncStorage.getItem('loggedInUserId');
    } catch (error) {
      console.error('AuthService getStoredUserId error:', error);
      return null;
    }
  }

  // Get stored user role
  async getStoredUserRole() {
    try {
      return await AsyncStorage.getItem('userRole');
    } catch (error) {
      console.error('AuthService getStoredUserRole error:', error);
      return null;
    }
  }

  // Update user online status
  async updateOnlineStatus(userId, isOnline) {
    try {
      const result = await this.updateUserProfile(userId, { isOnline });
      return result;
    } catch (error) {
      console.error('AuthService updateOnlineStatus error:', error);
      return { error: true, message: 'Failed to update online status' };
    }
  }

  // Get users by role (for finding streamers/users)
  async getUsersByRole(role, limit = 50) {
    try {
      // This would need to be implemented in the backend
      // For now, return empty array
      return { error: false, users: [] };
    } catch (error) {
      console.error('AuthService getUsersByRole error:', error);
      return { error: true, message: 'Failed to get users' };
    }
  }

  // Search users
  async searchUsers(query, role = null) {
    try {
      // This would need to be implemented in the backend
      // For now, return empty array
      return { error: false, users: [] };
    } catch (error) {
      console.error('AuthService searchUsers error:', error);
      return { error: true, message: 'Failed to search users' };
    }
  }

  // Follow/Unfollow user
  async followUser(userId, targetUserId) {
    try {
      // This would need to be implemented in the backend
      return { error: false, message: 'Follow action completed' };
    } catch (error) {
      console.error('AuthService followUser error:', error);
      return { error: true, message: 'Failed to follow user' };
    }
  }

  async unfollowUser(userId, targetUserId) {
    try {
      // This would need to be implemented in the backend
      return { error: false, message: 'Unfollow action completed' };
    } catch (error) {
      console.error('AuthService unfollowUser error:', error);
      return { error: true, message: 'Failed to unfollow user' };
    }
  }

  // Get followers/following
  async getFollowers(userId) {
    try {
      // This would need to be implemented in the backend
      return { error: false, followers: [] };
    } catch (error) {
      console.error('AuthService getFollowers error:', error);
      return { error: true, message: 'Failed to get followers' };
    }
  }

  async getFollowing(userId) {
    try {
      // This would need to be implemented in the backend
      return { error: false, following: [] };
    } catch (error) {
      console.error('AuthService getFollowing error:', error);
      return { error: true, message: 'Failed to get following' };
    }
  }
}

export default new AuthService();
