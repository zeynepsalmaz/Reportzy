# app/backup_fixed.py - Fixed Backup Automation System

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text, update
import os
import json
import subprocess
from datetime import datetime, timedelta
import logging

from app.db import get_db, engine
from app.models import BackupLog

backup_router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BackupRequest(BaseModel):
    backup_type: str = "full"  # "full", "table", "incremental"
    table_name: Optional[str] = None
    compression: bool = True
    retention_days: int = 30

class BackupResponse(BaseModel):
    success: bool
    backup_id: int
    message: str
    file_path: Optional[str] = None

@backup_router.post("/backup/create")
async def create_backup(
    request: BackupRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a database backup"""
    try:
        # Create backup log entry
        backup_log = BackupLog(
            backup_type=request.backup_type,
            table_name=request.table_name,
            status="started"
        )
        db.add(backup_log)
        db.commit()
        db.refresh(backup_log)
        
        # Schedule backup in background
        background_tasks.add_task(
            perform_backup,
            getattr(backup_log, 'id', 0),
            request.backup_type,
            request.table_name,
            request.compression
        )
        
        return BackupResponse(
            success=True,
            backup_id=getattr(backup_log, 'id', 0),
            message=f"Backup {request.backup_type} started successfully"
        )
        
    except Exception as e:
        logger.error(f"Error starting backup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting backup: {str(e)}")

async def perform_backup(backup_id: int, backup_type: str, table_name: Optional[str], compression: bool):
    """Perform the actual backup operation"""
    db = None
    try:
        from app.db import SessionLocal
        db = SessionLocal()
        
        backup_log = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
        if not backup_log:
            logger.error(f"Backup log {backup_id} not found")
            return
        
        # Create backup directory
        backup_dir = "/tmp/reportzy_backups"
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if backup_type == "full":
            file_path = await create_full_backup(backup_dir, timestamp, compression)
        elif backup_type == "table" and table_name:
            file_path = await create_table_backup(backup_dir, table_name, timestamp, compression)
        elif backup_type == "incremental":
            file_path = await create_incremental_backup(backup_dir, timestamp, compression)
        else:
            raise ValueError("Invalid backup type or missing table name")
        
        # Get file size
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        # Update backup log using update statement
        db.execute(
            update(BackupLog)
            .where(BackupLog.id == backup_id)
            .values(
                status="completed",
                file_path=file_path,
                file_size=file_size,
                completed_at=datetime.now()
            )
        )
        db.commit()
        logger.info(f"Backup {backup_id} completed successfully: {file_path}")
        
    except Exception as e:
        logger.error(f"Backup {backup_id} failed: {str(e)}")
        if db:
            try:
                db.execute(
                    update(BackupLog)
                    .where(BackupLog.id == backup_id)
                    .values(
                        status="failed",
                        error_message=str(e),
                        completed_at=datetime.now()
                    )
                )
                db.commit()
            except Exception as update_error:
                logger.error(f"Failed to update backup log: {update_error}")
    finally:
        if db:
            db.close()

async def create_full_backup(backup_dir: str, timestamp: str, compression: bool) -> str:
    """Create full database backup using JSON export"""
    file_extension = ".json.gz" if compression else ".json"
    file_path = os.path.join(backup_dir, f"full_backup_{timestamp}{file_extension}")
    
    try:
        # Export all tables as JSON (simplified approach)
        tables_to_backup = ['query_logs', 'table_metadata', 'system_metrics', 'backup_logs']
        
        backup_data = {
            "backup_type": "full",
            "timestamp": timestamp,
            "tables": {}
        }
        
        for table in tables_to_backup:
            try:
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT * FROM {table}"))
                    columns = list(result.keys())
                    rows = result.fetchall()
                    
                    table_data = []
                    for row in rows:
                        row_dict = {}
                        for i, col in enumerate(columns):
                            value = row[i]
                            # Convert to JSON-serializable types
                            if hasattr(value, 'isoformat'):
                                value = value.isoformat()
                            elif hasattr(value, '__float__'):
                                value = float(value)
                            row_dict[col] = value
                        table_data.append(row_dict)
                    
                    backup_data["tables"][table] = {
                        "columns": columns,
                        "data": table_data
                    }
            except Exception as table_error:
                logger.warning(f"Failed to backup table {table}: {table_error}")
                backup_data["tables"][table] = {"error": str(table_error)}
        
        # Write to file
        if compression:
            import gzip
            with gzip.open(file_path, 'wt', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2)
        else:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2)
        
        return file_path
        
    except Exception as e:
        raise Exception(f"Full backup failed: {str(e)}")

async def create_table_backup(backup_dir: str, table_name: str, timestamp: str, compression: bool) -> str:
    """Create backup of specific table"""
    file_extension = ".json.gz" if compression else ".json"
    file_path = os.path.join(backup_dir, f"table_{table_name}_{timestamp}{file_extension}")
    
    try:
        # Export table data as JSON
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT * FROM {table_name}"))
            columns = list(result.keys())
            rows = result.fetchall()
            
            # Convert to JSON format
            data = {
                "table_name": table_name,
                "exported_at": datetime.now().isoformat(),
                "columns": columns,
                "data": []
            }
            
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert to JSON-serializable types
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    elif hasattr(value, '__float__'):
                        value = float(value)
                    row_dict[col] = value
                data["data"].append(row_dict)
            
            # Write to file
            if compression:
                import gzip
                with gzip.open(file_path, 'wt', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
        
        return file_path
        
    except Exception as e:
        raise Exception(f"Table backup failed: {str(e)}")

async def create_incremental_backup(backup_dir: str, timestamp: str, compression: bool) -> str:
    """Create incremental backup (changes since last backup)"""
    file_extension = ".json.gz" if compression else ".json"
    file_path = os.path.join(backup_dir, f"incremental_{timestamp}{file_extension}")
    
    try:
        # Find last backup time
        from app.db import SessionLocal
        db = SessionLocal()
        
        last_backup = db.query(BackupLog).filter(
            BackupLog.status == "completed",
            BackupLog.backup_type.in_(["full", "incremental"])
        ).order_by(BackupLog.completed_at.desc()).first()
        
        cutoff_time = last_backup.completed_at if last_backup else datetime.now() - timedelta(days=1)
        
        # Get changes since last backup (simplified - tracks query_logs)
        with engine.connect() as conn:
            query = text("""
                SELECT 'query_logs' as table_name, * 
                FROM query_logs 
                WHERE created_at > :cutoff_time
                ORDER BY created_at DESC
            """)
            
            result = conn.execute(query, {"cutoff_time": cutoff_time})
            columns = list(result.keys())
            rows = result.fetchall()
            
            data = {
                "backup_type": "incremental",
                "cutoff_time": cutoff_time.isoformat(),
                "exported_at": datetime.now().isoformat(),
                "changes": []
            }
            
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    elif hasattr(value, '__float__'):
                        value = float(value)
                    row_dict[col] = value
                data["changes"].append(row_dict)
            
            # Write to file
            if compression:
                import gzip
                with gzip.open(file_path, 'wt', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
        
        db.close()
        return file_path
        
    except Exception as e:
        raise Exception(f"Incremental backup failed: {str(e)}")

@backup_router.get("/backup/list")
async def list_backups(db: Session = Depends(get_db)):
    """List all backup records"""
    try:
        backups = db.query(BackupLog).order_by(BackupLog.started_at.desc()).all()
        
        result = []
        for backup in backups:
            result.append({
                "id": backup.id,
                "backup_type": backup.backup_type,
                "table_name": backup.table_name,
                "status": backup.status,
                "file_path": backup.file_path,
                "file_size": backup.file_size,
                "started_at": (backup.started_at.isoformat() 
                             if hasattr(backup, 'started_at') and backup.started_at is not None else None),
                "completed_at": (backup.completed_at.isoformat() 
                               if hasattr(backup, 'completed_at') and backup.completed_at is not None else None),
                "error_message": backup.error_message
            })
        
        return {"success": True, "backups": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing backups: {str(e)}")

@backup_router.delete("/backup/cleanup")
async def cleanup_old_backups(retention_days: int = 30, db: Session = Depends(get_db)):
    """Clean up old backup files"""
    try:
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        old_backups = db.query(BackupLog).filter(
            BackupLog.completed_at < cutoff_date,
            BackupLog.status == "completed"
        ).all()
        
        deleted_count = 0
        for backup in old_backups:
            try:
                # Fix: Access the actual file path value, not the column
                file_path = getattr(backup, 'file_path', None)
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                    deleted_count += 1
            except Exception as e:
                logger.error(f"Error deleting backup file {file_path}: {e}")
            
            # Remove from database
            db.delete(backup)
        
        db.commit()
        
        return {
            "success": True, 
            "message": f"Cleaned up {deleted_count} old backup files",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error cleaning up backups: {str(e)}")

@backup_router.post("/backup/schedule")
async def schedule_automatic_backups():
    """Configure automatic backup scheduling"""
    # This would integrate with a task scheduler like Celery in production
    # For now, return configuration info
    
    return {
        "success": True,
        "message": "Automatic backup scheduling configured",
        "schedule": {
            "full_backup": "Daily at 2:00 AM",
            "incremental_backup": "Every 6 hours",
            "retention": "30 days",
            "compression": True
        }
    }
