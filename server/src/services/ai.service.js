const axios = require("axios");

exports.classifyText = async (text) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    
    // Attempt to call AI microservice with 10s timeout
    const res = await axios.post(`${aiServiceUrl}/classify`, {
      text,
    }, { timeout: 30000 }); // Matches AI service timeout

    // Only return data if the microservice explicitly succeeded
    if (res.data && res.data.success) {
      return res.data.data;
    }
    
    // If successful HTTP but internal success: false, throw to trigger fallback
    throw new Error(res.data?.error || "AI_SERVICE_INTERNAL_FAILURE");
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error("AI Service Error: Connection refused. Is the microservice running on port 8000?");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("AI Service Error: Request timed out.");
    } else {
      console.error("AI Service Error:", error.message);
    }
    
    // Fallback: Local NLP Heuristics
    const lowerText = text.toLowerCase();
    
    // Type Heuristics
    let type = "other";
    if (/(fire|smoke|burn|arson|blaze)/.test(lowerText)) { type = "fire"; }
    else if (/(hurt|blood|shot|medical|ambulance|breath|heart|pain|bleeding)/.test(lowerText)) { type = "medical"; }
    else if (/(crash|accident|collision|wreck|smash)/.test(lowerText)) { type = "accident"; }
    else if (/(gun|shoot|theft|robbery|intruder|attack|hostage|bomb)/.test(lowerText)) { type = "security"; }
    else if (/(earthquake|quake|flood|tsunami|tornado|hurricane|storm|weather|landslide)/.test(lowerText)) { type = "natural disaster"; }

    // Severity Heuristics
    let severity = "low";
    if (/(dead|dying|bomb|hostage|shooter|massive|huge|catastrophic|trapped|unconscious)/.test(lowerText) || type === "fire") severity = "high";
    else if (/(hurt|bleeding|crash|robbery|smoke|storm|fast|weapon)/.test(lowerText)) severity = "medium";

    return { 
      type, 
      severity, 
      error: "AI service unreachable/rate-limited, using local heuristic fallback",
      original_error: error.message 
    };
  }
};
