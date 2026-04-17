import os
import time
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="CrisisAI Classification Service - Resilience Mode")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_API_KEY = os.getenv("HF_API_KEY")
HF_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

class ClassifyRequest(BaseModel):
    text: str

def safe_query_hf(payload, retries=2):
    """Safe HuggingFace API call with retry logic and error handling."""
    if not HF_API_KEY:
        return {"success": False, "error": "HF_API_KEY_MISSING"}

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    
    for attempt in range(retries + 1):
        try:
            response = requests.post(HF_URL, headers=headers, json=payload, timeout=30)
            
            # Handle empty response
            if not response.text:
                if attempt < retries: continue
                return {"success": False, "error": "EMPTY_RESPONSE"}

            # Safe JSON parsing
            try:
                data = response.json()
            except ValueError:
                if attempt < retries: continue
                return {"success": False, "error": "INVALID_JSON"}

            # Handle 503 (Model Loading)
            if response.status_code == 503:
                if attempt < retries:
                    time.sleep(data.get("estimated_time", 5))
                    continue
                return {"success": False, "error": "MODEL_LOADING", "estimated_time": data.get("estimated_time", 20)}

            # Handle success
            if response.status_code == 200:
                return {"success": True, "data": data}

            # Any other error
            if attempt < retries: continue
            return {"success": False, "error": f"HTTP_{response.status_code}", "detail": data}

        except requests.exceptions.Timeout:
            if attempt < retries: continue
            return {"success": False, "error": "TIMEOUT"}
        except Exception as e:
            if attempt < retries: continue
            return {"success": False, "error": "UNKNOWN_ERROR", "detail": str(e)}
            
    return {"success": False, "error": "MAX_RETRIES_REACHED"}

@app.get("/")
def read_root():
    return {"status": "AI service is online", "mode": "Resilience API"}

@app.post("/classify")
def classify_text(req: ClassifyRequest):
    # Incident Type Labels
    type_labels = ["fire", "medical", "accident", "security", "natural disaster", "other"]
    
    # Incident Severity Labels
    severity_labels = ["low", "medium", "high"]

    # Step 1: Classify Type
    type_response = safe_query_hf({
        "inputs": req.text,
        "parameters": {"candidate_labels": type_labels}
    })

    if not type_response["success"]:
        return {
            "success": False,
            "error": type_response["error"],
            "fallback": True
        }

    # Step 2: Classify Severity
    severity_response = safe_query_hf({
        "inputs": req.text,
        "parameters": {"candidate_labels": severity_labels}
    })

    if not severity_response["success"]:
         return {
            "success": False,
            "error": severity_response["error"],
            "fallback": True
        }

    # Extract results
    try:
        predicted_type = type_response["data"]["labels"][0]
        predicted_severity = severity_response["data"]["labels"][0]
        confidence = type_response["data"]["scores"][0]
        
        return {
            "success": True,
            "data": {
                "type": predicted_type,
                "severity": predicted_severity,
                "confidence": confidence
            }
        }
    except (KeyError, IndexError):
        return {
            "success": False,
            "error": "DATA_MALFORMED",
            "fallback": True
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
