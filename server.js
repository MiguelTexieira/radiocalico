const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine setup (kept for potential future use)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Utility functions
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
}

function createSongId(artist, title) {
  return Buffer.from(`${artist}|${title}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
}

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 as test');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

app.get('/api/test', async (req, res) => {
  try {
    const result = await db.query('SELECT sqlite_version() as version');
    const row = result.rows[0];
    res.json({
      database_type: 'SQLite',
      version: row.version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Management API
app.post('/api/users/register', async (req, res) => {
  try {
    const { user_id } = req.body;
    const ip_address = getClientIp(req);
    const user_agent = req.headers['user-agent'];

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await db.query(
      `INSERT INTO users (user_id, ip_address, user_agent, updated_at) 
       VALUES (?, ?, ?, datetime('now')) 
       ON CONFLICT(user_id) DO UPDATE SET 
         ip_address = excluded.ip_address, 
         user_agent = excluded.user_agent, 
         updated_at = datetime('now') 
       RETURNING *`,
      [user_id, ip_address, user_agent]
    );

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Song Rating API
app.post('/api/ratings', async (req, res) => {
  try {
    const { user_id, artist, title, album, rating } = req.body;

    // Validate input
    if (!user_id || !artist || !title || !rating) {
      return res.status(400).json({ 
        error: 'user_id, artist, title, and rating are required' 
      });
    }

    if (!['up', 'down'].includes(rating)) {
      return res.status(400).json({ 
        error: 'rating must be either "up" or "down"' 
      });
    }

    const song_id = createSongId(artist, title);

    // Register user if not exists
    const ip_address = getClientIp(req);
    const user_agent = req.headers['user-agent'];
    await db.query(
      `INSERT INTO users (user_id, ip_address, user_agent, updated_at) 
       VALUES (?, ?, ?, datetime('now')) 
       ON CONFLICT(user_id) DO UPDATE SET updated_at = datetime('now')`,
      [user_id, ip_address, user_agent]
    );

    // Upsert song
    await db.query(
      `INSERT INTO songs (song_id, artist, title, album) 
       VALUES (?, ?, ?, ?) 
       ON CONFLICT(song_id) DO UPDATE SET 
         artist = excluded.artist, 
         title = excluded.title, 
         album = excluded.album`,
      [song_id, artist, title, album || null]
    );

    // Upsert rating
    await db.query(
      `INSERT INTO song_ratings (user_id, song_id, rating, updated_at) 
       VALUES (?, ?, ?, datetime('now')) 
       ON CONFLICT(user_id, song_id) DO UPDATE SET 
         rating = excluded.rating, 
         updated_at = datetime('now')`,
      [user_id, song_id, rating]
    );

    // Get updated summary
    const result = await db.query(
      `SELECT 
         s.song_id,
         s.artist,
         s.title,
         COUNT(CASE WHEN sr.rating = 'up' THEN 1 END) as thumbs_up,
         COUNT(CASE WHEN sr.rating = 'down' THEN 1 END) as thumbs_down,
         COUNT(sr.id) as total_votes
       FROM songs s
       LEFT JOIN song_ratings sr ON s.song_id = sr.song_id
       WHERE s.song_id = ?
       GROUP BY s.song_id, s.artist, s.title`,
      [song_id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ratings/:artist/:title', async (req, res) => {
  try {
    const { artist, title } = req.params;
    const { user_id } = req.query;

    const song_id = createSongId(decodeURIComponent(artist), decodeURIComponent(title));

    // Get rating summary
    const summaryResult = await db.query(
      `SELECT 
         s.song_id,
         s.artist,
         s.title,
         s.album,
         COUNT(CASE WHEN sr.rating = 'up' THEN 1 END) as thumbs_up,
         COUNT(CASE WHEN sr.rating = 'down' THEN 1 END) as thumbs_down,
         COUNT(sr.id) as total_votes
       FROM songs s
       LEFT JOIN song_ratings sr ON s.song_id = sr.song_id
       WHERE s.song_id = ?
       GROUP BY s.song_id, s.artist, s.title, s.album`,
      [song_id]
    );

    let userVote = null;
    if (user_id) {
      const voteResult = await db.query(
        'SELECT rating FROM song_ratings WHERE user_id = ? AND song_id = ?',
        [user_id, song_id]
      );
      userVote = voteResult.rows[0]?.rating || null;
    }

    const summary = summaryResult.rows[0] || {
      song_id: song_id,
      artist: '',
      title: '',
      album: null,
      thumbs_up: 0,
      thumbs_down: 0,
      total_votes: 0
    };
    res.json({
      success: true,
      data: {
        ...summary,
        user_vote: userVote
      }
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top rated songs
app.get('/api/ratings/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await db.query(`
      SELECT 
        song_id,
        artist,
        title,
        album,
        thumbs_up,
        thumbs_down,
        total_votes,
        CAST(thumbs_up AS REAL) / NULLIF(total_votes, 0) as approval_rate
      FROM song_rating_summary 
      WHERE total_votes >= 3
      ORDER BY approval_rate DESC, total_votes DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Top ratings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all database data for admin view
app.get('/api/admin/data', async (req, res) => {
  try {
    // Get all songs with ratings
    const songsResult = await db.query(`
      SELECT 
        song_id,
        artist,
        title,
        album,
        thumbs_up,
        thumbs_down,
        total_votes,
        CASE 
          WHEN total_votes > 0 THEN ROUND(CAST(thumbs_up AS REAL) / total_votes * 100, 1)
          ELSE 0
        END as approval_percentage
      FROM song_rating_summary 
      ORDER BY total_votes DESC, thumbs_up DESC
    `);

    // Get user stats
    const usersResult = await db.query(`
      SELECT 
        user_id,
        ip_address,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM song_ratings WHERE song_ratings.user_id = users.user_id) as votes_cast
      FROM users 
      ORDER BY updated_at DESC
      LIMIT 20
    `);

    // Get recent votes
    const votesResult = await db.query(`
      SELECT 
        sr.rating,
        sr.user_id,
        sr.created_at,
        s.artist,
        s.title
      FROM song_ratings sr
      JOIN songs s ON sr.song_id = s.song_id
      ORDER BY sr.created_at DESC
      LIMIT 20
    `);

    // Get summary stats
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM songs) as total_songs,
        (SELECT COUNT(*) FROM song_ratings) as total_votes,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM song_ratings WHERE rating = 'up') as total_thumbs_up,
        (SELECT COUNT(*) FROM song_ratings WHERE rating = 'down') as total_thumbs_down
    `);

    res.json({
      success: true,
      data: {
        songs: songsResult.rows,
        users: usersResult.rows,
        recent_votes: votesResult.rows,
        stats: statsResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Admin data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database tables
app.post('/api/init-db', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    await db.runMultipleStatements(initSql);
    
    res.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database init error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example API endpoint for data
app.get('/api/data', async (req, res) => {
  try {
    // Example query - you can replace this with your actual data queries
    const result = await db.query("SELECT datetime('now') as current_time");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});