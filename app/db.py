# app/db.py

import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost:5432/reportzy")

engine = create_engine(DATABASE_URL)
