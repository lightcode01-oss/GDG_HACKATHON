import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import asyncio

load_dotenv()

app = FastAPI(title="CrisisAI Classification Service v2")

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

@app.get("/")
def read_root():
    return {"status": "AI service is running asynchronously"}

@app.post("/classify")
async def classify_text(req: ClassifyRequest):
    if not HF_API_KEY:
        return {"type": "medical", "severity": "medium", "error": "HF_API_KEY not found"}
        
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    
    # Classify Type
    payload_type = {
        "inputs": req.text,
        "parameters": {"candidate_labels": ["fire", "medical", "accident", "security", "natural disaster", "other"]}
    }
    
    # Classify Severity
    payload_severity = {
        "inputs": req.text,
        "parameters": {"candidate_labels": ["low", "medium", "high"]}
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Run both classifying tasks concurrently for incredible speed
            type_task = client.post(HF_URL, headers=headers, json=payload_type)
            sev_task = client.post(HF_URL, headers=headers, json=payload_severity)
            
            response_type, response_sev = await asyncio.gather(type_task, sev_task)
            
            result_type = response_type.json()
            result_sev = response_sev.json()
            
            predicted_type = "other"
            if "labels" in result_type and len(result_type["labels"]) > 0:
                predicted_type = result_type["labels"][0]
                
            predicted_severity = "low"
            if "labels" in result_sev and len(result_sev["labels"]) > 0:
                predicted_severity = result_sev["labels"][0]
                
            return {
                "type": predicted_type,
                "severity": predicted_severity
            }
            
    except Exception as e:
        return {"type": "other", "severity": "low", "error": str(e)}
