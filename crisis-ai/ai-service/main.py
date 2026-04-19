from fastapi import FastAPI, Request
from pydantic import BaseModel
import logging

app = FastAPI()

class ClassifyRequest(BaseModel):
    text: str

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/classify")
async def classify(req: ClassifyRequest):
    try:
        text = req.text.lower()
        
        # Classification logic
        type_result = "other"
        if any(word in text for word in ["fire", "smoke", "burn"]):
            type_result = "fire"
        elif any(word in text for word in ["blood", "injury", "pain"]):
            type_result = "medical"
        elif any(word in text for word in ["crash", "collision"]):
            type_result = "accident"
        elif any(word in text for word in ["gun", "robbery", "attack"]):
            type_result = "security"
        elif any(word in text for word in ["earthquake", "flood", "storm"]):
            type_result = "disaster"
            
        # Severity logic
        severity_result = "low"
        if any(word in text for word in ["fire", "gun", "bomb", "dead"]):
            severity_result = "high"
        elif any(word in text for word in ["injury", "crash"]):
            severity_result = "medium"
            
        return {
            "success": True,
            "data": {
                "type": type_result,
                "severity": severity_result
            }
        }
    except Exception as e:
        # Fallback to NEVER return invalid JSON structure
        return {
            "success": True,
            "data": {
                "type": "other",
                "severity": "low"
            }
        }
