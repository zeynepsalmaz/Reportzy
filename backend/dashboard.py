# backend/dashboard.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from db import engine
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json

dashboard_router = APIRouter()

class DashboardStats(BaseModel):
    total_records: int = 0
    total_tables: int = 0
    queries_today: int = 0
    ai_insights: int = 0
    sample_table: Optional[str] = None
    sample_table_rows: int = 0

class AnalyticsSummaryResponse(BaseModel):
    success: bool
    summary: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

@dashboard_router.get("/analytics-summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary():
    """Get dashboard analytics summary"""
    try:
        with engine.connect() as conn:
            # Get available tables
            tables_result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """))
            available_tables = [row[0] for row in tables_result.fetchall()]
            
            # Get total records from all tables
            total_records = 0
            sample_table = None
            sample_table_rows = 0
            
            for table in available_tables:
                try:
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count_row = count_result.fetchone()
                    table_count = count_row[0] if count_row else 0
                    total_records += table_count
                    
                    # Use first non-empty table as sample
                    if table_count > 0 and sample_table is None:
                        sample_table = table
                        sample_table_rows = table_count
                except Exception:
                    continue
            
            # Mock data for queries_today and ai_insights (you can implement proper tracking)
            stats = DashboardStats(
                total_records=total_records,
                total_tables=len(available_tables),
                queries_today=0,  # Implement query tracking
                ai_insights=0,    # Implement insights tracking
                sample_table=sample_table,
                sample_table_rows=sample_table_rows
            )
            
            # Suggested queries
            suggested_queries = [
                "Show me the structure of my data",
                "What are the top 10 records?",
                "Show me summary statistics",
                "What are the unique values in each column?",
                "Show me data trends over time",
                "Find any missing or null values"
            ]
            
            return AnalyticsSummaryResponse(
                success=True,
                summary={
                    "available_tables": available_tables,
                    "suggested_queries": suggested_queries,
                    "data_stats": stats.dict()
                }
            )
            
    except Exception as e:
        return AnalyticsSummaryResponse(
            success=False,
            message=f"Error getting analytics summary: {str(e)}"
        )

@dashboard_router.get("/dashboard-stats")
async def get_dashboard_stats():
    """Get simplified dashboard stats for UI"""
    try:
        summary_response = await get_analytics_summary()
        if summary_response.success and summary_response.summary:
            data_stats = summary_response.summary.get("data_stats", {})
            return {
                "totalRecords": data_stats.get("total_records", 0),
                "activeTables": data_stats.get("total_tables", 0),
                "queriesToday": data_stats.get("queries_today", 0),
                "aiInsights": data_stats.get("ai_insights", 0)
            }
        else:
            return {
                "totalRecords": 0,
                "activeTables": 0,
                "queriesToday": 0,
                "aiInsights": 0
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
