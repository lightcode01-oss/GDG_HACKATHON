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

    return { type, severity };
  } catch (error) {
    console.warn(`[AI_SYNC_WARNING] Fallback initiated: ${error.message}`);
    
    // Controlled Heuristic Fallback Engine inside catch
    const lowerText = text.toLowerCase();
    let type = "other";
    if (/(fire|smoke|burn|arson|blaze)/.test(lowerText)) { type = "fire"; }
    else if (/(hurt|blood|shot|medical|ambulance|breath|heart|pain|bleeding)/.test(lowerText)) { type = "medical"; }
    else if (/(crash|accident|collision|wreck|smash)/.test(lowerText)) { type = "accident"; }
    else if (/(gun|shoot|theft|robbery|intruder|attack|hostage|bomb)/.test(lowerText)) { type = "security"; }
    else if (/(earthquake|quake|flood|tsunami|tornado|hurricane|storm|weather|landslide)/.test(lowerText)) { type = "natural disaster"; }

    let severity = "low";
    if (/(dead|dying|bomb|hostage|shooter|massive|huge|catastrophic|trapped|unconscious)/.test(lowerText) || type === "fire") severity = "high";
    else if (/(hurt|bleeding|crash|robbery|smoke|storm|fast|weapon)/.test(lowerText)) severity = "medium";

    // NEVER return success:false here, backend decides
    return { type, severity };
  }
};
