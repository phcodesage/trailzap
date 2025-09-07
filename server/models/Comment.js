const { query, transaction } = require('../config/database');

class Comment {
  constructor(commentData) {
    Object.assign(this, commentData);
  }

  // Create a new comment
  static async create(commentData) {
    const { activityId, userId, text, parentCommentId } = commentData;
    
    const result = await query(
      `INSERT INTO comments (activity_id, user_id, text, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [activityId, userId, text, parentCommentId || null]
    );
    
    return new Comment(result.rows[0]);
  }

  // Find comment by ID
  static async findById(id) {
    const result = await query(
      `SELECT c.*, u.username, u.profile_pic,
       (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1 AND c.is_deleted = false`,
      [id]
    );
    return result.rows[0] ? new Comment(result.rows[0]) : null;
  }

  // Get comments for an activity
  static async getByActivityId(activityId) {
    const result = await query(
      `SELECT c.*, u.username, u.profile_pic,
       (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
       (SELECT COUNT(*) FROM comments replies WHERE replies.parent_comment_id = c.id AND replies.is_deleted = false) as reply_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.activity_id = $1 AND c.is_deleted = false
       ORDER BY c.created_at ASC`,
      [activityId]
    );
    return result.rows.map(row => new Comment(row));
  }

  // Get replies to a comment
  static async getReplies(parentCommentId) {
    const result = await query(
      `SELECT c.*, u.username, u.profile_pic,
       (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_comment_id = $1 AND c.is_deleted = false
       ORDER BY c.created_at ASC`,
      [parentCommentId]
    );
    return result.rows.map(row => new Comment(row));
  }

  // Update comment
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
      `UPDATE comments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    Object.assign(this, result.rows[0]);
    return this;
  }

  // Soft delete comment
  async delete() {
    await query(
      'UPDATE comments SET is_deleted = true, deleted_at = NOW() WHERE id = $1',
      [this.id]
    );
  }

  // Hard delete comment
  async hardDelete() {
    await query('DELETE FROM comments WHERE id = $1', [this.id]);
  }

  // Like comment
  async like(userId) {
    await query(
      'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [this.id, userId]
    );
  }

  // Unlike comment
  async unlike(userId) {
    await query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [this.id, userId]
    );
  }

  // Get like count
  async getLikeCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1',
      [this.id]
    );
    return parseInt(result.rows[0].count);
  }

  // Check if user liked comment
  async isLikedBy(userId) {
    const result = await query(
      'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  // Get reply count
  async getReplyCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM comments WHERE parent_comment_id = $1 AND is_deleted = false',
      [this.id]
    );
    return parseInt(result.rows[0].count);
  }

  // Convert camelCase to snake_case
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Convert to JSON with proper field names
  toJSON() {
    return {
      ...this,
      activityId: this.activity_id,
      userId: this.user_id,
      parentCommentId: this.parent_comment_id,
      isDeleted: this.is_deleted,
      deletedAt: this.deleted_at,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      likeCount: this.like_count || 0,
      replyCount: this.reply_count || 0
    };
  }
}

module.exports = Comment;