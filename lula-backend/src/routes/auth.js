const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coin = require('../models/Coin');
const router = express.Router();

// Register/Login with OTP
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, role = 'USER' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        error: true,
        message: 'Phone number is required'
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ 
      phoneNumber, 
      role,
      isDeleted: false 
    });
    
    if (user) {
      // User exists, update last login
      user.lastLoginAt = new Date();
      user.isOnline = true;
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
      
      return res.json({
        error: false,
        message: 'Login successful',
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          role: user.role,
          name: user.name,
          profileImage: user.profileImage,
          isOnline: user.isOnline
        },
        token
      });
    }
    
    // Create new user
    user = new User({
      phoneNumber,
      role,
      isOnline: true
    });
    
    await user.save();
    
    // Create coin wallet for new user
    const coinWallet = new Coin({
      userId: user._id,
      balance: 0
    });
    await coinWallet.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(201).json({
      error: false,
      message: 'User registered successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        profileImage: user.profileImage,
        isOnline: user.isOnline
      },
      token
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: true,
      message: 'Registration failed'
    });
  }
});

// Verify OTP (placeholder - integrate with Twilio)
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    // TODO: Implement actual OTP verification with Twilio
    // For now, accept any 6-digit OTP
    if (otp && otp.length === 6) {
      res.json({
        error: false,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        error: true,
        message: 'Invalid OTP'
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      error: true,
      message: 'OTP verification failed'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'User ID is required'
      });
    }
    
    const user = await User.findById(userId).select('-__v');
    
    if (!user || user.isDeleted) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      error: false,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        profileImage: user.profileImage,
        profileVideo: user.profileVideo,
        images: user.images,
        videos: user.videos,
        location: user.location,
        followers: user.followers,
        following: user.following,
        isOnline: user.isOnline,
        statusShow: user.statusShow,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'User ID is required'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      error: false,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        profileImage: user.profileImage,
        profileVideo: user.profileVideo,
        images: user.images,
        videos: user.videos,
        location: user.location,
        isOnline: user.isOnline,
        statusShow: user.statusShow,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update profile'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastLoginAt: new Date()
      });
    }
    
    res.json({
      error: false,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: 'Logout failed'
    });
  }
});

module.exports = router;
