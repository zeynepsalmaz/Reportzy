# app/ingest.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from sqlalchemy import text
from app.db import engine

ingest_router = APIRouter()

class IngestRequest(BaseModel):
    table_name: str
    records: List[Dict[str, Any]]

@ingest_router.post("/ingest")
async def ingest_data(request: IngestRequest):
    try:
        table_name = request.table_name
        records = request.records

        if not records:
            raise ValueError("No records provided.")

        # Dynamically create table
        columns = records[0].keys()
        column_defs = ", ".join([f"{col} TEXT" for col in columns])

        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {column_defs}
        )
        """
        with engine.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()

        # Insert records
        with engine.connect() as conn:
            for record in records:
                cols = ", ".join(record.keys())
                placeholders = ", ".join([f":{col}" for col in record.keys()])
                insert_sql = f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})"
                conn.execute(text(insert_sql), record)
            conn.commit()

        return {"success": True, "table": table_name, "rows_inserted": len(records)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
