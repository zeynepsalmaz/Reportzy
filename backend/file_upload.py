# app/upload.py - File Upload Management

import os
import io
import pandas as pd
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
import json

from db import engine, get_db
from models import UploadedDatasets, TableMetadata, AIInsights, QueryLog, DeletionLog

upload_router = APIRouter()

ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

def clean_column_name(col_name: str) -> str:
    """Clean column names for database compatibility"""
    # Remove special characters and spaces, convert to lowercase
    cleaned = ''.join(c.lower() if c.isalnum() else '_' for c in str(col_name))
    # Remove consecutive underscores
    while '__' in cleaned:
        cleaned = cleaned.replace('__', '_')
    # Remove leading/trailing underscores
    cleaned = cleaned.strip('_')
    # Ensure it doesn't start with a number
    if cleaned and cleaned[0].isdigit():
        cleaned = 'col_' + cleaned
    return cleaned or 'unnamed_column'

def clean_table_name(name: str) -> str:
    """Clean table name for database compatibility"""
    # Similar to column cleaning but for table names
    cleaned = ''.join(c.lower() if c.isalnum() else '_' for c in str(name))
    while '__' in cleaned:
        cleaned = cleaned.replace('__', '_')
    cleaned = cleaned.strip('_')
    if cleaned and cleaned[0].isdigit():
        cleaned = 'table_' + cleaned
    return cleaned or 'unnamed_table'

@upload_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload and process CSV/Excel files"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    
    try:
        # Read file into pandas DataFrame
        file_obj = io.BytesIO(file_content)
        
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(file_obj)
        elif file.filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_obj)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Basic validation
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")
        
        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="No columns found in file")
        
        # Clean column names
        original_columns = df.columns.tolist()
        cleaned_columns = [clean_column_name(col) for col in original_columns]
        df.columns = cleaned_columns
        
        # Generate unique table name
        base_table_name = clean_table_name(dataset_name)
        table_name = base_table_name
        counter = 1
        
        # Check if table exists and create unique name
        with engine.connect() as conn:
            inspector = inspect(conn)
            while table_name in inspector.get_table_names():
                table_name = f"{base_table_name}_{counter}"
                counter += 1
        
        # Create dataset record
        dataset_record = UploadedDatasets(
            dataset_name=dataset_name,
            table_name=table_name,
            file_name=file.filename,
            file_size=len(file_content),
            row_count=len(df),
            column_count=len(df.columns),
            upload_status='processing'
        )
        db.add(dataset_record)
        db.commit()
        db.refresh(dataset_record)
        
        # Create table in database
        # Convert DataFrame to SQL-compatible format
        df_sql = df.copy()
        
        # Handle data types - convert everything to string for simplicity
        # This ensures compatibility and lets users query without type issues
        for col in df_sql.columns:
            df_sql[col] = df_sql[col].astype(str).replace('nan', None)
        
        # Create table dynamically
        column_definitions = []
        for col in df_sql.columns:
            column_definitions.append(f'"{col}" TEXT')
        
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS "{table_name}" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            {', '.join(column_definitions)}
        )
        """
        
        with engine.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()
            
            # Insert data
            for _, row in df_sql.iterrows():
                columns = [f'"{col}"' for col in df_sql.columns]
                placeholders = [f":{col}" for col in df_sql.columns]
                
                insert_sql = f"""
                INSERT INTO "{table_name}" ({', '.join(columns)}) 
                VALUES ({', '.join(placeholders)})
                """
                
                # Prepare row data
                row_data = {col: row[col] for col in df_sql.columns}
                conn.execute(text(insert_sql), row_data)
            
            conn.commit()
        
        # Create metadata for each column
        for i, col in enumerate(cleaned_columns):
            original_col = original_columns[i]
            
            # Get sample values
            sample_values = df[col].dropna().unique()[:5].tolist()
            
            # Determine data type based on content
            data_type = "TEXT"
            try:
                if df[col].dtype in ['int64', 'float64']:
                    data_type = "NUMERIC"
                elif 'date' in original_col.lower() or 'time' in original_col.lower():
                    data_type = "DATE"
            except:
                pass
            
            metadata = TableMetadata(
                table_name=table_name,
                column_name=col,
                description=f"Column from uploaded file: {original_col}",
                data_type=data_type,
                sample_values=json.dumps([str(v) for v in sample_values])
            )
            db.add(metadata)
        
        # Update dataset status using session merge
        db.merge(UploadedDatasets(
            id=dataset_record.id,
            upload_status='completed'
        ))
        db.commit()
        
        return {
            "success": True,
            "message": f"File uploaded successfully",
            "dataset_id": dataset_record.id,
            "table_name": table_name,
            "rows_processed": len(df),
            "columns_processed": len(df.columns),
            "columns": [{"original": orig, "cleaned": clean} for orig, clean in zip(original_columns, cleaned_columns)]
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="File is empty or corrupted")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    except Exception as e:
        # Update dataset status to failed if it was created
        try:
            if 'dataset_record' in locals():
                db.merge(UploadedDatasets(
                    id=dataset_record.id,
                    upload_status='failed'
                ))
                db.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@upload_router.get("/datasets")
async def get_datasets(db: Session = Depends(get_db)):
    """Get list of uploaded datasets"""
    try:
        datasets = db.query(UploadedDatasets).order_by(UploadedDatasets.created_at.desc()).all()
        
        result = []
        for dataset in datasets:
            result.append({
                "id": dataset.id,
                "dataset_name": dataset.dataset_name,
                "table_name": dataset.table_name,
                "file_name": dataset.file_name,
                "file_size": dataset.file_size,
                "row_count": dataset.row_count,
                "column_count": dataset.column_count,
                "upload_status": dataset.upload_status,
                "created_at": dataset.created_at.isoformat() if dataset.created_at is not None else None
            })
        
        return {"success": True, "datasets": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching datasets: {str(e)}")

@upload_router.get("/dataset/{dataset_id}/preview")
async def preview_dataset(dataset_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Preview dataset data"""
    try:
        # Get dataset info
        dataset = db.query(UploadedDatasets).filter(UploadedDatasets.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get sample data
        with engine.connect() as conn:
            preview_sql = f'SELECT * FROM "{dataset.table_name}" LIMIT {limit}'
            result = conn.execute(text(preview_sql))
            columns = list(result.keys())
            rows = result.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    row_dict[col] = row[i]
                data.append(row_dict)
        
        return {
            "success": True,
            "dataset_info": {
                "id": dataset.id,
                "name": dataset.dataset_name,
                "table_name": dataset.table_name,
                "row_count": dataset.row_count,
                "column_count": dataset.column_count
            },
            "columns": columns,
            "preview_data": data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing dataset: {str(e)}")

@upload_router.delete("/dataset/{dataset_id}")
async def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Delete a dataset and its table"""
    try:
        # Get dataset info
        dataset = db.query(UploadedDatasets).filter(UploadedDatasets.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_name = dataset.dataset_name
        table_name = dataset.table_name
        
        # Drop the table safely
        try:
            with engine.connect() as conn:
                drop_sql = f'DROP TABLE IF EXISTS "{table_name}"'
                conn.execute(text(drop_sql))
                conn.commit()
        except Exception as e:
            print(f"Warning: Could not drop table {table_name}: {e}")
        
        # Delete all related data in transaction
        try:
            # 1. Delete AI insights
            insights_deleted = db.query(AIInsights).filter(AIInsights.table_name == table_name).delete()
            
            # 2. Delete query logs  
            queries_deleted = db.query(QueryLog).filter(QueryLog.table_name == table_name).delete()
            
            # 3. Delete metadata
            metadata_deleted = db.query(TableMetadata).filter(TableMetadata.table_name == table_name).delete()
            
            # 4. Log the deletion
            deletion_log = DeletionLog(
                dataset_name=dataset_name,
                table_name=table_name,
                file_name=dataset.file_name,
                row_count=dataset.row_count,
                column_count=dataset.column_count,
                deleted_items={
                    "insights_deleted": insights_deleted,
                    "queries_deleted": queries_deleted,
                    "metadata_deleted": metadata_deleted
                }
            )
            db.add(deletion_log)
            
            # 5. Delete dataset record
            db.delete(dataset)
            db.commit()
            
            return {
                "success": True, 
                "message": f"Dataset '{dataset_name}' deleted successfully",
                "deleted_items": {
                    "table": table_name,
                    "insights": insights_deleted,
                    "queries": queries_deleted,
                    "metadata": metadata_deleted
                }
            }
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error deleting related data: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting dataset: {str(e)}")

@upload_router.get("/deletion-logs")
async def get_deletion_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Get deletion logs"""
    try:
        logs = db.query(DeletionLog).order_by(DeletionLog.deleted_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "deletion_logs": [
                {
                    "id": log.id,
                    "dataset_name": log.dataset_name,
                    "table_name": log.table_name,
                    "file_name": log.file_name,
                    "row_count": log.row_count,
                    "column_count": log.column_count,
                    "deleted_at": log.deleted_at.isoformat(),
                    "deleted_items": log.deleted_items
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deletion logs: {str(e)}")

@upload_router.get("/deleted-datasets")
async def get_deleted_datasets(limit: int = 50, db: Session = Depends(get_db)):
    """Get deleted datasets (alias for deletion-logs)"""
    try:
        logs = db.query(DeletionLog).order_by(DeletionLog.deleted_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "deleted_datasets": [
                {
                    "id": log.id,
                    "dataset_name": log.dataset_name,
                    "table_name": log.table_name,
                    "file_name": log.file_name,
                    "row_count": log.row_count,
                    "column_count": log.column_count,
                    "deleted_at": log.deleted_at.isoformat() if log.deleted_at is not None else None,
                    "deleted_items": log.deleted_items
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deleted datasets: {str(e)}")

@upload_router.post("/api-integration")
async def create_api_integration(
    name: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db)
):
    """Create placeholder for API integration"""
    # This is a placeholder for future API integration functionality
    # Users can set up automated data fetching from external APIs
    
    return {
        "success": True,
        "message": "API integration endpoint created (placeholder)",
        "integration_name": name,
        "description": description,
        "note": "This feature will be implemented to automatically fetch data from external APIs"
    }
