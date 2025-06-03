# app/monitoring.py - Unified System Monitoring Module

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_, update
from app.db import get_db, engine
from app.models import SystemMetrics, QueryLog
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import psutil
import asyncio
from dataclasses import dataclass
import logging

monitoring_router = APIRouter()

# Data Models
class SystemMetricsResponse(BaseModel):
    id: int
    metric_name: str
    metric_value: float
    metric_unit: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

class AlertRule(BaseModel):
    metric_name: str
    threshold: float
    operator: str  # "gt", "lt", "eq"
    alert_message: str

class PerformanceReport(BaseModel):
    avg_query_time: float
    total_queries: int
    error_rate: float
    system_health_score: float
    top_slow_queries: List[Dict[str, Any]]
    resource_usage: Dict[str, float]

@dataclass
class Alert:
    level: str
    message: str
    metric: str
    value: float
    threshold: float
    timestamp: datetime

# Background monitoring service
class MonitoringService:
    def __init__(self):
        self.alert_rules = [
            AlertRule(
                metric_name="cpu_usage",
                threshold=80.0,
                operator="gt",
                alert_message="High CPU usage detected"
            ),
            AlertRule(
                metric_name="memory_usage",
                threshold=85.0,
                operator="gt",
                alert_message="High memory usage detected"
            ),
            AlertRule(
                metric_name="disk_usage",
                threshold=90.0,
                operator="gt",
                alert_message="High disk usage detected"
            ),
            AlertRule(
                metric_name="query_error_rate",
                threshold=5.0,
                operator="gt",
                alert_message="High query error rate detected"
            )
        ]
        self.alerts: List[Alert] = []

    async def collect_system_metrics(self, db: Session):
        """Collect system performance metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            self._save_metric(db, "cpu_usage", cpu_percent, "percent")
            
            # Memory metrics
            memory = psutil.virtual_memory()
            self._save_metric(db, "memory_usage", memory.percent, "percent")
            self._save_metric(db, "memory_available", memory.available / (1024**3), "GB")
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            self._save_metric(db, "disk_usage", disk_percent, "percent")
            self._save_metric(db, "disk_free", disk.free / (1024**3), "GB")
            
            # Database metrics
            await self._collect_db_metrics(db)
            
            # Check alerts
            await self._check_alerts(db)
            
        except Exception as e:
            logging.error(f"Error collecting system metrics: {e}")

    def _save_metric(self, db: Session, name: str, value: float, unit: str):
        """Save a metric to the database"""
        try:
            metric = SystemMetrics(
                metric_name=name,
                metric_value=value,
                metric_unit=unit,
                timestamp=datetime.now()
            )
            db.add(metric)
            db.commit()
        except Exception as e:
            logging.error(f"Error saving metric {name}: {e}")
            db.rollback()

    async def _collect_db_metrics(self, db: Session):
        """Collect database-specific metrics"""
        try:
            # Query performance metrics
            recent_time = datetime.now() - timedelta(hours=1)
            
            # Get recent queries
            recent_queries = db.query(QueryLog).filter(
                QueryLog.timestamp >= recent_time
            ).all()
            
            if recent_queries:
                # Calculate average query complexity (using SQL length as proxy)
                avg_complexity = sum(len(str(q.sql_query)) for q in recent_queries) / len(recent_queries)
                self._save_metric(db, "avg_query_complexity", avg_complexity, "chars")
                
                # Calculate error rate
                error_count = sum(1 for q in recent_queries if not q.success)
                error_rate = (error_count / len(recent_queries)) * 100
                self._save_metric(db, "query_error_rate", error_rate, "percent")
                
                # Query volume
                self._save_metric(db, "queries_per_hour", len(recent_queries), "count")
            
        except Exception as e:
            logging.error(f"Error collecting database metrics: {e}")

    async def _check_alerts(self, db: Session):
        """Check alert rules against current metrics"""
        try:
            for rule in self.alert_rules:
                # Get latest metric value
                latest_metric = db.query(SystemMetrics).filter(
                    SystemMetrics.metric_name == rule.metric_name
                ).order_by(SystemMetrics.timestamp.desc()).first()
                
                if latest_metric:
                    # Fixed: Access the actual value, not the column
                    value = float(getattr(latest_metric, 'metric_value', 0))
                    triggered = False
                    
                    # Fixed: Use Python operators instead of SQLAlchemy column comparisons
                    if rule.operator == "gt" and value > rule.threshold:
                        triggered = True
                    elif rule.operator == "lt" and value < rule.threshold:
                        triggered = True
                    elif rule.operator == "eq" and abs(value - rule.threshold) < 0.01:
                        triggered = True
                    
                    if triggered:
                        # Fixed: Use Python conditional instead of SQLAlchemy comparison
                        level = "warning" if value < rule.threshold * 1.2 else "critical"
                        
                        alert = Alert(
                            level=level,
                            message=rule.alert_message,
                            metric=rule.metric_name,
                            value=value,
                            threshold=rule.threshold,
                            timestamp=datetime.now()
                        )
                        self.alerts.append(alert)
                        
                        # Keep only last 100 alerts
                        if len(self.alerts) > 100:
                            self.alerts = self.alerts[-100:]
                            
        except Exception as e:
            logging.error(f"Error checking alerts: {e}")

# Global monitoring service instance
monitoring_service = MonitoringService()

# Background task to collect metrics
async def collect_metrics_task():
    """Background task that runs continuously to collect metrics"""
    from app.db import SessionLocal
    
    while True:
        try:
            db = SessionLocal()
            await monitoring_service.collect_system_metrics(db)
            db.close()
            await asyncio.sleep(60)  # Collect metrics every minute
        except Exception as e:
            logging.error(f"Error in metrics collection task: {e}")
            await asyncio.sleep(60)

# API Endpoints
@monitoring_router.get("/metrics", response_model=List[SystemMetricsResponse])
async def get_metrics(
    metric_name: Optional[str] = None,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get system metrics for the specified time period"""
    try:
        since_time = datetime.now() - timedelta(hours=hours)
        
        query = db.query(SystemMetrics).filter(SystemMetrics.timestamp >= since_time)
        
        if metric_name:
            query = query.filter(SystemMetrics.metric_name == metric_name)
        
        metrics = query.order_by(SystemMetrics.timestamp.desc()).limit(1000).all()
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")

@monitoring_router.get("/metrics/latest")
async def get_latest_metrics(db: Session = Depends(get_db)):
    """Get the latest value for each metric"""
    try:
        # Get distinct metric names
        metric_names = db.query(SystemMetrics.metric_name).distinct().all()
        
        latest_metrics = {}
        for (name,) in metric_names:
            latest = db.query(SystemMetrics).filter(
                SystemMetrics.metric_name == name
            ).order_by(SystemMetrics.timestamp.desc()).first()
            
            if latest:
                latest_metrics[name] = {
                    "value": latest.metric_value,
                    "unit": latest.metric_unit,
                    "timestamp": latest.timestamp
                }
        
        return latest_metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving latest metrics: {str(e)}")

@monitoring_router.get("/alerts")
async def get_alerts(level: Optional[str] = None):
    """Get current alerts"""
    try:
        alerts = monitoring_service.alerts
        
        if level:
            alerts = [alert for alert in alerts if alert.level == level]
        
        # Convert to dict for JSON serialization
        alert_dicts = [
            {
                "level": alert.level,
                "message": alert.message,
                "metric": alert.metric,
                "value": alert.value,
                "threshold": alert.threshold,
                "timestamp": alert.timestamp
            }
            for alert in alerts
        ]
        
        return alert_dicts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving alerts: {str(e)}")

@monitoring_router.post("/alerts/clear")
async def clear_alerts():
    """Clear all alerts"""
    try:
        monitoring_service.alerts.clear()
        return {"message": "All alerts cleared"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing alerts: {str(e)}")

@monitoring_router.get("/performance-report", response_model=PerformanceReport)
async def get_performance_report(hours: int = 24, db: Session = Depends(get_db)):
    """Get comprehensive performance report"""
    try:
        since_time = datetime.now() - timedelta(hours=hours)
        
        # Get recent queries
        recent_queries = db.query(QueryLog).filter(
            QueryLog.timestamp >= since_time
        ).all()
        
        total_queries = len(recent_queries)
        successful_queries = [q for q in recent_queries if q.success]
        failed_queries = [q for q in recent_queries if not q.success]
        
        # Calculate metrics
        avg_query_time = 0.0  # We don't track execution time yet
        error_rate = (len(failed_queries) / max(total_queries, 1)) * 100
        
        # Get top complex queries (using SQL length as proxy)
        complex_queries = sorted(recent_queries, key=lambda x: len(str(x.sql_query)), reverse=True)[:5]
        
        top_slow_queries = [
            {
                "question": str(query.question)[:100] + "..." if len(str(query.question)) > 100 else str(query.question),
                "sql_length": len(str(query.sql_query)),
                "timestamp": query.timestamp,
                "success": query.success
            }
            for query in complex_queries
        ]
        
        # Get latest resource usage
        latest_metrics = {}
        for metric_name in ["cpu_usage", "memory_usage", "disk_usage"]:
            latest = db.query(SystemMetrics).filter(
                SystemMetrics.metric_name == metric_name
            ).order_by(SystemMetrics.timestamp.desc()).first()
            
            if latest:
                latest_metrics[metric_name] = latest.metric_value
        
        # Calculate system health score (0-100)
        health_score = 100.0
        if "cpu_usage" in latest_metrics:
            health_score -= max(0, latest_metrics["cpu_usage"] - 50) * 0.5
        if "memory_usage" in latest_metrics:
            health_score -= max(0, latest_metrics["memory_usage"] - 60) * 0.3
        if error_rate > 0:
            health_score -= error_rate * 2
        
        health_score = max(0, min(100, health_score))
        
        return PerformanceReport(
            avg_query_time=avg_query_time,
            total_queries=total_queries,
            error_rate=round(error_rate, 2),
            system_health_score=round(health_score, 2),
            top_slow_queries=top_slow_queries,
            resource_usage=latest_metrics
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating performance report: {str(e)}")

@monitoring_router.post("/start-monitoring")
async def start_monitoring(background_tasks: BackgroundTasks):
    """Start background monitoring (for development/testing)"""
    try:
        background_tasks.add_task(collect_metrics_task)
        return {"message": "Monitoring started"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting monitoring: {str(e)}")

@monitoring_router.get("/system-status")
async def get_system_status():
    """Get current system status"""
    try:
        # Get current system info
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        status = {
            "cpu_usage": cpu_percent,
            "memory_usage": memory.percent,
            "disk_usage": (disk.used / disk.total) * 100,
            "uptime": psutil.boot_time(),
            "active_alerts": len([a for a in monitoring_service.alerts if a.level == "critical"]),
            "timestamp": datetime.now()
        }
        
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting system status: {str(e)}")
