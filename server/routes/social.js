const express = require('express');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/social/follow/:userId - Follow/Unfollow user
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId }
      });

      res.json({ 
        message: `Unfollowed ${targetUser.username}`,
        isFollowing: false 
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId }
      });

      res.json({ 
        message: `Now following ${targetUser.username}`,
        isFollowing: true 
      });
    }
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ error: 'Failed to update follow status' });
  }
});

// POST /api/social/like/:activityId - Like/Unlike activity
router.post('/like/:activityId', authenticateToken, async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const userId = req.user._id;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const isLiked = activity.likes.includes(userId);

    if (isLiked) {
      // Unlike
      await Activity.findByIdAndUpdate(activityId, {
        $pull: { likes: userId }
      });

      res.json({ 
        message: 'Activity unliked',
        isLiked: false,
        likeCount: activity.likes.length - 1
      });
    } else {
      // Like
      await Activity.findByIdAndUpdate(activityId, {
        $addToSet: { likes: userId }
      });

      res.json({ 
        message: 'Activity liked',
        isLiked: true,
        likeCount: activity.likes.length + 1
      });
    }
  } catch (error) {
    console.error('Like/unlike error:', error);
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

// POST /api/social/comment/:activityId - Add comment to activity
router.post('/comment/:activityId', authenticateToken, async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const { text, parentComment } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // If replying to a comment, check if parent exists
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.activityId.toString() !== activityId) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
    }

    const comment = new Comment({
      activityId,
      userId: req.user._id,
      text: text.trim(),
      parentComment: parentComment || null
    });

    await comment.save();

    // If this is a reply, add to parent's replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $addToSet: { replies: comment._id }
      });
    }

    // Populate user data
    await comment.populate('userId', 'username profilePic');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages[0] });
    }
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/social/comments/:activityId - Get activity comments
router.get('/comments/:activityId', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const comments = await Comment.find({ 
      activityId,
      isDeleted: false,
      parentComment: null // Only top-level comments
    })
    .populate('userId', 'username profilePic')
    .populate({
      path: 'replies',
      populate: {
        path: 'userId',
        select: 'username profilePic'
      },
      match: { isDeleted: false }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

    const totalComments = await Comment.countDocuments({ 
      activityId,
      isDeleted: false,
      parentComment: null 
    });
    const totalPages = Math.ceil(totalComments / limit);

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages,
        totalComments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// DELETE /api/social/comment/:commentId - Delete comment
router.delete('/comment/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.commentId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/social/comment/:commentId/like - Like/Unlike comment
router.post('/comment/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      // Unlike
      await Comment.findByIdAndUpdate(commentId, {
        $pull: { likes: userId }
      });

      res.json({ 
        message: 'Comment unliked',
        isLiked: false,
        likeCount: comment.likes.length - 1
      });
    } else {
      // Like
      await Comment.findByIdAndUpdate(commentId, {
        $addToSet: { likes: userId }
      });

      res.json({ 
        message: 'Comment liked',
        isLiked: true,
        likeCount: comment.likes.length + 1
      });
    }
  } catch (error) {
    console.error('Like/unlike comment error:', error);
    res.status(500).json({ error: 'Failed to update comment like status' });
  }
});

// GET /api/social/feed - Get personalized activity feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.user._id;

    // Get activities from followed users
    const user = await User.findById(userId);
    const followingIds = user.following;

    const activities = await Activity.find({
      $or: [
        { userId: { $in: followingIds }, isPublic: true },
        { userId: userId } // Include user's own activities
      ]
    })
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
          user: activity.userId,
          isLiked: activity.likes.includes(userId)
        };
      })
    );

    res.json({
      activities: activitiesWithCounts,
      pagination: {
        currentPage: page,
        hasNextPage: activities.length === limit
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

module.exports = router;