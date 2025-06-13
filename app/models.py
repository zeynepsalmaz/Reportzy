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