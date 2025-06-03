# app/export.py - Data Export Functionality

import csv
import json
import io
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import engine, get_db

export_router = APIRouter()

class ExportRequest(BaseModel):
    sql_query: str
    format: str = "csv"  # csv, json, excel

@export_router.post("/export")
async def export_data(request: ExportRequest):
    """Export SQL query results in various formats"""
    
    if not request.sql_query.strip():
        raise HTTPException(status_code=400, detail="SQL query cannot be empty")
    
    # Security check - only allow SELECT statements
    if not request.sql_query.strip().upper().startswith('SELECT'):
        raise HTTPException(status_code=400, detail="Only SELECT statements are allowed")
    
    try:
        # Execute SQL query
        with engine.connect() as conn:
            result = conn.execute(text(request.sql_query))
            columns = list(result.keys())  # Convert RMKeyView to list
            rows = result.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert to JSON-serializable types
                    if hasattr(value, 'isoformat'):  # datetime
                        value = value.isoformat()
                    elif hasattr(value, '__float__'):  # Decimal
                        value = float(value)
                    row_dict[col] = value
                data.append(row_dict)
        
        # Generate export based on format
        if request.format.lower() == "csv":
            return export_csv(data, columns)
        elif request.format.lower() == "json":
            return export_json(data)
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'json'")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")

def export_csv(data: List[Dict[str, Any]], columns: List[str]) -> StreamingResponse:
    """Export data as CSV"""
    output = io.StringIO()
    
    if data:
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerows(data)
    
    output.seek(0)
    
    response = StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reportzy_export.csv"}
    )
    
    return response

def export_json(data: List[Dict[str, Any]]) -> Response:
    """Export data as JSON"""
    from datetime import datetime
    
    export_data = {
        "export_timestamp": datetime.now().isoformat(),
        "total_records": len(data),
        "data": data
    }
    
    return Response(
        content=json.dumps(export_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=reportzy_export.json"}
    )

@export_router.get("/export-templates")
async def get_export_templates():
    """Get predefined export templates"""
    templates = {
        "sales_summary": {
            "name": "Sales Summary Report",
            "sql": "SELECT customer_name, SUM(CAST(amount AS DECIMAL)) as total_spent, COUNT(*) as order_count FROM sales GROUP BY customer_name ORDER BY total_spent DESC",
            "description": "Customer sales summary with totals and order counts"
        },
        "product_performance": {
            "name": "Product Performance Report", 
            "sql": "SELECT product, SUM(CAST(amount AS DECIMAL)) as total_sales, COUNT(*) as units_sold, AVG(CAST(amount AS DECIMAL)) as avg_price FROM sales GROUP BY product ORDER BY total_sales DESC",
            "description": "Product sales performance with averages"
        },
        "daily_sales": {
            "name": "Daily Sales Report",
            "sql": "SELECT date, SUM(CAST(amount AS DECIMAL)) as daily_sales, COUNT(*) as order_count FROM sales GROUP BY date ORDER BY date DESC",
            "description": "Daily sales totals and order counts"
        },
        "complete_sales": {
            "name": "Complete Sales Data",
            "sql": "SELECT * FROM sales ORDER BY date DESC",
            "description": "All sales records in chronological order"
        }
    }
    
    return {
        "success": True,
        "templates": templates
    }

@export_router.post("/export-template/{template_name}")
async def export_template(template_name: str, format: str = "csv"):
    """Export using a predefined template"""
    
    # Get templates
    response = await get_export_templates()
    templates = response["templates"]
    
    if template_name not in templates:
        raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found")
    
    template = templates[template_name]
    
    # Use the export functionality
    export_request = ExportRequest(sql_query=template["sql"], format=format)
    return await export_data(export_request)
