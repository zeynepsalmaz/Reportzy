# app/models.py

from sqlalchemy import Column, Integer, String, Text, DateTime, func, Boolean, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class QueryLog(Base):
    __tablename__ = "query_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text)
    sql_query = Column(Text)
    result_json = Column(JSONB)
    created_at = Column(DateTime, default=func.current_timestamp())

class TableMetadata(Base):
    __tablename__ = "table_metadata"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(255), nullable=False)
    column_name = Column(String(255), nullable=False)
    description = Column(Text)
    data_type = Column(String(100))
    is_primary_key = Column(Boolean, default=False)
    is_nullable = Column(Boolean, default=True)
    sample_values = Column(Text)  # JSON string of sample values
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String(255), nullable=False)
    metric_value = Column(Float)
    metric_unit = Column(String(50))
    timestamp = Column(DateTime, default=func.current_timestamp())

class BackupLog(Base):
    __tablename__ = "backup_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    backup_type = Column(String(100), nullable=False)  # 'full', 'incremental', 'table'
    table_name = Column(String(255))  # null for full backups
    file_path = Column(Text)
    file_size = Column(Integer)  # bytes
    status = Column(String(50), default='started')  # 'started', 'completed', 'failed'
    error_message = Column(Text)
    started_at = Column(DateTime, default=func.current_timestamp())
    completed_at = Column(DateTime)