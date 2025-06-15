# app/metadata.py - Metadata Management

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session
import json

from .db import engine, get_db
from .models import TableMetadata

metadata_router = APIRouter()

class MetadataRequest(BaseModel):
    table_name: str
    column_name: str
    description: str
    data_type: Optional[str] = None
    is_primary_key: Optional[bool] = False
    is_nullable: Optional[bool] = True
    sample_values: Optional[List[str]] = None

class MetadataResponse(BaseModel):
    id: int
    table_name: str
    column_name: str
    description: str
    data_type: Optional[str]
    is_primary_key: bool
    is_nullable: bool
    sample_values: Optional[List[str]]

@metadata_router.post("/metadata")
async def add_metadata(request: MetadataRequest, db: Session = Depends(get_db)):
    """Add or update column metadata"""
    try:
        # Check if metadata already exists
        existing = db.query(TableMetadata).filter(
            TableMetadata.table_name == request.table_name,
            TableMetadata.column_name == request.column_name
        ).first()
        
        if existing:
            # Fixed: Use proper SQLAlchemy update operation
            from sqlalchemy import update
            
            update_values = {
                "description": request.description,
                "data_type": request.data_type,
                "is_primary_key": request.is_primary_key,
                "is_nullable": request.is_nullable
            }
            
            if request.sample_values:
                update_values["sample_values"] = json.dumps(request.sample_values)
            
            stmt = update(TableMetadata).where(
                TableMetadata.id == existing.id
            ).values(**update_values)
            
            db.execute(stmt)
        else:
            # Create new metadata
            metadata = TableMetadata(
                table_name=request.table_name,
                column_name=request.column_name,
                description=request.description,
                data_type=request.data_type,
                is_primary_key=request.is_primary_key,
                is_nullable=request.is_nullable,
                sample_values=json.dumps(request.sample_values) if request.sample_values else None
            )
            db.add(metadata)
        
        db.commit()
        
        return {"success": True, "message": "Metadata updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating metadata: {str(e)}")

@metadata_router.get("/metadata/{table_name}")
async def get_table_metadata(table_name: str, db: Session = Depends(get_db)):
    """Get metadata for a specific table"""
    try:
        metadata_records = db.query(TableMetadata).filter(
            TableMetadata.table_name == table_name
        ).all()
        
        result = []
        for record in metadata_records:
            sample_values = None
            # Fixed: Check the actual value instead of the column
            sample_values_str = getattr(record, 'sample_values', None)
            if sample_values_str:
                try:
                    sample_values = json.loads(sample_values_str)
                except:
                    sample_values = None
            
            result.append({
                "id": record.id,
                "table_name": record.table_name,
                "column_name": record.column_name,
                "description": record.description,
                "data_type": record.data_type,
                "is_primary_key": record.is_primary_key,
                "is_nullable": record.is_nullable,
                "sample_values": sample_values
            })
        
        return {"success": True, "metadata": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metadata: {str(e)}")

@metadata_router.get("/metadata")
async def get_all_metadata(db: Session = Depends(get_db)):
    """Get metadata for all tables"""
    try:
        metadata_records = db.query(TableMetadata).all()
        
        # Group by table
        tables = {}
        for record in metadata_records:
            if record.table_name not in tables:
                tables[record.table_name] = []
            
            sample_values = None
            sample_values_str = getattr(record, 'sample_values', None)
            if sample_values_str is not None:
                try:
                    sample_values = json.loads(sample_values_str)
                except:
                    sample_values = None
            
            tables[record.table_name].append({
                "column_name": record.column_name,
                "description": record.description,
                "data_type": record.data_type,
                "is_primary_key": record.is_primary_key,
                "is_nullable": record.is_nullable,
                "sample_values": sample_values
            })
        
        return {"success": True, "tables": tables}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metadata: {str(e)}")

@metadata_router.post("/metadata/auto-discover/{table_name}")
async def auto_discover_metadata(table_name: str, db: Session = Depends(get_db)):
    """Auto-discover and create metadata for a table"""
    try:
        # Get table schema information
        with engine.connect() as conn:
            schema_query = text("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = :table_name 
                AND table_schema = 'public'
                ORDER BY ordinal_position
            """)
            
            schema_result = conn.execute(schema_query, {"table_name": table_name})
            columns = schema_result.fetchall()
            
            if not columns:
                raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
            
            # Get sample data
            sample_query = text(f"SELECT * FROM {table_name} LIMIT 5")
            sample_result = conn.execute(sample_query)
            sample_rows = sample_result.fetchall()
            sample_columns = sample_result.keys()
            
            # Create metadata for each column
            for col_info in columns:
                column_name = col_info[0]
                data_type = col_info[1]
                is_nullable = col_info[2] == 'YES'
                
                # Get sample values for this column
                sample_values = []
                for row in sample_rows:
                    if column_name in sample_columns:
                        col_index = list(sample_columns).index(column_name)
                        value = row[col_index]
                        if value is not None and str(value) not in sample_values:
                            sample_values.append(str(value))
                
                # Check if metadata already exists
                existing = db.query(TableMetadata).filter(
                    TableMetadata.table_name == table_name,
                    TableMetadata.column_name == column_name
                ).first()
                
                if not existing:
                    # Generate description based on column name and data type
                    description = generate_column_description(column_name, data_type)
                    
                    metadata = TableMetadata(
                        table_name=table_name,
                        column_name=column_name,
                        description=description,
                        data_type=data_type,
                        is_nullable=is_nullable,
                        sample_values=json.dumps(sample_values[:5]) if sample_values else None
                    )
                    db.add(metadata)
            
            db.commit()
            
            return {"success": True, "message": f"Auto-discovered metadata for table '{table_name}'"}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error auto-discovering metadata: {str(e)}")

def generate_column_description(column_name: str, data_type: str) -> str:
    """Generate intelligent description for column based on name and type"""
    
    name_lower = column_name.lower()
    
    # Common patterns
    if 'id' in name_lower and name_lower.endswith('id'):
        return f"Unique identifier for {name_lower.replace('_id', '').replace('id', '')}"
    elif name_lower == 'id':
        return "Primary key identifier"
    elif 'name' in name_lower:
        return f"Name or title of the {name_lower.replace('_name', '').replace('name', '')}"
    elif 'email' in name_lower:
        return "Email address"
    elif 'phone' in name_lower:
        return "Phone number"
    elif 'date' in name_lower:
        return f"Date when {name_lower.replace('_date', '').replace('date', '')} occurred"
    elif 'time' in name_lower:
        return f"Timestamp for {name_lower.replace('_time', '').replace('time', '')}"
    elif 'amount' in name_lower or 'price' in name_lower or 'cost' in name_lower:
        return "Monetary value"
    elif 'count' in name_lower or 'total' in name_lower:
        return "Numeric count or total"
    elif 'status' in name_lower:
        return "Current status or state"
    elif 'type' in name_lower or 'category' in name_lower:
        return "Classification or type"
    elif 'url' in name_lower or 'link' in name_lower:
        return "Web URL or link"
    elif 'address' in name_lower:
        return "Physical or mailing address"
    elif 'description' in name_lower:
        return "Detailed description or notes"
    else:
        return f"{column_name.replace('_', ' ').title()} ({data_type})"
