#!/bin/bash
#
# Reportzy Analytics - Development Server Startup Script
# This script starts both the frontend and backend development servers
#

echo "🚀 Starting Reportzy Analytics Development Environment..."
echo ""

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the Reportzy project root directory"
    exit 1
fi

echo "📦 Installing backend dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

echo "📦 Installing frontend dependencies..."
cd frontend
npm install > /dev/null 2>&1
cd ..

echo ""
echo "🖥️  Starting Backend Server..."
echo "   → API: http://localhost:8000"
echo "   → Docs: http://localhost:8000/docs"
echo ""

# Start backend in background
python run_backend.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

echo "🌐 Starting Frontend Server..."
echo "   → Frontend: http://localhost:3000 (or next available port)"
echo ""

# Start frontend
cd frontend
npm run dev

# Clean up backend when frontend stops
echo ""
echo "🛑 Shutting down services..."
kill $BACKEND_PID 2>/dev/null
echo "✅ Services stopped"
