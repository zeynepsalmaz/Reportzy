from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, update
import requests
import json
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

from db import get_db, engine
from models import APIConnections, APISyncLog
import pandas as pd

router = APIRouter()

class APIConnectionCreate(BaseModel):
    name: str
    connection_type: str  # 'rest', 'graphql', 'database'
    url: str
    api_key: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    auth_config: Optional[Dict[str, Any]] = None
    target_table_name: Optional[str] = None
    data_mapping: Optional[Dict[str, Any]] = None

class APIConnectionUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    api_key: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    auth_config: Optional[Dict[str, Any]] = None
    target_table_name: Optional[str] = None
    data_mapping: Optional[Dict[str, Any]] = None

@router.get("/api-connections")
async def get_api_connections(db: Session = Depends(get_db)):
    """Get all API connections"""
    try:
        connections = db.query(APIConnections).all()
        return {
            "success": True,
            "connections": [
                {
                    "id": conn.id,
                    "name": conn.name,
                    "type": conn.connection_type,
                    "url": conn.url,
                    "status": conn.status,
                    "last_sync": conn.last_sync.isoformat() if conn.last_sync is not None else None,
                    "target_table_name": conn.target_table_name,
                    "created_at": conn.created_at.isoformat() if conn.created_at is not None else None
                }
                for conn in connections
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching API connections: {str(e)}")

@router.post("/api-connections")
async def create_api_connection(connection: APIConnectionCreate, db: Session = Depends(get_db)):
    """Create a new API connection"""
    try:
        # Generate table name if not provided
        table_name = connection.target_table_name or f"api_{connection.name.lower().replace(' ', '_').replace('-', '_')}"
        
        db_connection = APIConnections(
            name=connection.name,
            connection_type=connection.connection_type,
            url=connection.url,
            api_key=connection.api_key,
            headers=connection.headers,
            auth_config=connection.auth_config,
            target_table_name=table_name,
            data_mapping=connection.data_mapping
        )
        
        db.add(db_connection)
        db.commit()
        db.refresh(db_connection)
        
        return {
            "success": True,
            "connection_id": db_connection.id,
            "message": f"API connection '{connection.name}' created successfully",
            "target_table_name": table_name
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating API connection: {str(e)}")

@router.post("/api-connections/{connection_id}/test")
async def test_api_connection(connection_id: int, db: Session = Depends(get_db)):
    """Test an API connection"""
    try:
        connection = db.query(APIConnections).filter(APIConnections.id == connection_id).first()
        if not connection:
            raise HTTPException(status_code=404, detail="API connection not found")
        
        # Test the connection based on type
        if str(connection.connection_type) == 'rest':
            headers = {}
            if connection.headers is not None:
                # Safely convert headers to dict
                if isinstance(connection.headers, dict):
                    headers.update(connection.headers)
            if connection.api_key is not None:
                headers['Authorization'] = f"Bearer {connection.api_key}"
            
            response = requests.get(str(connection.url), headers=headers, timeout=10)
            if response.status_code == 200:
                # Update connection status using SQLAlchemy update
                db.execute(
                    update(APIConnections)
                    .where(APIConnections.id == connection_id)
                    .values(status='connected', last_sync=datetime.now())
                )
                db.commit()
                
                return {
                    "success": True,
                    "status": "connected",
                    "message": "Connection successful"
                }
            else:
                # Update connection status to error
                db.execute(
                    update(APIConnections)
                    .where(APIConnections.id == connection_id)
                    .values(status='error')
                )
                db.commit()
                return {
                    "success": False,
                    "status": "error",
                    "message": f"Connection failed: HTTP {response.status_code}"
                }
        else:
            # For now, we'll focus on REST APIs
            return {
                "success": False,
                "message": f"Testing for {connection.connection_type} connections not yet implemented"
            }
            
    except requests.RequestException as e:
        # Update connection status to error
        db.execute(
            update(APIConnections)
            .where(APIConnections.id == connection_id)
            .values(status='error')
        )
        db.commit()
        return {
            "success": False,
            "status": "error",
            "message": f"Connection failed: {str(e)}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing connection: {str(e)}")

@router.post("/api-connections/{connection_id}/sync")
async def sync_api_data(connection_id: int, db: Session = Depends(get_db)):
    """Sync data from API to database table"""
    try:
        connection = db.query(APIConnections).filter(APIConnections.id == connection_id).first()
        if not connection:
            raise HTTPException(status_code=404, detail="API connection not found")
        
        if str(connection.connection_type) != 'rest':
            raise HTTPException(status_code=400, detail="Only REST API sync is currently supported")
        
        # Create sync log entry
        sync_log = APISyncLog(
            connection_id=connection_id,
            sync_status='in_progress'
        )
        db.add(sync_log)
        db.commit()
        db.refresh(sync_log)
        
        start_time = datetime.now()
        
        try:
            # Fetch data from API
            headers = {}
            if connection.headers is not None:
                # Safely convert headers to dict
                if isinstance(connection.headers, dict):
                    headers.update(connection.headers)
            if connection.api_key is not None:
                headers['Authorization'] = f"Bearer {connection.api_key}"
            
            response = requests.get(str(connection.url), headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different data structures
            if isinstance(data, dict):
                # Look for common array keys
                for key in ['data', 'results', 'items', 'records']:
                    if key in data and isinstance(data[key], list):
                        data = data[key]
                        break
                else:
                    # If no array found, wrap the dict in a list
                    if not isinstance(data, list):
                        data = [data]
            
            if not isinstance(data, list) or len(data) == 0:
                raise ValueError("No data found or data is not in expected format")
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Clean column names (remove special characters, spaces)
            df.columns = [
                col.lower().replace(' ', '_').replace('-', '_').replace('.', '_')
                for col in df.columns
            ]
            
            # Save to database table
            table_name = str(connection.target_table_name)
            df.to_sql(table_name, engine, if_exists='replace', index=False)
            
            # Update connection status
            db.execute(
                update(APIConnections)
                .where(APIConnections.id == connection_id)
                .values(status='connected', last_sync=datetime.now())
            )
            
            # Update sync log
            sync_duration = (datetime.now() - start_time).total_seconds()
            db.execute(
                update(APISyncLog)
                .where(APISyncLog.id == sync_log.id)
                .values(
                    sync_status='success',
                    records_synced=len(df),
                    sync_duration=sync_duration
                )
            )
            
            db.commit()
            
            return {
                "success": True,
                "message": f"Successfully synced {len(df)} records to table '{table_name}'",
                "records_synced": len(df),
                "table_name": table_name,
                "columns": list(df.columns)
            }
            
        except Exception as sync_error:
            # Update sync log with error
            sync_duration = (datetime.now() - start_time).total_seconds()
            db.execute(
                update(APISyncLog)
                .where(APISyncLog.id == sync_log.id)
                .values(
                    sync_status='failed',
                    error_message=str(sync_error),
                    sync_duration=sync_duration
                )
            )
            
            # Update connection status to error
            db.execute(
                update(APIConnections)
                .where(APIConnections.id == connection_id)
                .values(status='error')
            )
            db.commit()
            
            raise sync_error
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing data: {str(e)}")

@router.delete("/api-connections/{connection_id}")
async def delete_api_connection(connection_id: int, db: Session = Depends(get_db)):
    """Delete an API connection"""
    try:
        connection = db.query(APIConnections).filter(APIConnections.id == connection_id).first()
        if not connection:
            raise HTTPException(status_code=404, detail="API connection not found")
        
        connection_name = str(connection.name)
        table_name = str(connection.target_table_name)
        
        # Optionally drop the table (be careful with this!)
        # with engine.connect() as conn:
        #     conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
        
        db.delete(connection)
        db.commit()
        
        return {
            "success": True,
            "message": f"API connection '{connection_name}' deleted successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting API connection: {str(e)}")

@router.get("/api-connections/{connection_id}/sync-logs")
async def get_sync_logs(connection_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get sync logs for an API connection"""
    try:
        logs = db.query(APISyncLog).filter(
            APISyncLog.connection_id == connection_id
        ).order_by(APISyncLog.created_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "logs": [
                {
                    "id": log.id,
                    "sync_status": log.sync_status,
                    "records_synced": log.records_synced,
                    "error_message": log.error_message,
                    "sync_duration": log.sync_duration,
                    "created_at": log.created_at.isoformat() if log.created_at is not None else None
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sync logs: {str(e)}")
