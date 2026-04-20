const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ status: "backend running" });
});

// CLASSIFY ROUTE
app.post("/api/classify", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "TEXT_REQUIRED"
      });
    }

    // CALL AI SERVICE
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/classify`,
        { text },
        { timeout: 5000 }
      );

      if (response.data && response.data.success) {
        return res.json(response.data);
      }

      throw new Error("INVALID_AI_RESPONSE");

    } catch (err) {
      console.log("AI FAILED → fallback");

      // FALLBACK RESPONSE
      return res.json({
        success: true,
        data: {
          type: "other",
          severity: "low"
        }
      });
    }

  } catch (err) {
    console.error("SERVER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR"
    });
  }
});

// START SERVER (CRITICAL FIX)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
