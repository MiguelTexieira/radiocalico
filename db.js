const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create database file path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'radiocalico.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(-1);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Helper function to promisify database operations
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            rows: [], 
            lastID: this.lastID, 
            changes: this.changes 
          });
        }
      });
    }
  });
}

// Helper function to run multiple statements (for schema creation)
function runMultipleStatements(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  query,
  runMultipleStatements,
  db
};