import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="CrisisAI Classification Service - Production")

# CORS setup for cross-service communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HuggingFace Configuration
HF_API_KEY = os.getenv("HF_API_KEY")
HF_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

class ClassifyRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "AI service is online", "mode": "Inference API"}

@app.post("/classify")
def classify_text(req: ClassifyRequest):
    if not HF_API_KEY:
        raise HTTPException(status_code=500, detail="HF_API_KEY not configured on server")
        
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    
    # Define labels for classification
    type_labels = ["fire", "medical", "accident", "security", "natural disaster", "other"]
    severity_labels = ["low", "medium", "high"]

    def query_hf(text, labels):
        payload = {
            "inputs": text,
            "parameters": {"candidate_labels": labels}
        }
        response = requests.post(HF_URL, headers=headers, json=payload, timeout=20)
        
        if response.status_code != 200:
            # Handle model loading state (503) or other errors
            error_data = response.json()
            if response.status_code == 503:
                 return {"error": "Model is loading", "estimated_time": error_data.get("estimated_time", 20)}
            raise HTTPException(status_code=response.status_code, detail=f"HF API Error: {error_data}")
            
        return response.json()

    try:
        # Get Incident Type
        type_result = query_hf(req.text, type_labels)
        predicted_type = type_result["labels"][0] if "labels" in type_result else "other"

        # Get Incident Severity
        severity_result = query_hf(req.text, severity_labels)
        predicted_severity = severity_result["labels"][0] if "labels" in severity_result else "low"
        
        return {
            "type": predicted_type,
            "severity": predicted_severity,
            "confidence": type_result.get("scores", [0])[0]
        }
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        return {
            "type": "other", 
            "severity": "low", 
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
