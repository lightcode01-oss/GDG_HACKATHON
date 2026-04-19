const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

app.get('/', (req, res) => {
    res.json({ status: "backend running" });
});

app.post('/api/classify', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.json({
                success: true,
                data: { type: "other", severity: "low" }
            });
        }
        
        const response = await axios.post(`${AI_SERVICE_URL}/classify`, { text }, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data && typeof response.data.success === 'boolean') {
            return res.json(response.data);
        } else {
            throw new Error("Invalid AI response structure");
        }
    } catch (error) {
        console.error("AI Service Error:", error.message);
        // Fallback logic for any failure
        return res.json({
            success: true,
            data: {
                type: "other",
                severity: "low"
            }
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
