const sqlite3 = require('sqlite3').verbose();
const path = require('path'); // Added for reliable file pathing

// Use path.join to ensure the database file is always in the same folder as this file
const dbPath = path.join(__dirname, 'social.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // --- TABLE CREATION ---
    
    // Users: Added raw_password to match your server.js logic
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username TEXT UNIQUE NOT NULL, 
        email TEXT UNIQUE NOT NULL, 
        password TEXT NOT NULL,
        raw_password TEXT
    )`);
    
    // Posts: Stores the main wall messages
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        user_id INTEGER, 
        content TEXT NOT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    // Followers: Links users to each other
    db.run(`CREATE TABLE IF NOT EXISTS followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        follower_id INTEGER, 
        following_id INTEGER, 
        UNIQUE(follower_id, following_id)
    )`);
    
    // Likes: Track post reactions
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        user_id INTEGER, 
        post_id INTEGER, 
        UNIQUE(user_id, post_id)
    )`);
    
    // Comments: Stores replies to posts
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // --- CLEANUP LOGIC ---
    // Automatically removes "ghost" records
    db.run(`DELETE FROM users WHERE username IS NULL OR username = '' OR email IS NULL OR email = ''`);
    db.run(`DELETE FROM posts WHERE content IS NULL OR content = ''`);
    db.run(`DELETE FROM comments WHERE content IS NULL OR content = ''`);

    console.log("Database initialized: Tables created and path verified at " + dbPath);
});

module.exports = db;