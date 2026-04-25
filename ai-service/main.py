import os
import logging
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CrisisAI")

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI(title="CrisisAI Advanced AI Service")

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

class GuidanceRequest(BaseModel):
    incident_type: str
    description: str

class GuidanceResponse(BaseModel):
    success: bool
    guidance: str
    resources_suggested: list[str]

@app.get("/")
def health_check():
    return {
        "status": "online",
        "engine": "Gemini 1.5 Flash",
        "version": "2.0.0"
    }

@app.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest):
    try:
        logger.info(f"Classifying via Gemini: {req.text[:50]}...")
        
        prompt = f"""
        Analyze the following emergency report and classify it.
        Return ONLY a JSON object with 'type' and 'severity'.
        Types: 'fire', 'medical', 'accident', 'security', 'disaster', 'other'.
        Severity: 'low', 'medium', 'high'.
        
        Report: "{req.text}"
        """
        
        response = model.generate_content(prompt)
        # Extract JSON from response
        res_text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(res_text)
        
        return ClassifyResponse(
            success=True,
            data=ClassificationData(
                type=result.get("type", "other"),
                severity=result.get("severity", "low")
            )
        )
    except Exception as e:
        logger.error(f"Gemini classification error: {str(e)}")
        # Fallback to safe default
        return ClassifyResponse(
            success=True,
            data=ClassificationData(type="other", severity="low")
        )

@app.post("/guidance", response_model=GuidanceResponse)
async def get_guidance(req: GuidanceRequest):
    try:
        logger.info(f"Generating guidance for: {req.incident_type}")
        
        prompt = f"""
        Provide immediate, concise safety guidance for a person at the scene of the following emergency.
        Incident Type: {req.incident_type}
        Description: {req.description}
        
        Return a JSON object with 'guidance' (string, max 3 bullet points) and 'resources_suggested' (list of strings, e.g., 'Fire Extinguisher', 'First Aid Kit').
        """
        
        response = model.generate_content(prompt)
        res_text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(res_text)
        
        return GuidanceResponse(
            success=True,
            guidance=result.get("guidance", "Stay safe and wait for emergency services."),
            resources_suggested=result.get("resources_suggested", ["First Aid Kit"])
        )
    except Exception as e:
        logger.error(f"Gemini guidance error: {str(e)}")
        return GuidanceResponse(
            success=False,
            guidance="Stay calm, move to a safe location, and wait for professional help.",
            resources_suggested=["Phone", "Flashlight"]
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
