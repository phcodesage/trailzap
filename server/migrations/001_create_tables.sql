-- TrailZap PostgreSQL Database Schema
-- Migration: 001_create_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial data (if needed for route tracking)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]+$'),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~ '^\S+@\S+\.\S+$'),
    password_hash VARCHAR(255) NOT NULL,
    profile_pic TEXT,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    location VARCHAR(100),
    
    -- Activity statistics
    total_activities INTEGER DEFAULT 0,
    total_distance BIGINT DEFAULT 0, -- in meters
    total_duration BIGINT DEFAULT 0, -- in seconds
    total_elevation_gain INTEGER DEFAULT 0, -- in meters
    
    -- Privacy settings
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT CHECK (LENGTH(description) <= 1000),
    type VARCHAR(20) NOT NULL CHECK (type IN ('running', 'cycling', 'walking', 'hiking', 'swimming', 'other')),
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL CHECK (duration >= 0), -- in seconds
    distance INTEGER NOT NULL CHECK (distance >= 0), -- in meters
    elevation_gain INTEGER DEFAULT 0 CHECK (elevation_gain >= 0), -- in meters
    avg_pace DECIMAL(8,2) DEFAULT 0 CHECK (avg_pace >= 0), -- seconds per km
    max_speed DECIMAL(8,2) DEFAULT 0 CHECK (max_speed >= 0), -- km/h
    calories INTEGER DEFAULT 0 CHECK (calories >= 0),
    
    -- Route data stored as JSON (GeoJSON format)
    route JSONB,
    
    -- Weather data (optional)
    weather JSONB,
    
    -- Privacy and sharing
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Performance metrics
    heart_rate JSONB, -- {avg, max, zones: {zone1, zone2, zone3, zone4, zone5}}
    
    -- Equipment used
    equipment JSONB, -- {shoes, bike, other: []}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (LENGTH(text) <= 500),
    
    -- Reply functionality
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Moderation
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User followers/following relationship table
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Activity likes table
CREATE TABLE activity_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(activity_id, user_id)
);

-- Comment likes table
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_public_created ON activities(is_public, created_at DESC);
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC);

CREATE INDEX idx_comments_activity_id ON comments(activity_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

CREATE INDEX idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX idx_activity_likes_user ON activity_likes(user_id);

CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
