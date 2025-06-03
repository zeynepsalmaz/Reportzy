# app/main.py

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.ingest import ingest_router
from app.ask import ask_router
from app.export import export_router
from app.metadata import metadata_router
from app.feedback import feedback_router
from app.backup import backup_router
from app.monitoring import monitoring_router
from app.analytics import analytics_router
from app.db import engine, init_database
import os

# Initialize database tables on startup
init_database()

app = FastAPI(title="Reportzy Analytics API", version="1.0.0", description="Analytics & Reporting MVP with AI-powered SQL generation")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(ingest_router, prefix="/api", tags=["Data Ingestion"])
app.include_router(ask_router, prefix="/api", tags=["AI Analytics"])
app.include_router(export_router, prefix="/api", tags=["Data Export"])
app.include_router(metadata_router, prefix="/api", tags=["Metadata Management"])
app.include_router(feedback_router, prefix="/api", tags=["User Feedback"])
app.include_router(backup_router, prefix="/api", tags=["Backup Automation"])
app.include_router(monitoring_router, prefix="/api", tags=["System Monitoring"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Unified Analytics"])

# Serve dashboard
@app.get("/dashboard")
async def dashboard():
    """Serve the analytics dashboard"""
    dashboard_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dashboard.html")
    return FileResponse(dashboard_path, media_type="text/html")

@app.get("/")
async def root():
    return {"message": "Reportzy Analytics API is running 🚀", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint - returns API + DB status"""
    try:
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            db_status = "connected" if result.fetchone() else "disconnected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return {
        "api_status": "healthy",
        "database_status": db_status,
        "service": "Reportzy Analytics API",
        "version": "1.0.0"
    }
