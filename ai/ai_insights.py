# app/ai_insights.py - AI Insights Engine

import os
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import json

from backend.db import engine, get_db
from backend.models import AIInsights, UploadedDatasets

insights_router = APIRouter()

def get_llm():
    """Initialize Google Gemini LLM for insights"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment")
    os.environ["GOOGLE_API_KEY"] = api_key
    return ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.7)

def analyze_data_statistics(table_name: str) -> Dict[str, Any]:
    """Analyze basic statistics of the dataset"""
    try:
        with engine.connect() as conn:
            # Get basic table info
            count_query = f'SELECT COUNT(*) as total_rows FROM "{table_name}"'
            result = conn.execute(text(count_query))
            row = result.fetchone()
            total_rows = row[0] if row else 0
            
            # Get column info (SQLite syntax)
            columns_query = f'PRAGMA table_info("{table_name}")'
            result = conn.execute(text(columns_query))
            pragma_result = result.fetchall()
            
            # Convert pragma result to column info format
            columns_info = []
            for row in pragma_result:
                # PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
                if row[1] != 'id':  # Skip 'id' column if it exists
                    columns_info.append((row[1], row[2]))  # (column_name, data_type)
            
            # Get sample data for analysis
            sample_query = f'SELECT * FROM "{table_name}" LIMIT 100'
            result = conn.execute(text(sample_query))
            sample_data = result.fetchall()
            column_names = list(result.keys())
            
            return {
                "total_rows": total_rows,
                "total_columns": len(columns_info),
                "columns": [{"name": col[0], "type": col[1]} for col in columns_info],
                "sample_data": [dict(zip(column_names, row)) for row in sample_data[:10]]
            }
    except Exception as e:
        return {"error": str(e)}

def generate_ai_insights(table_name: str, data_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate AI-powered insights from data analysis"""
    try:
        llm = get_llm()
        
        # Prepare data summary for AI analysis
        data_summary = {
            "table_name": table_name,
            "total_rows": data_stats.get("total_rows", 0),
            "total_columns": data_stats.get("total_columns", 0),
            "columns": data_stats.get("columns", []),
            "sample_data": data_stats.get("sample_data", [])[:5]  # Limit sample for prompt
        }
        
        prompt = f"""
        Analyze this dataset and provide business insights. The data summary is:
        
        Table: {data_summary['table_name']}
        Rows: {data_summary['total_rows']:,}
        Columns: {data_summary['total_columns']}
        
        Column Types: {[col['name'] for col in data_summary['columns']]}
        Sample Data: {json.dumps(data_summary['sample_data'], indent=2)[:1000]}
        
        Please provide 3-5 actionable insights in the following categories:
        1. TREND - Data trends or patterns you notice
        2. RECOMMENDATION - Actionable business recommendations
        3. WARNING - Potential issues or data quality concerns
        4. OPPORTUNITY - Business opportunities or areas for improvement
        
        Format each insight as:
        Category: [TREND/RECOMMENDATION/WARNING/OPPORTUNITY]
        Insight: [Your insight text]
        Confidence: [0.1-1.0]
        
        Keep insights business-focused and actionable. If you notice data quality issues, mention them.
        """
        
        response = llm.invoke([HumanMessage(content=prompt)])
        
        # Parse AI response into structured insights
        insights = []
        if hasattr(response, 'content'):
            content = str(response.content)
            lines = content.split('\n')
            
            current_insight = {}
            for line in lines:
                line = line.strip()
                if line.startswith('Category:'):
                    if current_insight:
                        insights.append(current_insight)
                    current_insight = {'type': line.replace('Category:', '').strip().lower()}
                elif line.startswith('Insight:'):
                    current_insight['text'] = line.replace('Insight:', '').strip()
                elif line.startswith('Confidence:'):
                    try:
                        confidence = float(line.replace('Confidence:', '').strip())
                        current_insight['confidence'] = str(min(max(confidence, 0.1), 1.0))
                    except:
                        current_insight['confidence'] = "0.7"
                        
            # Add the last insight
            if current_insight and 'text' in current_insight:
                insights.append(current_insight)
        
        # Fallback insights if AI parsing fails
        if not insights:
            insights = [
                {
                    'type': 'trend',
                    'text': f'Dataset contains {data_summary["total_rows"]:,} records with {data_summary["total_columns"]} data points per record.',
                    'confidence': 0.9
                },
                {
                    'type': 'recommendation',
                    'text': 'Consider exploring correlations between numerical columns to identify business drivers.',
                    'confidence': 0.7
                }
            ]
        
        return insights
        
    except Exception as e:
        # Return basic fallback insights
        return [
            {
                'type': 'warning',
                'text': f'Unable to generate AI insights: {str(e)}. Manual data exploration recommended.',
                'confidence': 0.8
            }
        ]

@insights_router.post("/generate-insights/{dataset_id}")
async def generate_insights_for_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Generate AI insights for a specific dataset"""
    try:
        # Get dataset info
        dataset = db.query(UploadedDatasets).filter(UploadedDatasets.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get the table name as a string
        table_name = str(dataset.table_name)
        
        # Analyze data
        data_stats = analyze_data_statistics(table_name)
        if "error" in data_stats:
            raise HTTPException(status_code=500, detail=f"Error analyzing data: {data_stats['error']}")
        
        # Generate AI insights
        ai_insights = generate_ai_insights(table_name, data_stats)
        
        # Save insights to database
        saved_insights = []
        for insight in ai_insights:
            insight_record = AIInsights(
                table_name=dataset.table_name,
                insight_type=insight.get('type', 'general'),
                insight_text=insight.get('text', ''),
                confidence_score=insight.get('confidence', 0.7)
            )
            db.add(insight_record)
            saved_insights.append(insight)
        
        db.commit()
        
        return {
            "success": True,
            "dataset_name": dataset.dataset_name,
            "table_name": dataset.table_name,
            "data_statistics": data_stats,
            "insights": saved_insights,
            "insights_count": len(saved_insights)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@insights_router.get("/insights/{dataset_id}")
async def get_insights_for_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Get existing insights for a dataset"""
    try:
        # Get dataset info
        dataset = db.query(UploadedDatasets).filter(UploadedDatasets.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get insights
        insights = db.query(AIInsights).filter(
            AIInsights.table_name == dataset.table_name
        ).order_by(AIInsights.created_at.desc()).all()
        
        result = []
        for insight in insights:
            result.append({
                "id": insight.id,
                "type": insight.insight_type,
                "text": insight.insight_text,
                "confidence": insight.confidence_score,
                "created_at": insight.created_at.isoformat() if hasattr(insight.created_at, 'isoformat') else str(insight.created_at)
            })
        
        return {
            "success": True,
            "dataset_name": dataset.dataset_name,
            "insights": result,
            "insights_count": len(result)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching insights: {str(e)}")

@insights_router.get("/insights")
async def get_all_recent_insights(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent insights across all datasets"""
    try:
        insights = db.query(AIInsights).order_by(
            AIInsights.created_at.desc()
        ).limit(limit).all()
        
        result = []
        for insight in insights:
            result.append({
                "id": insight.id,
                "table_name": insight.table_name,
                "type": insight.insight_type,
                "text": insight.insight_text,
                "confidence": insight.confidence_score,
                "created_at": insight.created_at.isoformat() if hasattr(insight.created_at, 'isoformat') else str(insight.created_at)
            })
        
        return {
            "success": True,
            "insights": result,
            "total_count": len(result)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching insights: {str(e)}")

@insights_router.delete("/insights/{insight_id}")
async def delete_insight(insight_id: int, db: Session = Depends(get_db)):
    """Delete a specific insight"""
    try:
        insight = db.query(AIInsights).filter(AIInsights.id == insight_id).first()
        if not insight:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        db.delete(insight)
        db.commit()
        
        return {"success": True, "message": "Insight deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting insight: {str(e)}")

@insights_router.get("/data-health/{dataset_id}")
async def check_data_health(dataset_id: int, db: Session = Depends(get_db)):
    """Perform data quality health check"""
    try:
        # Get dataset info
        dataset = db.query(UploadedDatasets).filter(UploadedDatasets.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        table_name = dataset.table_name
        
        # Perform data quality checks
        with engine.connect() as conn:
            # Get all columns except id
            columns_query = f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name != 'id'
            """
            result = conn.execute(text(columns_query))
            columns = [row[0] for row in result.fetchall()]
            
            health_issues = []
            
            # Check for empty values in each column
            for col in columns:
                null_check = f"""
                    SELECT COUNT(*) as null_count, 
                           COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "{table_name}") as null_percentage
                    FROM "{table_name}" 
                    WHERE "{col}" IS NULL OR "{col}" = '' OR "{col}" = 'None'
                """
                result = conn.execute(text(null_check))
                null_data = result.fetchone()
                
                if null_data and null_data[1] > 10:  # More than 10% missing
                    health_issues.append({
                        "type": "missing_data",
                        "severity": "high" if null_data[1] > 50 else "medium",
                        "message": f"Column '{col}' has {null_data[1]:.1f}% missing values",
                        "column": col,
                        "percentage": null_data[1]
                    })
            
            # Check for duplicate rows
            duplicate_check = f"""
                SELECT COUNT(*) - COUNT(DISTINCT ({', '.join([f'"{col}"' for col in columns])})) as duplicate_count
                FROM "{table_name}"
            """
            result = conn.execute(text(duplicate_check))
            row = result.fetchone()
            duplicate_count = row[0] if row else 0
            
            if duplicate_count > 0:
                health_issues.append({
                    "type": "duplicates",
                    "severity": "medium",
                    "message": f"Found {duplicate_count} duplicate rows",
                    "count": duplicate_count
                })
        
        # Calculate overall health score
        total_checks = len(columns) + 1  # columns + duplicate check
        issues_count = len(health_issues)
        health_score = max(0, (total_checks - issues_count) / total_checks * 100)
        
        return {
            "success": True,
            "dataset_name": dataset.dataset_name,
            "health_score": round(health_score, 1),
            "total_checks": total_checks,
            "issues_found": issues_count,
            "health_issues": health_issues,
            "recommendation": "Good data quality" if health_score > 80 else "Consider data cleaning" if health_score > 60 else "Significant data quality issues detected"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking data health: {str(e)}")
