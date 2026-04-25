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
    
    // Type Detection
    if (/(fire|smoke|burn|arson|blaze|flame|explosion)/.test(lowerText)) { type = "fire"; }
    else if (/(hurt|blood|shot|medical|ambulance|breath|heart|pain|bleeding|injury|wound|unconscious|faint)/.test(lowerText)) { type = "medical"; }
    else if (/(crash|accident|collision|wreck|smash|highway|traffic)/.test(lowerText)) { type = "accident"; }
    else if (/(gun|shoot|theft|robbery|intruder|attack|hostage|bomb|weapon|terror|violence)/.test(lowerText)) { type = "security"; }
    else if (/(earthquake|quake|flood|tsunami|tornado|hurricane|storm|weather|landslide|volcano)/.test(lowerText)) { type = "natural disaster"; }

    // Severity Detection
    let severity = "low";
    if (/(dead|dying|bomb|hostage|shooter|massive|huge|catastrophic|trapped|unconscious|critical|emergency|immediate|killing)/.test(lowerText) || 
        type === "fire" || 
        type === "security") {
        severity = "high";
    }
    else if (/(hurt|bleeding|crash|robbery|smoke|storm|fast|weapon|injury|broken|theft)/.test(lowerText) || 
             type === "medical" || 
             type === "accident") {
        severity = "medium";
    }

    return { 
      ...meta,
      type, 
      severity, 
      error: error.message || "AI_SERVICE_UNAVAILABLE" 
    };
  }
};

exports.getGuidance = async (incidentType, description) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const res = await axios.post(`${aiServiceUrl}/guidance`, {
      incident_type: incidentType,
      description
    }, { timeout: 15000 });

    if (res.data && res.data.success) {
      return res.data;
    }
    throw new Error("GUIDANCE_FAILED");
  } catch (error) {
    return {
      success: false,
      guidance: "Stay safe, move to a secure location, and wait for emergency services.",
      resources_suggested: ["First Aid Kit", "Water"]
    };
  }
};
