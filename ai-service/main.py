import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CrisisAI")

app = FastAPI(title="CrisisAI Classification Service - Production Ready")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassifyRequest(BaseModel):
    text: str

class ClassificationData(BaseModel):
    type: str
    severity: str

class ClassifyResponse(BaseModel):
    success: bool
    data: ClassificationData

def keyword_classifier(text: str) -> dict:
    text = text.lower()
    
    # Type rules
    # fire → fire, smoke, burn
    # medical → blood, injury, pain
    # accident → crash, collision
    # security → gun, robbery, attack
    # disaster → earthquake, flood, storm
    # else → other
    
    classification_type = "other"
    if any(k in text for k in ["fire", "smoke", "burn"]):
        classification_type = "fire"
    elif any(k in text for k in ["blood", "injury", "pain"]):
        classification_type = "medical"
    elif any(k in text for k in ["crash", "collision"]):
        classification_type = "accident"
    elif any(k in text for k in ["gun", "robbery", "attack"]):
        classification_type = "security"
    elif any(k in text for k in ["earthquake", "flood", "storm"]):
        classification_type = "disaster"

    # Severity rules
    # high → fire, gun, bomb, dead
    # medium → injury, crash
    # low → default
    
    severity = "low"
    if any(k in text for k in ["fire", "gun", "bomb", "dead"]):
        severity = "high"
    elif any(k in text for k in ["injury", "crash"]):
        severity = "medium"
        
    return {
        "type": classification_type,
        "severity": severity
    }

@app.get("/")
def health_check():
    return {
        "status": "online",
        "engine": "Keyword-Based Classifier",
        "version": "1.0.0"
    }

@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    try:
        logger.info(f"Classifying: {req.text[:50]}...")
        result = keyword_classifier(req.text)
        
        return ClassifyResponse(
            success=True,
            data=ClassificationData(
                type=result["type"],
                severity=result["severity"]
            )
        )
    except Exception as e:
        logger.error(f"Classification error: {str(e)}")
        # In case of any unexpected internal error, return a safe "other/low" response
        # to ensure the backend always receives valid JSON.
        return ClassifyResponse(
            success=True,
            data=ClassificationData(
                type="other",
                severity="low"
            )
        )

if __name__ == "__main__":
    import uvicorn
    # Use environment variable PORT or default to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
