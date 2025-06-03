# app/feedback.py - User Feedback System

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db import get_db
from app.models import QueryLog

feedback_router = APIRouter()

class FeedbackRequest(BaseModel):
    query_id: int
    rating: int  # 1=helpful, 0=not helpful
    comment: Optional[str] = None

class FeedbackStatsResponse(BaseModel):
    total_queries: int
    queries_with_feedback: int
    helpful_percentage: float
    recent_feedback: list

@feedback_router.post("/feedback")
async def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    """Submit user feedback for a query"""
    try:
        # Find the query log entry
        query_log = db.query(QueryLog).filter(QueryLog.id == request.query_id).first()
        
        if not query_log:
            raise HTTPException(status_code=404, detail="Query not found")
        
        # Fixed: Use proper SQLAlchemy update operation
        from sqlalchemy import update
        
        stmt = update(QueryLog).where(QueryLog.id == request.query_id).values(
            user_feedback=request.rating,
            feedback_comment=request.comment
        )
        
        db.execute(stmt)
        db.commit()
        
        return {"success": True, "message": "Feedback submitted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}")

@feedback_router.get("/feedback/stats")
async def get_feedback_stats(db: Session = Depends(get_db)):
    """Get feedback statistics"""
    try:
        # Get overall stats
        total_queries = db.query(QueryLog).count()
        queries_with_feedback = db.query(QueryLog).filter(QueryLog.user_feedback.isnot(None)).count()
        helpful_queries = db.query(QueryLog).filter(QueryLog.user_feedback == 1).count()
        
        helpful_percentage = (helpful_queries / queries_with_feedback * 100) if queries_with_feedback > 0 else 0
        
        # Get recent feedback
        recent_feedback = db.query(QueryLog).filter(
            QueryLog.user_feedback.isnot(None)
        ).order_by(QueryLog.created_at.desc()).limit(10).all()
        
        recent_data = []
        for query in recent_feedback:
            recent_data.append({
                "id": query.id,
                "question": query.question,
                "rating": query.user_feedback,
                "comment": query.feedback_comment,
                "created_at": query.created_at.isoformat()
            })
        
        return {
            "success": True,
            "stats": {
                "total_queries": total_queries,
                "queries_with_feedback": queries_with_feedback,
                "helpful_percentage": round(helpful_percentage, 2),
                "recent_feedback": recent_data
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting feedback stats: {str(e)}")

@feedback_router.get("/feedback/problematic-queries")
async def get_problematic_queries(db: Session = Depends(get_db)):
    """Get queries that received negative feedback"""
    try:
        problematic = db.query(QueryLog).filter(QueryLog.user_feedback == 0).all()
        
        result = []
        for query in problematic:
            result.append({
                "id": query.id,
                "question": query.question,
                "sql_query": query.sql_query,
                "comment": query.feedback_comment,
                "created_at": query.created_at.isoformat()
            })
        
        return {"success": True, "problematic_queries": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting problematic queries: {str(e)}")

@feedback_router.get("/feedback/improvement-suggestions")
async def get_improvement_suggestions(db: Session = Depends(get_db)):
    """Get AI improvement suggestions based on feedback"""
    try:
        # Get patterns from negative feedback
        problematic = db.query(QueryLog).filter(QueryLog.user_feedback == 0).all()
        
        suggestions = []
        
        # Analyze common patterns in failed queries
        common_issues = {}
        for query in problematic:
            question_lower = query.question.lower()
            
            # Check for common problem patterns
            if 'group by' in query.sql_query.lower() and 'error' in (query.feedback_comment or '').lower():
                key = "groupby_aggregation"
                if key not in common_issues:
                    common_issues[key] = []
                common_issues[key].append(query.question)
            
            if 'join' in query.sql_query.lower():
                key = "join_complexity"
                if key not in common_issues:
                    common_issues[key] = []
                common_issues[key].append(query.question)
            
            if 'cast' in query.sql_query.lower():
                key = "data_type_conversion"
                if key not in common_issues:
                    common_issues[key] = []
                common_issues[key].append(query.question)
        
        # Generate suggestions
        for issue_type, examples in common_issues.items():
            if issue_type == "groupby_aggregation":
                suggestions.append({
                    "issue": "GROUP BY Aggregation Errors",
                    "suggestion": "Improve pattern matching for aggregation queries. Add more examples for sum, count, avg operations.",
                    "examples": examples[:3],
                    "priority": "high"
                })
            elif issue_type == "join_complexity":
                suggestions.append({
                    "issue": "Complex JOIN Operations",
                    "suggestion": "Enhance multi-table query understanding. Add relationship mapping between tables.",
                    "examples": examples[:3],
                    "priority": "medium"
                })
            elif issue_type == "data_type_conversion":
                suggestions.append({
                    "issue": "Data Type Conversion Issues",
                    "suggestion": "Improve automatic data type detection and conversion in SQL generation.",
                    "examples": examples[:3],
                    "priority": "medium"
                })
        
        return {"success": True, "suggestions": suggestions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")
