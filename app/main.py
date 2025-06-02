# app/main.py

from fastapi import FastAPI
from app.ingest import ingest_router
from app.ask import ask_router

app = FastAPI(title="Reportzy Analytics API", version="1.0.0")

# Register endpoints
app.include_router(ingest_router)
app.include_router(ask_router)

@app.get("/")
async def root():
    return {"message": "Reportzy Analytics API is running 🚀"}
