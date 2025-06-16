# backend/main.py

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from export import export_router
from metadata import metadata_router
from file_upload import upload_router
from dashboard import dashboard_router
from db import engine, init_database
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ai.ask import ask_router
from ai.ai_insights import insights_router
from api_connections import router as api_connections_router

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
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(ask_router, prefix="/api", tags=["AI Analytics"])
app.include_router(export_router, prefix="/api", tags=["Data Export"])
app.include_router(metadata_router, prefix="/api", tags=["Metadata Management"])
app.include_router(upload_router, prefix="/api", tags=["File Upload"])
app.include_router(insights_router, prefix="/api", tags=["AI Insights"])
app.include_router(api_connections_router, prefix="/api", tags=["API Connections"])

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

# API root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Reportzy Analytics API", 
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Direct execution
if __name__ == "__main__":
    import uvicorn
    print("Starting Reportzy Analytics Backend...")
    print("Backend API will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )
