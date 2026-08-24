import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router

app = FastAPI(
    title="Churn Retention Phase 2 - Multi-Agent AI API",
    description="Backend API serving real-time analytics, agent workflows, and retention decisions",
    version="2.0.0"
)

# Enable CORS for frontend Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Retention Multi-Agent AI Engine",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.server:app", host="127.0.0.1", port=8000, reload=True)
