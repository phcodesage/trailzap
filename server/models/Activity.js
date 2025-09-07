const { query, transaction } = require('../config/database');

class Activity {
  constructor(activityData) {
    Object.assign(this, activityData);
  }

  // Create a new activity
  static async create(activityData) {
    const {
      userId, title, description, type, startTime, endTime, duration,
      distance, elevationGain, avgPace, maxSpeed, calories, route,
      weather, isPublic, heartRate, equipment
    } = activityData;

    // Calculate metrics if not provided
    const calculatedAvgPace = avgPace || (distance > 0 && duration > 0 ? 
      (duration / 60) / (distance / 1000) : 0);
    const calculatedMaxSpeed = maxSpeed || (distance > 0 && duration > 0 ? 
      (distance / 1000) / (duration / 3600) : 0);

    const result = await query(
      `INSERT INTO activities (
        user_id, title, description, type, start_time, end_time, duration,
        distance, elevation_gain, avg_pace, max_speed, calories, route,
        weather, is_public, heart_rate, equipment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        userId, title, description || '', type, startTime, endTime, duration,
        distance, elevationGain || 0, calculatedAvgPace, calculatedMaxSpeed,
        calories || 0, JSON.stringify(route), JSON.stringify(weather),
        isPublic !== false, JSON.stringify(heartRate), JSON.stringify(equipment)
      ]
    );

    return new Activity(result.rows[0]);
  }

  // Find activity by ID
  static async findById(id) {
    const result = await query(
      `SELECT a.*, u.username, u.profile_pic 
       FROM activities a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] ? new Activity(result.rows[0]) : null;
  }

  // Get activities feed (public activities from other users)
  static async getFeed(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT a.*, u.username, u.profile_pic,
       (SELECT COUNT(*) FROM activity_likes al WHERE al.activity_id = a.id) as like_count
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.is_public = true AND a.user_id != $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows.map(row => new Activity(row));
  }

  // Get user's activities
  static async getUserActivities(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT a.*, u.username, u.profile_pic,
       (SELECT COUNT(*) FROM activity_likes al WHERE al.activity_id = a.id) as like_count
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows.map(row => new Activity(row));
  }

  // Update activity
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbField = this.camelToSnake(key);
        if (['route', 'weather', 'heart_rate', 'equipment'].includes(dbField)) {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(updateData[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return this;

    values.push(this.id);
    const result = await query(
      `UPDATE activities SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete activity
  async delete() {
    await query('DELETE FROM activities WHERE id = $1', [this.id]);
  }

  // Like activity
  async like(userId) {
    await query(
      'INSERT INTO activity_likes (activity_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [this.id, userId]
    );
  }

  // Unlike activity
  async unlike(userId) {
    await query(
      'DELETE FROM activity_likes WHERE activity_id = $1 AND user_id = $2',
      [this.id, userId]
    );
  }

  // Get like count
  async getLikeCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = $1',
      [this.id]
    );
    return parseInt(result.rows[0].count);
  }

  // Check if user liked activity
  async isLikedBy(userId) {
    const result = await query(
      'SELECT 1 FROM activity_likes WHERE activity_id = $1 AND user_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  // Get comments for activity
  async getComments() {
    const result = await query(
      `SELECT c.*, u.username, u.profile_pic,
       (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.activity_id = $1 AND c.is_deleted = false
       ORDER BY c.created_at ASC`,
      [this.id]
    );
    return result.rows;
  }

  // Convert camelCase to snake_case
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Calculate average speed
  get avgSpeed() {
    if (this.duration === 0) return 0;
    return (this.distance / 1000) / (this.duration / 3600);
  }

  // Convert to JSON with proper field names
  toJSON() {
    return {
      ...this,
      userId: this.user_id,
      startTime: this.start_time,
      endTime: this.end_time,
      elevationGain: this.elevation_gain,
      avgPace: this.avg_pace,
      maxSpeed: this.max_speed,
      isPublic: this.is_public,
      heartRate: this.heart_rate ? JSON.parse(this.heart_rate) : null,
      equipment: this.equipment ? JSON.parse(this.equipment) : null,
      route: this.route ? JSON.parse(this.route) : null,
      weather: this.weather ? JSON.parse(this.weather) : null,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      likeCount: this.like_count || 0,
      avgSpeed: this.avgSpeed
    };
  }
}

module.exports = Activity;