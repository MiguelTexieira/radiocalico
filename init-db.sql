-- RadioCalico Database Schema for SQLite
-- Initialize tables for users and song ratings

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id TEXT UNIQUE NOT NULL,
    artist TEXT NOT NULL,
    title TEXT NOT NULL,
    album TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_artist_title UNIQUE(artist, title)
);

-- Song ratings table
CREATE TABLE IF NOT EXISTS song_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    song_id TEXT NOT NULL,
    rating TEXT CHECK (rating IN ('up', 'down')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (song_id) REFERENCES songs(song_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_song_vote UNIQUE(user_id, song_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_song_id ON songs(song_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist_title ON songs(artist, title);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON song_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON song_ratings(song_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_song ON song_ratings(user_id, song_id);

-- View for rating aggregation
CREATE VIEW IF NOT EXISTS song_rating_summary AS
SELECT 
    s.song_id,
    s.artist,
    s.title,
    s.album,
    COUNT(CASE WHEN sr.rating = 'up' THEN 1 END) as thumbs_up,
    COUNT(CASE WHEN sr.rating = 'down' THEN 1 END) as thumbs_down,
    COUNT(sr.id) as total_votes
FROM songs s
LEFT JOIN song_ratings sr ON s.song_id = sr.song_id
GROUP BY s.song_id, s.artist, s.title, s.album;