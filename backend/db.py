# app/db.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Use SQLite database in the project root
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./reportzy.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
