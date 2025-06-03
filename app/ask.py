# app/ask_enhanced.py - Enhanced Analytics Endpoint with Better NLP

import json
import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.db import engine, get_db
from app.models import QueryLog

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
    """Initialize OpenAI LLM"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment")
    os.environ["OPENAI_API_KEY"] = api_key
    return ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

def generate_sql_query(question: str) -> str:
    """Generate SQL query using enhanced pattern matching with LLM fallback"""
    
    question_lower = question.lower().strip()
    
    # Handle direct SQL queries
    if question_lower.startswith('select'):
        return question.strip()
    
    # Enhanced pattern matching for analytics queries
    patterns = {
        # Sales Analytics
        'total_sales': ['total sales', 'sum of sales', 'sales total', 'revenue total', 'overall sales'],
        'sales_by_customer': ['sales by customer', 'customer sales', 'per customer', 'each customer', 'customer breakdown'],
        'sales_by_product': ['sales by product', 'product sales', 'per product', 'each product', 'product breakdown'],
        'sales_by_date': ['sales by date', 'daily sales', 'sales over time', 'sales trend', 'sales per day'],
        'top_customers': ['top customers', 'best customers', 'highest spending', 'biggest spenders', 'top 5 customers', 'top 10 customers'],
        'top_products': ['top products', 'best selling', 'most popular', 'bestsellers', 'top 5 products', 'top 10 products', 'bestselling products', 'show me bestselling'],
        'recent_sales': ['recent sales', 'latest sales', 'new orders', 'last orders', 'newest sales', 'recent purchases'],
        'average_order': ['average order', 'avg order', 'mean sale', 'average sale', 'average order value'],
        'sales_count': ['number of sales', 'count of orders', 'total orders', 'order count'],
        
        # Customer Analytics  
        'customer_list': ['all customers', 'list customers', 'customer names', 'show customers'],
        'customer_count': ['number of customers', 'count customers', 'total customers', 'customer count', 'count of customers'],
        
        # Product Analytics
        'product_list': ['all products', 'list products', 'product names', 'show products'],
        'product_count': ['number of products', 'count products', 'total products', 'product count'],
        
        # Time-based
        'today_sales': ['today sales', 'todays sales', 'sales today'],
        'month_sales': ['this month', 'monthly sales', 'month sales'],
        'year_sales': ['this year', 'yearly sales', 'year sales'],
    }
    
    # Check patterns and generate appropriate SQL
    for pattern_key, pattern_phrases in patterns.items():
        if any(phrase in question_lower for phrase in pattern_phrases):
            if pattern_key == 'total_sales':
                return "SELECT SUM(CAST(amount AS DECIMAL)) as total_sales FROM sales"
            elif pattern_key == 'sales_by_customer':
                return "SELECT customer_name, SUM(CAST(amount AS DECIMAL)) as total_spent, COUNT(*) as order_count FROM sales GROUP BY customer_name ORDER BY total_spent DESC"
            elif pattern_key == 'sales_by_product':
                return "SELECT product, SUM(CAST(amount AS DECIMAL)) as total_sales, COUNT(*) as units_sold FROM sales GROUP BY product ORDER BY total_sales DESC"
            elif pattern_key == 'sales_by_date':
                return "SELECT date, SUM(CAST(amount AS DECIMAL)) as daily_sales, COUNT(*) as order_count FROM sales GROUP BY date ORDER BY date"
            elif pattern_key == 'top_customers':
                return "SELECT customer_name, SUM(CAST(amount AS DECIMAL)) as total_spent FROM sales GROUP BY customer_name ORDER BY total_spent DESC LIMIT 5"
            elif pattern_key == 'top_products':
                return "SELECT product, SUM(CAST(amount AS DECIMAL)) as total_sales, COUNT(*) as units_sold FROM sales GROUP BY product ORDER BY total_sales DESC LIMIT 5"
            elif pattern_key == 'recent_sales':
                return "SELECT * FROM sales ORDER BY date DESC LIMIT 10"
            elif pattern_key == 'average_order':
                return "SELECT AVG(CAST(amount AS DECIMAL)) as average_order_value FROM sales"
            elif pattern_key == 'sales_count':
                return "SELECT COUNT(*) as total_orders FROM sales"
            elif pattern_key == 'customer_list':
                return "SELECT DISTINCT customer_name FROM sales ORDER BY customer_name"
            elif pattern_key == 'customer_count':
                return "SELECT COUNT(DISTINCT customer_name) as total_customers FROM sales"
            elif pattern_key == 'product_list':
                return "SELECT DISTINCT product FROM sales ORDER BY product"
            elif pattern_key == 'product_count':
                return "SELECT COUNT(DISTINCT product) as total_products FROM sales"
    
    # General fallback patterns
    if any(word in question_lower for word in ['show', 'get', 'list', 'display']):
        if 'sales' in question_lower:
            return "SELECT * FROM sales ORDER BY date DESC LIMIT 20"
    
    # Try LLM if pattern matching fails
    try:
        llm = get_llm()
        
        prompt = f"""
        Convert the following natural language question to a SQL query for a PostgreSQL database.
        
        Available tables and schema:
        - sales (order_id VARCHAR, customer_name VARCHAR, product VARCHAR, amount VARCHAR, date VARCHAR)
        
        Guidelines:
        - Use CAST(amount AS DECIMAL) for numeric calculations
        - Use proper PostgreSQL syntax
        - Return only the SQL query, no explanation
        - If asking for "all" or general data, limit to 20 rows
        - For aggregations, include meaningful column aliases
        
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
        
        # Ultimate fallback
        if any(word in question_lower for word in ['sales', 'order', 'purchase']):
            return "SELECT * FROM sales ORDER BY date DESC LIMIT 10"
        
        return "SELECT 'No data found' as message"

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
            # Check what tables exist (PostgreSQL syntax)
            try:
                tables_result = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                """))
                tables = [row[0] for row in tables_result.fetchall()]
            except Exception:
                # If there's an error, return empty list
                tables = []
            
            summary = {
                "available_tables": tables,
                "suggested_queries": [
                    "Show me total sales",
                    "Top customers by spending", 
                    "Sales by product",
                    "Recent orders",
                    "Average order value",
                    "Daily sales trends"
                ]
            }
            
            # If sales table exists, get some basic stats
            if 'sales' in tables:
                try:
                    stats_result = conn.execute(text("""
                        SELECT 
                            COUNT(*) as total_orders,
                            COUNT(DISTINCT customer_name) as total_customers,
                            COUNT(DISTINCT product) as total_products,
                            SUM(CAST(amount AS DECIMAL)) as total_revenue
                        FROM sales
                    """))
                    stats = stats_result.fetchone()
                    
                    if stats:
                        summary["data_stats"] = {
                            "total_orders": int(stats[0]) if stats[0] is not None else 0,
                            "total_customers": int(stats[1]) if stats[1] is not None else 0, 
                            "total_products": int(stats[2]) if stats[2] is not None else 0,
                            "total_revenue": float(stats[3]) if stats[3] is not None else 0.0
                        }
                    else:
                        summary["data_stats"] = {
                            "total_orders": 0,
                            "total_customers": 0,
                            "total_products": 0,
                            "total_revenue": 0.0
                        }
                except Exception as e:
                    # If there's an error with sales table, just skip the stats
                    summary["data_stats"] = {
                        "total_orders": 0,
                        "total_customers": 0,
                        "total_products": 0,
                        "total_revenue": 0
                    }
            
            return {"success": True, "summary": summary}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
