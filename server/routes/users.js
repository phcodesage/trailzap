const express = require('express');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?q=username
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email profilePic followerCount followingCount')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if profile is private and user is not following
    const isFollowing = user.followers.some(follower => 
      follower._id.toString() === req.user._id.toString()
    );
    const isOwnProfile = user._id.toString() === req.user._id.toString();

    if (user.isPrivate && !isFollowing && !isOwnProfile) {
      return res.json({
        user: {
          id: user._id,
          username: user.username,
          profilePic: user.profilePic,
          isPrivate: true,
          followerCount: user.followerCount,
          followingCount: user.followingCount
        }
      });
    }

    // Get recent activities
    const recentActivities = await Activity.find({ 
      userId: user._id,
      isPublic: true 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title type distance duration createdAt');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: isOwnProfile ? user.email : undefined,
        profilePic: user.profilePic,
        bio: user.bio,
        location: user.location,
        followers: user.followers,
        following: user.following,
        totalActivities: user.totalActivities,
        totalDistance: user.totalDistance,
        totalDuration: user.totalDuration,
        totalElevationGain: user.totalElevationGain,
        isPrivate: user.isPrivate,
        joinDate: user.createdAt.toISOString().split('T')[0],
        isFollowing,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /api/users/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, location, isPrivate } = req.body;
    const updates = {};

    if (username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updates.username = username;
    }

    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages[0] });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get detailed activity statistics
    const stats = await Activity.aggregate([
      { $match: { userId: user._id, isPublic: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalDuration: { $sum: '$duration' },
          totalElevation: { $sum: '$elevationGain' },
          avgPace: { $avg: '$avgPace' },
          maxSpeed: { $max: '$maxSpeed' }
        }
      }
    ]);

    // Get monthly activity data for the last 12 months
    const monthlyStats = await Activity.aggregate([
      { 
        $match: { 
          userId: user._id,
          isPublic: true,
          createdAt: { 
            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) 
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          distance: { $sum: '$distance' },
          duration: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      stats: {
        byType: stats,
        monthly: monthlyStats,
        totals: {
          activities: user.totalActivities,
          distance: user.totalDistance,
          duration: user.totalDuration,
          elevation: user.totalElevationGain
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

module.exports = router;