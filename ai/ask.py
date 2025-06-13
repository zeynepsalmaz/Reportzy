# app/ask_enhanced.py - Enhanced Analytics Endpoint with Better NLP

import json
import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from backend.db import engine, get_db
from backend.models import QueryLog

ask_router = APIRouter()

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    question: str
    sql_query: str
    results: List[Dict[str, Any]]
    chart_data: Dict[str, Any]
    success: bool
    error_message: str = ""
    suggestion: str = ""

def get_llm():
    """Initialize Google Gemini LLM"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment")
    os.environ["GOOGLE_API_KEY"] = api_key
    return ChatGoogleGenerativeAI(model="gemini-pro", temperature=0)

def generate_sql_query(question: str) -> str:
    """Generate SQL query using enhanced pattern matching with LLM fallback"""
    
    question_lower = question.lower().strip()
    
    # Handle direct SQL queries
    if question_lower.startswith('select'):
        return question.strip()
    
    # Get available tables dynamically
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                AND table_name NOT IN ('query_logs', 'table_metadata')
            """))
            available_tables = [row[0] for row in result.fetchall()]
    except:
        available_tables = []
    
    if not available_tables:
        return "SELECT 'No data tables found. Please upload a CSV or Excel file first.' as message"
    
    # Use the first available table as default (most recently uploaded)
    default_table = available_tables[0] if available_tables else 'data'
    
    # Enhanced pattern matching for analytics queries
    patterns = {
        # General Analytics
        'total_sum': ['total', 'sum of', 'sum', 'overall'],
        'count_records': ['how many', 'count', 'number of records', 'total records'],
        'show_all': ['show all', 'display all', 'list all', 'show me all'],
        'top_values': ['top', 'highest', 'largest', 'biggest', 'maximum'],
        'bottom_values': ['bottom', 'lowest', 'smallest', 'minimum'],
        'average': ['average', 'avg', 'mean'],
        'unique_values': ['unique', 'distinct', 'different'],
        'group_by': ['by', 'per', 'each', 'breakdown'],
    }
    
    # Try LLM for complex queries with dynamic table info
    try:
        llm = get_llm()
        
        # Get table schemas
        table_schemas = ""
        try:
            with engine.connect() as conn:
                for table in available_tables:
                    schema_result = conn.execute(text("""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = :table_name AND table_schema = 'public'
                        ORDER BY ordinal_position
                    """), {"table_name": table})
                    
                    columns = [f"{row[0]} ({row[1]})" for row in schema_result.fetchall()]
                    table_schemas += f"- {table}: {', '.join(columns)}\n"
        except:
            table_schemas = f"- {default_table}: (columns unknown)\n"
        
        prompt = f"""
        Convert the following natural language question to a SQL query for a PostgreSQL database.
        
        Available tables and schemas:
        {table_schemas}
        
        Guidelines:
        - Use appropriate table names from the list above
        - For numeric calculations, use CAST(column AS DECIMAL) or column::numeric
        - Use proper PostgreSQL syntax
        - Return only the SQL query, no explanation
        - If asking for "all" or general data, limit to 20 rows
        - For aggregations, include meaningful column aliases
        - If table/column names are unclear, use the most likely match
        
        Question: {question}
        
        SQL Query:
        """
        
        response = llm.invoke([HumanMessage(content=prompt)])
        
        # Handle different response types
        if hasattr(response, 'content'):
            sql_query = str(response.content).strip()
        else:
            sql_query = str(response).strip()
        
        # Clean up the response
        if sql_query.startswith('```sql'):
            sql_query = sql_query[6:-3]
        elif sql_query.startswith('```'):
            sql_query = sql_query[3:-3]
        
        return sql_query.strip()
        
    except Exception as e:
        print(f"Error generating SQL with LLM: {e}")
        print("Falling back to default query...")
        
        # Ultimate fallback - show data from first available table
        if available_tables:
            return f"SELECT * FROM {default_table} LIMIT 10"
        
        return "SELECT 'No data available. Please upload a CSV or Excel file first.' as message"

def execute_sql_query(sql_query: str) -> List[Dict[str, Any]]:
    """Execute SQL query and return results"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql_query))
            columns = result.keys()
            rows = result.fetchall()
            
            # Convert to list of dictionaries
            results = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert to JSON-serializable types
                    if hasattr(value, 'isoformat'):  # datetime
                        value = value.isoformat()
                    row_dict[col] = value
                results.append(row_dict)
            
            return results
    except Exception as e:
        raise Exception(f"SQL execution error: {str(e)}")

def generate_chart_data(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate intelligent chart-ready data from SQL results"""
    if not results:
        return {"labels": [], "datasets": [], "chartType": "bar"}
    
    keys = list(results[0].keys())
    
    if len(keys) < 2:
        return {"labels": [], "datasets": [], "chartType": "bar"}
    
    # Smarter chart data generation
    # First column as labels
    labels = [str(row[keys[0]]) for row in results]
    
    # Determine chart type based on data
    chart_type = "bar"
    if any(key.lower() in ['date', 'time', 'month', 'year', 'day'] for key in keys):
        chart_type = "line"
    
    datasets = []
    colors = [
        "rgba(54, 162, 235, 0.8)",  # Blue
        "rgba(255, 99, 132, 0.8)",  # Red  
        "rgba(75, 192, 192, 0.8)",  # Teal
        "rgba(153, 102, 255, 0.8)", # Purple
        "rgba(255, 159, 64, 0.8)",  # Orange
        "rgba(199, 199, 199, 0.8)"  # Grey
    ]
    
    for i, key in enumerate(keys[1:]):
        data = []
        for row in results:
            value = row[key]
            # Convert to number for charts
            try:
                if hasattr(value, '__float__'):
                    value = float(value)
                elif isinstance(value, str):
                    if value.replace('.', '').replace('-', '').replace(',', '').isdigit():
                        value = float(value.replace(',', ''))
                    else:
                        value = 0
                elif isinstance(value, (int, float)):
                    value = float(value)
                else:
                    value = 0
            except:
                value = 0
            data.append(value)
        
        color = colors[i % len(colors)]
        border_color = color.replace('0.8', '1.0')
        
        datasets.append({
            "label": key.replace('_', ' ').title(),
            "data": data,
            "backgroundColor": color,
            "borderColor": border_color,
            "borderWidth": 2,
            "fill": chart_type == "line"
        })
    
    return {
        "labels": labels,
        "datasets": datasets,
        "chartType": chart_type
    }

def get_query_suggestions(question: str) -> str:
    """Generate helpful suggestions for user queries"""
    suggestions = [
        "Try: 'Show me total sales'",
        "Try: 'Top 5 customers by spending'", 
        "Try: 'Sales by product'",
        "Try: 'Recent sales orders'",
        "Try: 'Average order value'",
        "Try: 'Sales trends by date'"
    ]
    
    question_lower = question.lower()
    if 'help' in question_lower or 'example' in question_lower:
        return " | ".join(suggestions[:3])
    
    return ""

def log_query(db: Session, question: str, sql_query: str, results: List[Dict[str, Any]]):
    """Log query to database"""
    try:
        log_entry = QueryLog(
            question=question,
            sql_query=sql_query,
            result_json=results
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging query: {e}")
        db.rollback()

@ask_router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest, db: Session = Depends(get_db)):
    """Process natural language question and return SQL results with chart data"""
    
    question = request.question.strip()
    
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        # Generate SQL query
        sql_query = generate_sql_query(question)
        
        if sql_query.startswith("SELECT 'No data found'"):
            suggestion = get_query_suggestions(question)
            return AskResponse(
                question=question,
                sql_query="",
                results=[],
                chart_data={"labels": [], "datasets": [], "chartType": "bar"},
                success=False,
                error_message="Could not understand the question. Please try rephrasing.",
                suggestion=suggestion
            )
        
        # Execute SQL query
        try:
            results = execute_sql_query(sql_query)
        except Exception as e:
            return AskResponse(
                question=question,
                sql_query=sql_query,
                results=[],
                chart_data={"labels": [], "datasets": [], "chartType": "bar"},
                success=False,
                error_message=str(e)
            )
        
        # Generate chart data
        chart_data = generate_chart_data(results)
        
        # Log the query
        log_query(db, question, sql_query, results)
        
        return AskResponse(
            question=question,
            sql_query=sql_query,
            results=results,
            chart_data=chart_data,
            success=True
        )
        
    except Exception as e:
        return AskResponse(
            question=question,
            sql_query="",
            results=[],
            chart_data={"labels": [], "datasets": [], "chartType": "bar"},
            success=False,
            error_message=f"Internal server error: {str(e)}"
        )

# New endpoints for enhanced functionality
@ask_router.get("/query-history")
async def get_query_history(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent query history"""
    try:
        logs = db.query(QueryLog).order_by(QueryLog.created_at.desc()).limit(limit).all()
        return {
            "success": True,
            "queries": [
                {
                    "id": log.id,
                    "question": log.question,
                    "sql_query": log.sql_query,
                    "created_at": log.created_at.isoformat(),
                    "result_count": len(log.result_json) if log.result_json is not None and isinstance(log.result_json, list) else 0
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching query history: {str(e)}")

@ask_router.get("/analytics-summary")
async def get_analytics_summary(db: Session = Depends(get_db)):
    """Get a summary of available analytics"""
    try:
        # Get basic stats about the data
        with engine.connect() as conn:
            # Get user-uploaded tables (exclude system tables)
            try:
                # For SQLite, use sqlite_master
                tables_result = conn.execute(text("""
                    SELECT name as table_name 
                    FROM sqlite_master 
                    WHERE type='table' 
                    AND name NOT IN ('query_logs', 'table_metadata', 'uploaded_datasets', 'ai_insights', 'sqlite_sequence')
                """))
                tables = [row[0] for row in tables_result.fetchall()]
            except Exception:
                # If there's an error, return empty list
                tables = []
            
            summary = {
                "available_tables": tables,
                "suggested_queries": [
                    "Show me the structure of my data",
                    "What are the top 10 records?", 
                    "Show me summary statistics",
                    "What are the unique values in each column?",
                    "Show me data trends over time",
                    "Find any missing or null values"
                ]
            }
            
            # Get basic stats for any available tables
            data_stats = {"total_tables": len(tables)}
            
            if tables:
                # Get row count for the first table as an example
                try:
                    first_table = tables[0]
                    stats_result = conn.execute(text(f"SELECT COUNT(*) as row_count FROM {first_table}"))
                    row = stats_result.fetchone()
                    if row:
                        data_stats["sample_table"] = first_table
                        data_stats["sample_table_rows"] = row[0]
                except Exception:
                    pass
            
            summary["data_stats"] = data_stats
            
            return {"success": True, "summary": summary}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
