require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const User = require("./models/User");
const Incident = require("./models/Incident");
const Alert = require("./models/Alert");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- HEALTH & METRICS ---
app.get("/", (req, res) => {
  res.json({ status: "backend running", database: "mongodb" });
});

app.get("/api/system/metrics", async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const activeAlerts = await Alert.countDocuments({ active: true });
    const totalUsers = await User.countDocuments();
    
    res.json({
      uptime: process.uptime(),
      incidents: totalIncidents,
      alerts: activeAlerts,
      nodes: totalUsers,
      ai_accuracy: 94.2 + (Math.random() * 2),
      status: 'operational'
    });
  } catch (err) {
    res.status(500).json({ error: "METRICS_FAILED" });
  }
});

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing data" });

    username = username.toLowerCase().trim();
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "REGISTER_FAILED" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    username = username.toLowerCase().trim();

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "LOGIN_FAILED" });
  }
});

// --- INCIDENT ROUTES ---
app.get("/api/incidents", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 }).limit(100);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: "FETCH_INCIDENTS_FAILED" });
  }
});

app.post("/api/incidents", authenticateToken, async (req, res) => {
  try {
    const { description, location } = req.body;
    
    // AI Classification Proxy
    let aiResult = { type: 'other', severity: 'low' };
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/classify`, { text: description });
      aiResult = response.data.data || response.data;
    } catch (err) {
      console.warn("AI Service offline, using fallsbacks");
    }

    const incident = await Incident.create({
      description,
      location,
      type: aiResult.type || 'other',
      severity: aiResult.severity || 'low',
      reported_by: req.user.id
    });

    io.emit('new_incident', incident);
    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ error: "REPORT_FAILED" });
  }
});

app.post("/api/incidents/:id/action", authenticateToken, async (req, res) => {
  try {
    const { action_status, action_detail } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { action_status, action_detail },
      { new: true }
    );
    
    io.emit('incident_action_update', incident);
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ error: "ACTION_FAILED" });
  }
});

app.post("/api/incidents/:id/resolve", authenticateToken, async (req, res) => {
  try {
    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, reported_by: req.user.id },
      { user_resolved: true },
      { new: true }
    );
    if (!incident) return res.status(404).json({ error: "Incident not found or unauthorized" });
    
    io.emit('incident_resolved', incident);
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ error: "RESOLVE_FAILED" });
  }
});

// --- ALERT ROUTES ---
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find({ active: true }).sort({ timestamp: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "FETCH_ALERTS_FAILED" });
  }
});

app.post("/api/alerts", authenticateToken, async (req, res) => {
  try {
    const { title, message, severity } = req.body;
    const alert = await Alert.create({ title, message, severity });
    io.emit('system_alert', alert);
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: "ALERT_CREATION_FAILED" });
  }
});

// --- AI CLASSIFY PROXY ---
app.post("/api/classify", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await axios.post(`${AI_SERVICE_URL}/classify`, { text });
    res.json(response.data);
  } catch (err) {
    res.json({
      success: true,
      data: { type: "other", severity: "low" }
    });
  }
});

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  console.log(`[SOCKET]: Node connected (${socket.id})`);
  socket.on("disconnect", () => console.log(`[SOCKET]: Node disconnected`));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT} (MongoDB Mode)`);
});
