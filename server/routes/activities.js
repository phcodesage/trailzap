const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/activities - Create new activity
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startTime,
      endTime,
      duration,
      distance,
      elevationGain,
      avgPace,
      maxSpeed,
      calories,
      route,
      routePoints,
      weather,
      isPublic = true
    } = req.body;

    // Validation
    if (!title || !startTime || !endTime || !duration || !distance) {
      return res.status(400).json({ 
        error: 'Title, start time, end time, duration, and distance are required' 
      });
    }

    // Create activity
    const activity = new Activity({
      userId: req.user._id,
      title,
      description,
      type: type || 'running',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      distance,
      elevationGain: elevationGain || 0,
      avgPace,
      maxSpeed,
      calories: calories || 0,
      route,
      routePoints,
      weather,
      isPublic
    });

    await activity.save();

    // Update user statistics
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalActivities: 1,
        totalDistance: distance,
        totalDuration: duration,
        totalElevationGain: elevationGain || 0
      }
    });

    // Populate user data for response
    await activity.populate('userId', 'username profilePic');

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages[0] });
    }
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// GET /api/activities - Get activities feed
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const userId = req.query.userId;

    let query = { isPublic: true };

    // Filter by activity type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by specific user
    if (userId) {
      query.userId = userId;
    } else if (req.user) {
      // Exclude current user's activities from general feed
      query.userId = { $ne: req.user._id };
    }

    const activities = await Activity.find(query)
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Get comment counts for each activity
    const activitiesWithCounts = await Promise.all(
      activities.map(async (activity) => {
        const commentCount = await Comment.countDocuments({ 
          activityId: activity._id,
          isDeleted: false 
        });
        
        return {
          ...activity,
          commentCount,
          user: activity.userId // Rename for frontend compatibility
        };
      })
    );

    const totalActivities = await Activity.countDocuments(query);
    const totalPages = Math.ceil(totalActivities / limit);

    res.json({
      activities: activitiesWithCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalActivities,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// GET /api/activities/:id - Get specific activity
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('userId', 'username profilePic bio')
      .populate('likes', 'username profilePic');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check if activity is public or user has access
    if (!activity.isPublic) {
      if (!req.user || req.user._id.toString() !== activity.userId._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get comments
    const comments = await Comment.find({ 
      activityId: activity._id,
      isDeleted: false,
      parentComment: null // Only top-level comments
    })
    .populate('userId', 'username profilePic')
    .populate({
      path: 'replies',
      populate: {
        path: 'userId',
        select: 'username profilePic'
      }
    })
    .sort({ createdAt: -1 });

    res.json({
      activity: {
        ...activity.toObject(),
        user: activity.userId,
        commentCount: comments.length,
        comments
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// PUT /api/activities/:id - Update activity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check ownership
    if (activity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, isPublic } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'username profilePic');

    res.json({
      message: 'Activity updated successfully',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check ownership
    if (activity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update user statistics
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalActivities: -1,
        totalDistance: -activity.distance,
        totalDuration: -activity.duration,
        totalElevationGain: -activity.elevationGain
      }
    });

    // Delete associated comments
    await Comment.deleteMany({ activityId: activity._id });

    // Delete activity
    await Activity.findByIdAndDelete(req.params.id);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// GET /api/activities/user/:userId - Get user's activities
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId };

    // If profile is private and not following, only show public activities
    if (user.isPrivate) {
      const isFollowing = req.user && user.followers.includes(req.user._id);
      const isOwnProfile = req.user && req.user._id.toString() === userId;
      
      if (!isFollowing && !isOwnProfile) {
        query.isPublic = true;
      }
    } else {
      query.isPublic = true;
    }

    const activities = await Activity.find(query)
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const totalActivities = await Activity.countDocuments(query);
    const totalPages = Math.ceil(totalActivities / limit);

    res.json({
      activities,
      pagination: {
        currentPage: page,
        totalPages,
        totalActivities,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Failed to get user activities' });
  }
});

module.exports = router;