#!/usr/bin/env python3
"""
Backend startup script for Reportzy Analytics
"""

import sys
import os
import uvicorn

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Import the FastAPI app
from backend.main import app

if __name__ == "__main__":
    print("Starting Reportzy Analytics Backend...")
    print("Backend API will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )
