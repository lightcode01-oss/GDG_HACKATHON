import os
import time
import requests
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CrisisAI")

# Load environment variables
load_dotenv()

app = FastAPI(title="CrisisAI Classification Service - Production Stable")

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

# Validation on Startup
if not HF_API_KEY:
    logger.error("CRITICAL ERROR: HF_API_KEY not found in environment variables. Incident classification will fail.")
else:
    logger.info("HF_API_KEY detected. AI service ready for inference.")

class ClassifyRequest(BaseModel):
    text: str

def query_huggingface(payload, headers, timeout=20):
    """Execution unit for concurrent HF queries."""
    try:
        response = requests.post(HF_URL, headers=headers, json=payload, timeout=timeout)
        
        if not response.text:
            return {"success": False, "error": "EMPTY_RESPONSE"}

        try:
            data = response.json()
        except ValueError:
            return {"success": False, "error": "INVALID_JSON"}

        # Handle Model Loading
        if response.status_code == 503:
            return {"success": False, "error": "MODEL_LOADING", "estimated_time": data.get("estimated_time", 20)}

        if response.status_code == 200 and isinstance(data, dict):
            return {"success": True, "data": data}

        return {"success": False, "status_code": response.status_code, "detail": data}

    except requests.exceptions.Timeout:
        return {"success": False, "error": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def safe_batch_classify(text, retries=1):
    """Run Type and Severity classification in parallel for max performance."""
    if not HF_API_KEY:
         return {"success": False, "error": "AI_KEY_MISSING"}

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    type_labels = ["fire", "medical", "accident", "security", "natural disaster", "other"]
    severity_labels = ["low", "medium", "high"]

    payloads = [
        {"id": "type", "inputs": text, "parameters": {"candidate_labels": type_labels}},
        {"id": "severity", "inputs": text, "parameters": {"candidate_labels": severity_labels}}
    ]

    results = {}
    
    # Concurrent execution using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_to_id = {executor.submit(query_huggingface, p, headers): p["id"] for p in payloads}
        
        for future in as_completed(future_to_id):
            id_tag = future_to_id[future]
            try:
                data = future.result()
                results[id_tag] = data
            except Exception as e:
                results[id_tag] = {"success": False, "error": str(e)}

    return results

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "engine": "Inference API", 
        "key_active": bool(HF_API_KEY),
        "concurrency": "enabled"
    }

@app.post("/classify")
def classify(req: ClassifyRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text input")

    logger.info(f"Incoming classification request for snippet: {req.text[:30]}...")
    
    # Single retry logic
    results = safe_batch_classify(req.text)
    
    # Check if we need to retry due to model loading
    if any(r.get("error") == "MODEL_LOADING" for r in results.values()):
        logger.info("Model is loading at HF. Initiating 10s backoff retry...")
        time.sleep(10)
        results = safe_batch_classify(req.text)

    # Validate both branches succeeded
    if results.get("type", {}).get("success") and results.get("severity", {}).get("success"):
        try:
            t_data = results["type"]["data"]
            s_data = results["severity"]["data"]
            
            return {
                "success": True,
                "data": {
                    "type": t_data["labels"][0],
                    "severity": s_data["labels"][0],
                    "confidence": t_data["scores"][0]
                }
            }
        except Exception as e:
            logger.error(f"Mapping error: {str(e)}")
            return {"success": False, "error": "DATA_MAP_FAILURE", "fallback": True}
    
    # Detailed error reporting
    error_msg = results.get("type", {}).get("error") or results.get("severity", {}).get("error") or "UNKNOWN_FAILURE"
    logger.warning(f"Classification failed: {error_msg}. Using fallback.")
    return {
        "success": False, 
        "error": error_msg,
        "fallback": True
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
