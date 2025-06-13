# app/main.py

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.ask import ask_router
from app.export import export_router
from app.metadata import metadata_router
from app.file_upload import upload_router
from app.ai_insights import insights_router
from app.db import engine, init_database
import os

# Initialize database tables on startup
init_database()

app = FastAPI(title="Reportzy Analytics API", version="1.0.0", description="Analytics & Reporting with AI-powered SQL generation")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(ask_router, prefix="/api", tags=["AI Analytics"])
app.include_router(export_router, prefix="/api", tags=["Data Export"])
app.include_router(metadata_router, prefix="/api", tags=["Metadata Management"])
app.include_router(upload_router, prefix="/api", tags=["File Upload"])
app.include_router(insights_router, prefix="/api", tags=["AI Insights"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Serve dashboard
@app.get("/dashboard")
async def dashboard():
    """Serve the analytics dashboard"""
    dashboard_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dashboard.html")
    return FileResponse(dashboard_path, media_type="text/html")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Reportzy Analytics API",
        "version": "1.0.0",
        "endpoints": {
            "dashboard": "/dashboard",
            "health": "/health",
            "ask": "/api/ask",
            "upload": "/api/upload",
            "datasets": "/api/datasets",
            "export": "/api/export",
            "metadata": "/api/metadata",
            "insights": "/api/generate-insights",
            "analytics": "/api/analytics-summary"
        }
    }
