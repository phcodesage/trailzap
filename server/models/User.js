const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');

class User {
  constructor(userData) {
    Object.assign(this, userData);
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password, profilePic, bio, location } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const result = await query(
      `INSERT INTO users (username, email, password_hash, profile_pic, bio, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [username, email, passwordHash, profilePic || null, bio || '', location || '']
    );
    
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Update user
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbField = this.camelToSnake(key);
        fields.push(`${dbField} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return this;

    values.push(this.id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete user
  async delete() {
    await query('DELETE FROM users WHERE id = $1', [this.id]);
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  // Follow another user
  async follow(targetUserId) {
    await query(
      'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [this.id, targetUserId]
    );
  }

  // Unfollow a user
  async unfollow(targetUserId) {
    await query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [this.id, targetUserId]
    );
  }

  // Get followers
  async getFollowers() {
    const result = await query(
      `SELECT u.* FROM users u
       JOIN user_follows uf ON u.id = uf.follower_id
       WHERE uf.following_id = $1`,
      [this.id]
    );
    return result.rows.map(row => new User(row));
  }

  // Get following
  async getFollowing() {
    const result = await query(
      `SELECT u.* FROM users u
       JOIN user_follows uf ON u.id = uf.following_id
       WHERE uf.follower_id = $1`,
      [this.id]
    );
    return result.rows.map(row => new User(row));
  }

  // Get follower count
  async getFollowerCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1',
      [this.id]
    );
    return parseInt(result.rows[0].count);
  }

  // Get following count
  async getFollowingCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1',
      [this.id]
    );
    return parseInt(result.rows[0].count);
  }

  // Update activity statistics
  async updateActivityStats(distance, duration, elevationGain) {
    await query(
      `UPDATE users SET 
       total_activities = total_activities + 1,
       total_distance = total_distance + $1,
       total_duration = total_duration + $2,
       total_elevation_gain = total_elevation_gain + $3
       WHERE id = $4`,
      [distance, duration, elevationGain, this.id]
    );
  }

  // Convert camelCase to snake_case
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return {
      ...userWithoutPassword,
      // Convert snake_case back to camelCase for API consistency
      profilePic: this.profile_pic,
      totalActivities: this.total_activities,
      totalDistance: this.total_distance,
      totalDuration: this.total_duration,
      totalElevationGain: this.total_elevation_gain,
      isPrivate: this.is_private,
      isActive: this.is_active,
      lastActive: this.last_active,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

module.exports = User;