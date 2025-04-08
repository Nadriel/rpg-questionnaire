require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
//app.use(cors());
app.use(express.json());

// PostgreSQL Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

const corsOptions = {
    origin: "http://localhost:3000", // Allow frontend
    methods: "GET,POST,OPTIONS", // Allowed request types
    allowedHeaders: ["Content-Type"],
  };
  
app.use(cors(corsOptions)); // Use proper CORS settings
app.options("*", cors(corsOptions)); // Allow preflight requests
 

// 🚀 Route 1: Test API
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// 🚀 Route 2: Create a Group
app.post('/groups', async (req, res) => {
    try {
        const { group_name } = req.body;
        const result = await pool.query(
            "INSERT INTO groups (group_name) VALUES ($1) RETURNING *",
            [group_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 🚀 Route 3: Get All Groups
app.get('/groups', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM groups");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 🚀 Route 4: Create a Question
app.post('/questions', async (req, res) => {
    try {
        const { group_id, question_text, question_type } = req.body;
        const result = await pool.query(
            "INSERT INTO questions (group_id, question_text, question_type) VALUES ($1, $2, $3) RETURNING *",
            [group_id, question_text, question_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 🚀 Route 5: Get All Questions for a Group
app.get('/groups/:group_id/questions', async (req, res) => {
    try {
        const { group_id } = req.params;
        const result = await pool.query(
            "SELECT * FROM questions WHERE group_id = $1",
            [group_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 🚀 Route 6: Submit a Response
// ✅ Route: Submit Multiple Responses (Updated)
app.post("/responses", async (req, res) => {
    try {
        const { responses, user_id } = req.body; // Expecting an array of responses

        if (!responses || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({ error: "Invalid responses array" });
        }

        const query = `
            INSERT INTO responses (question_id, user_id, answer_text) 
            VALUES ($1, $2, $3) RETURNING *;
        `;

        // Process all responses in parallel
        const promises = responses.map(({ question_id, answer_text }) =>
            pool.query(query, [question_id, user_id || null, answer_text])
        );

        await Promise.all(promises);

        res.status(201).json({ success: true, message: "Responses saved successfully!" });
    } catch (err) {
        console.error("Error saving responses:", err);
        res.status(500).json({ error: "Server error while saving responses" });
    }
});

// 🚀 Route 7: Get Responses for a Question
app.get('/questions/:question_id/responses', async (req, res) => {
    try {
        const { question_id } = req.params;
        const result = await pool.query(
            "SELECT * FROM responses WHERE question_id = $1",
            [question_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
