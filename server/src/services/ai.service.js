const axios = require("axios");

exports.classifyText = async (text) => {
  const meta = { 
    type: "other", 
    severity: "low", 
    success: false, 
    fallback: true 
  };

  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    
    // Call AI microservice with 30s timeout
    const res = await axios.post(`${aiServiceUrl}/classify`, {
      text,
    }, { timeout: 30000 });

    // Validate the outer structure
    if (res.data && res.data.success && res.data.data) {
      const { type, severity } = res.data.data;
      
      // Strict key validation (Senior Standard)
      if (type && severity) {
        return {
          success: true,
          type,
          severity,
          confidence: res.data.data.confidence || 0
        };
      }
    }
    
    // If successful HTTP but missing keys/success:false, trigger internal throw
    throw new Error(res.data?.error || "INCOMPLETE_API_RESPONSE");

  } catch (error) {
    console.warn(`[AI_SYNC_WARNING] Fallback initiated: ${error.message}`);
    
    // Heuristic Fallback Engine
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

    return { 
      ...meta,
      type, 
      severity, 
      error: error.message || "AI_SERVICE_UNAVAILABLE" 
    };
  }
};
