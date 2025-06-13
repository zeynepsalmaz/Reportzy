#!/bin/bash

echo "🚀 Starting Reportzy Analytics API"
echo "=================================="

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set default port
PORT=${PORT:-8001}

echo "Starting server on port $PORT..."
echo "Dashboard: http://localhost:$PORT/dashboard"
echo "API Docs: http://localhost:$PORT/docs"
echo ""

# Start the application
uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload
