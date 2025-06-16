# app/models.py

from sqlalchemy import Column, Integer, String, Text, DateTime, func, Boolean, Float, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class QueryLog(Base):
    __tablename__ = "query_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text)
    sql_query = Column(Text)
    result_json = Column(JSON)
    success = Column(Boolean, default=True)
    table_name = Column(String(255))  # Which table was queried
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

class UploadedDatasets(Base):
    __tablename__ = "uploaded_datasets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # bytes
    row_count = Column(Integer)
    column_count = Column(Integer)
    upload_status = Column(String(50), default='processing')  # 'processing', 'completed', 'failed'
    created_at = Column(DateTime, default=func.current_timestamp())
    
class AIInsights(Base):
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(255), nullable=False)
    insight_type = Column(String(100))  # 'trend', 'anomaly', 'recommendation', 'warning'
    insight_text = Column(Text)
    confidence_score = Column(Float)  # 0.0 to 1.0
    created_at = Column(DateTime, default=func.current_timestamp())

class DeletionLog(Base):
    __tablename__ = "deletion_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False)
    file_name = Column(String(255))
    row_count = Column(Integer)
    column_count = Column(Integer)
    deleted_at = Column(DateTime, default=func.current_timestamp())
    deleted_items = Column(JSON)  # Details about what was deleted

class APIConnections(Base):
    __tablename__ = "api_connections"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    connection_type = Column(String(50), nullable=False)  # 'rest', 'graphql', 'database'
    url = Column(String(500), nullable=False)
    api_key = Column(String(255))
    headers = Column(JSON)  # Additional headers
    auth_config = Column(JSON)  # Authentication configuration
    status = Column(String(50), default='disconnected')  # 'connected', 'disconnected', 'error'
    last_sync = Column(DateTime)
    sync_frequency = Column(Integer)  # minutes
    target_table_name = Column(String(255))  # Table name where data will be stored
    data_mapping = Column(JSON)  # Field mapping configuration
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

class APISyncLog(Base):
    __tablename__ = "api_sync_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    connection_id = Column(Integer, nullable=False)
    sync_status = Column(String(50))  # 'success', 'failed', 'partial'
    records_synced = Column(Integer, default=0)
    error_message = Column(Text)
    sync_duration = Column(Float)  # seconds
    created_at = Column(DateTime, default=func.current_timestamp())