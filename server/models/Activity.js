const mongoose = require('mongoose');

const geoPointSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  altitude: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Number,
    required: true
  }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['running', 'cycling', 'walking', 'hiking', 'swimming', 'other'],
    default: 'running'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0 // in seconds
  },
  distance: {
    type: Number,
    required: true,
    min: 0 // in meters
  },
  elevationGain: {
    type: Number,
    default: 0,
    min: 0 // in meters
  },
  avgPace: {
    type: Number,
    default: 0,
    min: 0 // seconds per km
  },
  maxSpeed: {
    type: Number,
    default: 0,
    min: 0 // km/h
  },
  calories: {
    type: Number,
    default: 0,
    min: 0
  },
  // GeoJSON route data
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]], // Array of [longitude, latitude, altitude?]
      default: []
    }
  },
  // Alternative route storage (for compatibility)
  routePoints: [geoPointSchema],
  
  // Weather data (optional)
  weather: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    conditions: String
  },
  
  // Privacy and sharing
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Social engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Performance metrics
  heartRate: {
    avg: Number,
    max: Number,
    zones: {
      zone1: Number, // Recovery
      zone2: Number, // Aerobic
      zone3: Number, // Threshold
      zone4: Number, // VO2 Max
      zone5: Number  // Anaerobic
    }
  },
  
  // Equipment used
  equipment: {
    shoes: String,
    bike: String,
    other: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ isPublic: 1, createdAt: -1 });
activitySchema.index({ 'route': '2dsphere' }); // Geospatial index
activitySchema.index({ likes: 1 });

// Virtual for like count
activitySchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for average speed (km/h)
activitySchema.virtual('avgSpeed').get(function() {
  if (this.duration === 0) return 0;
  return (this.distance / 1000) / (this.duration / 3600);
});

// Pre-save middleware to calculate metrics
activitySchema.pre('save', function(next) {
  // Calculate average pace if not provided
  if (this.distance > 0 && this.duration > 0 && !this.avgPace) {
    this.avgPace = (this.duration / 60) / (this.distance / 1000); // minutes per km
  }
  
  // Calculate max speed if not provided
  if (this.distance > 0 && this.duration > 0 && !this.maxSpeed) {
    this.maxSpeed = (this.distance / 1000) / (this.duration / 3600); // km/h
  }
  
  next();
});

// Static method to get activities feed
activitySchema.statics.getFeed = function(userId, page = 1, limit = 20) {
  return this.find({ 
    isPublic: true,
    userId: { $ne: userId } // Exclude user's own activities
  })
  .populate('userId', 'username profilePic')
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit)
  .lean();
};

// Static method to get user's activities
activitySchema.statics.getUserActivities = function(userId, page = 1, limit = 20) {
  return this.find({ userId })
  .populate('userId', 'username profilePic')
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit)
  .lean();
};

module.exports = mongoose.model('Activity', activitySchema);