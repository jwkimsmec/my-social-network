const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const SECRET = "my_social_secret_2026";

// --- UPDATED EMAIL CONFIGURATION ---
// Replace the user/pass with your Gmail + App Password if you want real emails
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mabelle.beier@ethereal.email', 
        pass: '6mBvKzB1D4U8v1Yp6r'         
    }
});

// --- AUTHENTICATION ---
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, email, password, raw_password) VALUES (?, ?, ?, ?)`, 
        [username, email, hash, password], (err) => {
            if (err) return res.status(400).json({ error: "Username or Email taken" });
            res.json({ message: "Registration successful!" });
        });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: "User not found" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Wrong password" });
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    });
});

// --- UPDATED INVITATION SYSTEM ---
app.post('/send-invite', async (req, res) => {
    // Look for token in either body (from your sendInvite fix) or headers
    const token = req.body.token || req.headers['authorization'];
    const { friendEmail } = req.body;

    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token, SECRET);
        if (decoded.username !== 'Jae') return res.status(403).json({ error: "Only Jae can invite" });

        const mailOptions = {
            from: '"LiteSocial" <noreply@litesocial.com>',
            to: friendEmail,
            subject: 'Join LiteSocial!',
            html: `<h3>Hello!</h3><p>Jae has invited you.</p>
                   <p><a href="https://jae-social-network.onrender.com">Click here to join!</a></p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Invitation sent to " + friendEmail });
    } catch (e) { 
        console.error("Invite Error:", e.message);
        res.status(401).json({ error: "Auth failed: " + e.message }); 
    }
});

// --- OTHER ROUTES ---
app.get('/users', (req, res) => {
    db.all(`SELECT id, username, email, raw_password FROM users`, (err, rows) => res.json(rows || []));
});

app.post('/post', (req, res) => {
    const { token, content } = req.body;
    try {
        const user = jwt.verify(token, SECRET);
        db.run(`INSERT INTO posts (user_id, content) VALUES (?, ?)`, [user.id, content], () => {
            io.emit('new-post'); 
            res.json({ message: "Posted!" });
        });
    } catch (e) { res.status(401).json({ error: "Auth fail" }); }
});

app.get('/feed', (req, res) => {
    const token = req.headers['authorization'];
    try {
        const user = jwt.verify(token, SECRET);
        db.all(`SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY created_at DESC`, (err, rows) => res.json(rows || []));
    } catch (e) { res.status(401).json({ error: "Login required" }); }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));