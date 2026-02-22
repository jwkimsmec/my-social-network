const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./social.db');

db.serialize(() => {
    // --- TABLE CREATION ---
    
    // Users: Stores credentials with NOT NULL constraints to prevent empty data
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username TEXT UNIQUE NOT NULL, 
        email TEXT UNIQUE NOT NULL, 
        password TEXT NOT NULL
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
    // Automatically removes "ghost" records that have no text or are null
    
    // Remove users with empty names or emails
    db.run(`DELETE FROM users WHERE username IS NULL OR username = '' OR email IS NULL OR email = ''`);

    // Remove posts with no content
    db.run(`DELETE FROM posts WHERE content IS NULL OR content = ''`);

    // Remove comments with no content
    db.run(`DELETE FROM comments WHERE content IS NULL OR content = ''`);

    console.log("Database initialized: Tables created and empty records purged.");
});

module.exports = db;