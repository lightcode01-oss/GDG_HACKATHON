const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Health Check
app.get('/', (req, res) => {
    res.json({ status: "backend running" });
});

// Pure Proxy Endpoint
app.post('/api/classify', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.json({
                success: false,
                error: "EMPTY_INPUT"
            });
        }
        
        // Strictly proxying to AI service with NO internal classification fallback
        const response = await axios.post(`${AI_SERVICE_URL}/classify`, { text }, {
            timeout: 8000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Return EXACT AI response
        return res.json(response.data);

    } catch (error) {
        console.error("AI Service Unavailable:", error.message);
        return res.status(503).json({
            success: false,
            error: "AI_SERVICE_UNAVAILABLE"
        });
    }
});

// Standard Node Server with optional socket.io support
const server = http.createServer(app);

// Defensive Socket.io Initialization (if dependencies allow)
try {
    const { Server } = require("socket.io");
    const io = new Server(server, { cors: { origin: "*" } });
    app.set('io', io);
} catch (e) {
    console.warn("Socket.io could not be initialized. Real-time features disabled.");
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on 0.0.0.0:${PORT}`);
});
