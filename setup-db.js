#!/usr/bin/env node

const db = require('./db');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('Setting up RadioCalico database...');
    
    try {
        // Read the SQL file
        const sqlFile = path.join(__dirname, 'init-db.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Execute the SQL using the multiple statements method
        await db.runMultipleStatements(sql);
        
        console.log('✓ Database tables and functions created successfully');
        
        // Test the database
        console.log('\nTesting database operations...');
        
        // Test user registration
        const testUserId = 'test_user_' + Date.now();
        await db.query(
            `INSERT INTO users (user_id, ip_address, user_agent) 
             VALUES (?, ?, ?)`,
            [testUserId, '127.0.0.1', 'Test Script']
        );
        console.log('✓ User registration test passed');
        
        // Test song and rating insertion
        const testSongId = 'test_song_1';
        
        // Insert song
        await db.query(
            `INSERT INTO songs (song_id, artist, title, album) 
             VALUES (?, ?, ?, ?)`,
            [testSongId, 'Test Artist', 'Test Song', 'Test Album']
        );
        
        // Insert rating
        await db.query(
            `INSERT INTO song_ratings (user_id, song_id, rating) 
             VALUES (?, ?, ?)`,
            [testUserId, testSongId, 'up']
        );
        console.log('✓ Song rating test passed');
        
        // Test rating retrieval
        const ratingResult = await db.query(
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
            [testSongId]
        );
        console.log('✓ Rating retrieval test passed:', ratingResult.rows[0]);
        
        // Clean up test data
        await db.query('DELETE FROM song_ratings WHERE user_id = ?', [testUserId]);
        await db.query('DELETE FROM songs WHERE song_id = ?', [testSongId]);
        await db.query('DELETE FROM users WHERE user_id = ?', [testUserId]);
        console.log('✓ Test data cleaned up');
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nYou can now start the server with: npm start');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('\nMake sure:');
        console.error('1. You have write permissions for the database file');
        console.error('2. The script has proper permissions to execute');
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run setup
setupDatabase();