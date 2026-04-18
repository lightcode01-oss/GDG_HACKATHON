const axios = require("axios");

exports.classifyText = async (text) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    
    // Call AI microservice with 15s timeout
    const res = await axios.post(`${aiServiceUrl}/classify`, {
      text,
    }, { timeout: 15000 });

    console.log(`[AI_SERVICE] Raw response:`, JSON.stringify(res.data));

    // Normalize fields from possible AI response formats
    const payload = res.data?.data || res.data || {};
    const type = payload.type || payload.label || payload.category;
    const severity = payload.severity || payload.level;

    // Strict validation
    if (!type || !severity) {
      throw new Error("INVALID_AI_SCHEMA: Missing normalized type or severity");
    }

    return { type, severity, confidence: payload.confidence || 0.5 };
  } catch (error) {
    console.warn(`[AI_SYNC_WARNING] AI Service Error: ${error.message}`);
    throw new Error("AI_SERVICE_FAILED");
  }
};
