# app/analytics.py - Unified Analytics Module with Multi-Language AI Support

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db, engine
from pydantic import BaseModel, SecretStr
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import json
import uuid
import os
import logging
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.models import QueryLog

analytics_router = APIRouter()

# Supported languages with their codes
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish', 
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech'
}

# Data Models
class WebsiteClickData(BaseModel):
    session_id: str
    user_id: Optional[str]
    page_url: str
    page_title: str
    event_type: str  # "page_view", "click", "scroll", "form_submit"
    element_id: Optional[str]
    element_class: Optional[str]
    element_text: Optional[str]
    timestamp: datetime
    user_agent: str
    ip_address: str
    country: str
    city: str
    device_type: str  # "desktop", "mobile", "tablet"
    browser: str
    os: str
    referrer: Optional[str]
    utm_source: Optional[str]
    utm_medium: Optional[str]
    utm_campaign: Optional[str]
    session_duration: Optional[int]  # in seconds
    bounce: bool
    conversion: bool

class MockDataRequest(BaseModel):
    days: int = 30
    events_per_day: int = 1000
    websites: List[str] = ["example.com", "mystore.com", "blog.site"]

class MultiLangAskRequest(BaseModel):
    question: str
    language: str = "en"  # Default to English
    translate_response: bool = True
    context: Optional[str] = None

class MultiLangAskResponse(BaseModel):
    question: str
    original_language: str
    detected_language: Optional[str] = None
    sql_query: str
    results: List[Dict[str, Any]]
    chart_data: Dict[str, Any]
    success: bool
    error_message: str = ""
    suggestion: str = ""
    response_language: str
    translations: Optional[Dict[str, str]] = None

class AnalyticsReport(BaseModel):
    total_page_views: int
    unique_visitors: int
    avg_session_duration: float
    bounce_rate: float
    conversion_rate: float
    top_pages: List[Dict[str, Any]]
    traffic_sources: Dict[str, int]
    device_breakdown: Dict[str, int]
    geographical_data: Dict[str, int]

# Language-specific query patterns
LANGUAGE_PATTERNS = {
    'en': {
        'total_sales': ['total sales', 'sum of sales', 'sales total', 'revenue total', 'overall sales'],
        'sales_by_customer': ['sales by customer', 'customer sales', 'per customer', 'each customer'],
        'top_customers': ['top customers', 'best customers', 'highest spending', 'biggest spenders'],
        'top_products': ['top products', 'best selling', 'most popular', 'bestsellers'],
        'recent_sales': ['recent sales', 'latest sales', 'new orders', 'last orders'],
        'customer_count': ['number of customers', 'count customers', 'total customers'],
    },
    'es': {
        'total_sales': ['ventas totales', 'suma de ventas', 'total de ventas', 'ingresos totales'],
        'sales_by_customer': ['ventas por cliente', 'ventas de cliente', 'por cliente'],
        'top_customers': ['mejores clientes', 'principales clientes', 'clientes top'],
        'top_products': ['mejores productos', 'productos más vendidos', 'productos populares'],
        'recent_sales': ['ventas recientes', 'últimas ventas', 'nuevos pedidos'],
        'customer_count': ['número de clientes', 'contar clientes', 'total de clientes'],
    },
    'fr': {
        'total_sales': ['ventes totales', 'somme des ventes', 'total des ventes', 'chiffre d\'affaires'],
        'sales_by_customer': ['ventes par client', 'ventes client', 'par client'],
        'top_customers': ['meilleurs clients', 'principaux clients', 'top clients'],
        'top_products': ['meilleurs produits', 'produits les plus vendus', 'produits populaires'],
        'recent_sales': ['ventes récentes', 'dernières ventes', 'nouvelles commandes'],
        'customer_count': ['nombre de clients', 'compter les clients', 'total des clients'],
    },
    'tr': {
        'total_sales': ['toplam satış', 'toplam satışlar', 'satış toplamı', 'toplam gelir', 'genel satışlar', 'satış tutarı'],
        'sales_by_customer': ['müşteri satışları', 'müşteriye göre satış', 'müşteri başına satış', 'her müşteri'],
        'top_customers': ['en iyi müşteriler', 'üst müşteriler', 'en çok harcayan', 'büyük müşteriler', 'top müşteriler'],
        'top_products': ['en iyi ürünler', 'en çok satan', 'popüler ürünler', 'çok satanlar', 'üst ürünler'],
        'top_pages': ['en çok ziyaret edilen sayfalar', 'popüler sayfalar', 'çok görüntülenen sayfalar', 'hangi sayfalar', 'sayfa ziyaretleri', 'en çok tıklanan'],
        'recent_sales': ['son satışlar', 'güncel satışlar', 'yeni siparişler', 'son siparişler', 'yakın satışlar'],
        'customer_count': ['müşteri sayısı', 'müşteri adedi', 'toplam müşteri', 'kaç müşteri'],
        'page_views': ['sayfa görüntülenmeleri', 'sayfa ziyaretleri', 'toplam tıklanma', 'görüntülenme sayısı'],
        'bounce_rate': ['hemen çıkma oranı', 'ayrılma oranı', 'bounce oranı', 'çıkış oranı'],
        'session_duration': ['oturum süresi', 'kalma süresi', 'site süresi', 'ziyaret süresi'],
        'traffic_sources': ['trafik kaynakları', 'ziyaretçi kaynakları', 'nereden geliyorlar', 'trafik'],
        'device_breakdown': ['cihaz dağılımı', 'hangi cihazlardan', 'mobil masaüstü', 'cihaz türleri'],
        'daily_stats': ['günlük istatistikler', 'bugünün verileri', 'güncel durum', 'bugün'],
        'monthly_stats': ['aylık istatistikler', 'bu ay', 'aylık veriler', 'ay özeti'],
    }
}

# Response templates for different languages
RESPONSE_TEMPLATES = {
    'en': {
        'success': "Here are your analytics results:",
        'error': "I encountered an error processing your request:",
        'no_data': "No data found for your query.",
        'suggestion': "Try asking about: sales trends, customer analytics, or product performance."
    },
    'es': {
        'success': "Aquí están los resultados de tu análisis:",
        'error': "Encontré un error al procesar tu solicitud:",
        'no_data': "No se encontraron datos para tu consulta.",
        'suggestion': "Intenta preguntar sobre: tendencias de ventas, análisis de clientes o rendimiento de productos."
    },
    'fr': {
        'success': "Voici vos résultats d'analyse :",
        'error': "J'ai rencontré une erreur lors du traitement de votre demande :",
        'no_data': "Aucune donnée trouvée pour votre requête.",
        'suggestion': "Essayez de demander : tendances des ventes, analyses clients ou performances produits."
    },
    'tr': {
        'success': "İşte analitik sonuçlarınız:",
        'error': "İsteğinizi işlerken bir hata oluştu:",
        'no_data': "Sorgunuz için veri bulunamadı.",
        'suggestion': "Şunları sormayı deneyin: satış trendleri, müşteri analitiği veya ürün performansı."
    }
}

# Mock data generators
class WebAnalyticsGenerator:
    def __init__(self):
        self.pages = [
            {"url": "/", "title": "Home Page"},
            {"url": "/products", "title": "Products"},
            {"url": "/about", "title": "About Us"},
            {"url": "/contact", "title": "Contact"},
            {"url": "/blog", "title": "Blog"},
            {"url": "/pricing", "title": "Pricing"},
            {"url": "/login", "title": "Login"},
            {"url": "/signup", "title": "Sign Up"},
            {"url": "/checkout", "title": "Checkout"},
            {"url": "/dashboard", "title": "Dashboard"},
        ]
        
        self.event_types = ["page_view", "click", "scroll", "form_submit", "download"]
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
        ]
        self.countries = ["United States", "United Kingdom", "Canada", "Germany", "France", "Japan", "Australia", "Brazil"]
        self.cities = ["New York", "London", "Toronto", "Berlin", "Paris", "Tokyo", "Sydney", "São Paulo"]
        self.devices = ["desktop", "mobile", "tablet"]
        self.browsers = ["Chrome", "Safari", "Firefox", "Edge"]
        self.operating_systems = ["Windows", "macOS", "iOS", "Android"]
        self.referrers = ["google.com", "facebook.com", "twitter.com", "linkedin.com", "email", "direct"]

    def generate_session_data(self, website: str, base_time: datetime) -> List[WebsiteClickData]:
        """Generate a complete user session with multiple events"""
        session_id = str(uuid.uuid4())
        user_id = f"user_{random.randint(1000, 9999)}" if random.random() > 0.3 else None
        
        # Session characteristics
        device_type = random.choice(self.devices)
        browser = random.choice(self.browsers)
        os_choice = random.choice(self.operating_systems)
        country = random.choice(self.countries)
        city = random.choice(self.cities)
        
        session_events = []
        current_time = base_time
        session_duration = random.randint(30, 1800)  # 30 seconds to 30 minutes
        
        # Generate 1-10 events per session
        num_events = random.randint(1, 10)
        
        for i in range(num_events):
            page = random.choice(self.pages)
            event_type = random.choice(self.event_types)
            
            event_data = WebsiteClickData(
                session_id=session_id,
                user_id=user_id,
                page_url=f"https://{website}{page['url']}",
                page_title=page['title'],
                event_type=event_type,
                element_id=f"element_{random.randint(1, 100)}" if event_type == "click" else None,
                element_class=f"btn-{random.choice(['primary', 'secondary', 'success'])}" if event_type == "click" else None,
                element_text=f"Button {random.randint(1, 10)}" if event_type == "click" else None,
                timestamp=current_time,
                user_agent=random.choice(self.user_agents),
                ip_address=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
                country=country,
                city=city,
                device_type=device_type,
                browser=browser,
                os=os_choice,
                referrer=random.choice(self.referrers) if random.random() > 0.4 else None,
                utm_source=random.choice(["google", "facebook", "email"]) if random.random() > 0.6 else None,
                utm_medium=random.choice(["cpc", "social", "email"]) if random.random() > 0.6 else None,
                utm_campaign=f"campaign_{random.randint(1, 5)}" if random.random() > 0.7 else None,
                session_duration=session_duration if i == num_events - 1 else None,  # Only set on last event
                bounce=num_events == 1,  # Single page session is a bounce
                conversion=event_type == "form_submit" and page['url'] in ["/signup", "/checkout"]
            )
            
            session_events.append(event_data)
            current_time += timedelta(seconds=random.randint(5, 120))
        
        return session_events

def detect_language(text: str) -> str:
    """Detect language of input text using simple keyword matching"""
    text_lower = text.lower()
    
    # Simple language detection based on common words
    language_keywords = {
        'es': ['ventas', 'clientes', 'productos', 'análisis', 'datos'],
        'fr': ['ventes', 'clients', 'produits', 'analyse', 'données'],
        'de': ['verkäufe', 'kunden', 'produkte', 'analyse', 'daten'],
        'it': ['vendite', 'clienti', 'prodotti', 'analisi', 'dati'],
        'pt': ['vendas', 'clientes', 'produtos', 'análise', 'dados'],
        'zh': ['销售', '客户', '产品', '分析', '数据'],
        'ja': ['売上', '顧客', '製品', '分析', 'データ'],
        'tr': ['satış', 'satışlar', 'müşteri', 'müşteriler', 'ürün', 'ürünler', 'analiz', 'veri', 'toplam', 'sayı', 'adet', 'kaç', 'nedir', 'göster', 'sayfa', 'sayfalar', 'ziyaret', 'tıklama', 'görüntülenme', 'cihaz', 'dağılım', 'oranı', 'süresi', 'hangi', 'en çok', 'popüler', 'iyi', 'trafik', 'kaynak', 'günlük', 'aylık', 'hemen çıkma', 'bounce'],
    }
    
    for lang, keywords in language_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            return lang
    
    return 'en'  # Default to English

def get_response_template(language: str, template_type: str) -> str:
    """Get localized response template"""
    templates = RESPONSE_TEMPLATES.get(language, RESPONSE_TEMPLATES['en'])
    return templates.get(template_type, RESPONSE_TEMPLATES['en'][template_type])

def match_query_pattern(question: str, language: str) -> Optional[str]:
    """Match question to predefined patterns for the given language"""
    question_lower = question.lower()
    patterns = LANGUAGE_PATTERNS.get(language, LANGUAGE_PATTERNS['en'])
    
    for pattern_type, keywords in patterns.items():
        if any(keyword in question_lower for keyword in keywords):
            return pattern_type
    
    return None

def generate_chart_data(results: List[Dict[str, Any]], query_type: str) -> Dict[str, Any]:
    """Generate chart configuration based on query results"""
    if not results:
        return {"type": "empty", "data": []}
    
    # Determine chart type based on data structure
    if len(results) == 1 and len(results[0]) == 1:
        # Single value - display as metric
        key = list(results[0].keys())[0]
        value = results[0][key]
        return {
            "type": "metric",
            "title": key.replace('_', ' ').title(),
            "value": value,
            "format": "number"
        }
    
    elif len(results[0]) == 2:
        # Two columns - good for bar/line charts
        keys = list(results[0].keys())
        return {
            "type": "bar",
            "labels": [str(row[keys[0]]) for row in results],
            "data": [row[keys[1]] for row in results],
            "xAxis": keys[0].replace('_', ' ').title(),
            "yAxis": keys[1].replace('_', ' ').title()
        }
    
    else:
        # Multiple columns - table format
        return {
            "type": "table",
            "columns": list(results[0].keys()),
            "data": results
        }

# Endpoints
@analytics_router.post("/generate-mock-data", response_model=Dict[str, Any])
async def generate_mock_data(request: MockDataRequest, db: Session = Depends(get_db)):
    """Generate and store mock website analytics data"""
    try:
        generator = WebAnalyticsGenerator()
        total_events = 0
        
        # Create website_analytics table if it doesn't exist
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS website_analytics (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(100),
            user_id VARCHAR(100),
            page_url TEXT,
            page_title VARCHAR(500),
            event_type VARCHAR(50),
            element_id VARCHAR(100),
            element_class VARCHAR(100),
            element_text TEXT,
            timestamp TIMESTAMP,
            user_agent TEXT,
            ip_address VARCHAR(45),
            country VARCHAR(100),
            city VARCHAR(100),
            device_type VARCHAR(20),
            browser VARCHAR(50),
            os VARCHAR(50),
            referrer TEXT,
            utm_source VARCHAR(100),
            utm_medium VARCHAR(100),
            utm_campaign VARCHAR(100),
            session_duration INTEGER,
            bounce BOOLEAN,
            conversion BOOLEAN
        )
        """
        
        with engine.begin() as conn:
            conn.execute(text(create_table_sql))
        
        # Generate data for each day
        for day in range(request.days):
            day_start = datetime.now() - timedelta(days=day)
            
            for website in request.websites:
                # Generate sessions for this website/day
                sessions_per_day = request.events_per_day // 5  # Assume 5 events per session on average
                
                for _ in range(sessions_per_day):
                    # Random time during the day
                    random_hour = random.randint(0, 23)
                    random_minute = random.randint(0, 59)
                    event_time = day_start.replace(hour=random_hour, minute=random_minute)
                    
                    session_events = generator.generate_session_data(website, event_time)
                    
                    # Insert events into database
                    for event in session_events:
                        insert_sql = """
                        INSERT INTO website_analytics (
                            session_id, user_id, page_url, page_title, event_type,
                            element_id, element_class, element_text, timestamp,
                            user_agent, ip_address, country, city, device_type,
                            browser, os, referrer, utm_source, utm_medium,
                            utm_campaign, session_duration, bounce, conversion
                        ) VALUES (
                            :session_id, :user_id, :page_url, :page_title, :event_type,
                            :element_id, :element_class, :element_text, :timestamp,
                            :user_agent, :ip_address, :country, :city, :device_type,
                            :browser, :os, :referrer, :utm_source, :utm_medium,
                            :utm_campaign, :session_duration, :bounce, :conversion
                        )
                        """
                        
                        params = {
                            "session_id": event.session_id,
                            "user_id": event.user_id,
                            "page_url": event.page_url,
                            "page_title": event.page_title,
                            "event_type": event.event_type,
                            "element_id": event.element_id,
                            "element_class": event.element_class,
                            "element_text": event.element_text,
                            "timestamp": event.timestamp,
                            "user_agent": event.user_agent,
                            "ip_address": event.ip_address,
                            "country": event.country,
                            "city": event.city,
                            "device_type": event.device_type,
                            "browser": event.browser,
                            "os": event.os,
                            "referrer": event.referrer,
                            "utm_source": event.utm_source,
                            "utm_medium": event.utm_medium,
                            "utm_campaign": event.utm_campaign,
                            "session_duration": event.session_duration,
                            "bounce": event.bounce,
                            "conversion": event.conversion
                        }
                        
                        with engine.begin() as conn:
                            conn.execute(text(insert_sql), params)
                        
                        total_events += 1
        
        return {
            "success": True,
            "message": f"Generated {total_events} analytics events",
            "days": request.days,
            "websites": request.websites,
            "events_generated": total_events
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mock data: {str(e)}")

@analytics_router.get("/analytics-report")
async def get_analytics_report(days: int = 30, db: Session = Depends(get_db)) -> AnalyticsReport:
    """Generate comprehensive analytics report"""
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        # Total page views
        page_views_sql = """
        SELECT COUNT(*) as total_views 
        FROM website_analytics 
        WHERE event_type = 'page_view' AND timestamp >= :start_date
        """
        
        # Unique visitors  
        unique_visitors_sql = """
        SELECT COUNT(DISTINCT session_id) as unique_visitors
        FROM website_analytics 
        WHERE timestamp >= :start_date
        """
        
        # Average session duration
        avg_duration_sql = """
        SELECT AVG(session_duration) as avg_duration
        FROM website_analytics 
        WHERE session_duration IS NOT NULL AND timestamp >= :start_date
        """
        
        # Bounce rate
        bounce_rate_sql = """
        SELECT 
            (COUNT(CASE WHEN bounce = true THEN 1 END) * 100.0 / COUNT(*)) as bounce_rate
        FROM website_analytics 
        WHERE session_duration IS NOT NULL AND timestamp >= :start_date
        """
        
        # Conversion rate
        conversion_rate_sql = """
        SELECT 
            (COUNT(CASE WHEN conversion = true THEN 1 END) * 100.0 / COUNT(DISTINCT session_id)) as conversion_rate
        FROM website_analytics 
        WHERE timestamp >= :start_date
        """
        
        # Top pages
        top_pages_sql = """
        SELECT page_url, page_title, COUNT(*) as views
        FROM website_analytics 
        WHERE event_type = 'page_view' AND timestamp >= :start_date
        GROUP BY page_url, page_title
        ORDER BY views DESC
        LIMIT 10
        """
        
        # Traffic sources
        traffic_sources_sql = """
        SELECT 
            COALESCE(referrer, 'Direct') as source, 
            COUNT(DISTINCT session_id) as visitors
        FROM website_analytics 
        WHERE timestamp >= :start_date
        GROUP BY referrer
        ORDER BY visitors DESC
        """
        
        # Device breakdown
        device_breakdown_sql = """
        SELECT device_type, COUNT(DISTINCT session_id) as visitors
        FROM website_analytics 
        WHERE timestamp >= :start_date
        GROUP BY device_type
        ORDER BY visitors DESC
        """
        
        # Geographical data
        geo_data_sql = """
        SELECT country, COUNT(DISTINCT session_id) as visitors
        FROM website_analytics 
        WHERE timestamp >= :start_date
        GROUP BY country
        ORDER BY visitors DESC
        LIMIT 10
        """
        
        params = {"start_date": start_date}
        
        with engine.begin() as conn:
            # Execute all queries
            total_views = conn.execute(text(page_views_sql), params).scalar() or 0
            unique_visitors = conn.execute(text(unique_visitors_sql), params).scalar() or 0
            avg_duration = conn.execute(text(avg_duration_sql), params).scalar() or 0.0
            bounce_rate = conn.execute(text(bounce_rate_sql), params).scalar() or 0.0
            conversion_rate = conn.execute(text(conversion_rate_sql), params).scalar() or 0.0
            
            top_pages = [dict(row._mapping) for row in conn.execute(text(top_pages_sql), params)]
            traffic_sources = {row.source: row.visitors for row in conn.execute(text(traffic_sources_sql), params)}
            device_breakdown = {row.device_type: row.visitors for row in conn.execute(text(device_breakdown_sql), params)}
            geo_data = {row.country: row.visitors for row in conn.execute(text(geo_data_sql), params)}
        
        return AnalyticsReport(
            total_page_views=total_views,
            unique_visitors=unique_visitors,
            avg_session_duration=round(avg_duration, 2),
            bounce_rate=round(bounce_rate, 2),
            conversion_rate=round(conversion_rate, 2),
            top_pages=top_pages,
            traffic_sources=traffic_sources,
            device_breakdown=device_breakdown,
            geographical_data=geo_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics report: {str(e)}")

@analytics_router.post("/ask-multilang", response_model=MultiLangAskResponse)
async def ask_multilang_analytics(request: MultiLangAskRequest, db: Session = Depends(get_db)):
    """AI-powered analytics with multi-language support"""
    try:
        # Detect language if not specified or if different from input
        detected_language = detect_language(request.question)
        working_language = request.language if request.language in SUPPORTED_LANGUAGES else detected_language
        
        # Check if we have a pattern match for quick responses
        pattern_type = match_query_pattern(request.question, working_language)
        
        sql_query = ""
        results = []
        
        if pattern_type:
            # Use predefined query for common patterns
            if pattern_type == "total_sales":
                sql_query = "SELECT SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END) as total_conversions FROM website_analytics"
            elif pattern_type == "top_customers":
                sql_query = "SELECT user_id, COUNT(*) as page_views FROM website_analytics WHERE user_id IS NOT NULL GROUP BY user_id ORDER BY page_views DESC LIMIT 10"
            elif pattern_type == "top_pages":
                sql_query = "SELECT page_url, page_title, COUNT(*) as visit_count FROM website_analytics GROUP BY page_url, page_title ORDER BY visit_count DESC LIMIT 10"
            elif pattern_type == "recent_sales":
                sql_query = "SELECT * FROM website_analytics WHERE conversion = true ORDER BY timestamp DESC LIMIT 10"
            elif pattern_type == "customer_count":
                sql_query = "SELECT COUNT(DISTINCT user_id) as unique_users FROM website_analytics WHERE user_id IS NOT NULL"
            elif pattern_type == "page_views":
                sql_query = "SELECT COUNT(*) as total_page_views FROM website_analytics WHERE event_type = 'page_view'"
            elif pattern_type == "bounce_rate":
                sql_query = "SELECT (COUNT(CASE WHEN bounce = true THEN 1 END) * 100.0 / COUNT(*)) as bounce_rate FROM website_analytics"
            elif pattern_type == "session_duration":
                sql_query = "SELECT AVG(session_duration) as avg_session_duration FROM website_analytics WHERE session_duration IS NOT NULL"
            elif pattern_type == "traffic_sources":
                sql_query = "SELECT country, COUNT(*) as visitor_count FROM website_analytics GROUP BY country ORDER BY visitor_count DESC LIMIT 10"
            elif pattern_type == "device_breakdown":
                sql_query = "SELECT device_type, COUNT(*) as usage_count FROM website_analytics GROUP BY device_type ORDER BY usage_count DESC"
            elif pattern_type == "daily_stats":
                sql_query = "SELECT DATE(timestamp) as date, COUNT(*) as daily_visits FROM website_analytics WHERE DATE(timestamp) = CURRENT_DATE GROUP BY DATE(timestamp)"
            elif pattern_type == "monthly_stats":
                sql_query = "SELECT DATE_TRUNC('month', timestamp) as month, COUNT(*) as monthly_visits FROM website_analytics WHERE DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE) GROUP BY DATE_TRUNC('month', timestamp)"
            else:
                sql_query = "SELECT COUNT(*) as total_events FROM website_analytics"
        else:
            # Use AI to generate SQL for complex queries
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise HTTPException(status_code=500, detail="OpenAI API key not configured")
                
            llm = ChatOpenAI(
                model="gpt-3.5-turbo",
                api_key=SecretStr(api_key),
                temperature=0
            )
            
            # Translate question to English if needed for AI processing
            question_for_ai = request.question
            if working_language != 'en':
                translate_prompt = f"Translate this analytics question to English: {request.question}"
                translation_response = llm.invoke([HumanMessage(content=translate_prompt)])
                if hasattr(translation_response, 'content'):
                    question_for_ai = str(translation_response.content)
                else:
                    question_for_ai = str(translation_response)
            
            # Generate SQL
            schema_info = """
            Available table: website_analytics
            Columns: session_id, user_id, page_url, page_title, event_type, timestamp, 
                    country, city, device_type, browser, conversion, bounce, session_duration
            """
            
            prompt = f"""
            Given this database schema:
            {schema_info}
            
            Generate a SQL query to answer: {question_for_ai}
            
            Return only the SQL query, no explanations.
            """
            
            response = llm.invoke([HumanMessage(content=prompt)])
            
            # Handle different response types
            if hasattr(response, 'content'):
                sql_query = str(response.content).strip()
            else:
                sql_query = str(response).strip()
            
            # Clean up the SQL query
            if sql_query.startswith("```sql"):
                sql_query = sql_query[6:]
            if sql_query.endswith("```"):
                sql_query = sql_query[:-3]
            sql_query = sql_query.strip()
        
        # Execute the query
        with engine.begin() as conn:
            result = conn.execute(text(sql_query))
            results = [dict(row._mapping) for row in result]
        
        # Convert Decimal objects to float for JSON serialization
        for row in results:
            for key, value in row.items():
                if hasattr(value, '__class__') and 'Decimal' in str(value.__class__):
                    row[key] = float(value)
        
        # Generate chart data
        chart_data = generate_chart_data(results, pattern_type or "custom")
        
        # Log the query with language info
        query_log = QueryLog(
            question=request.question,
            sql_query=sql_query,
            result_json=results
        )
        db.add(query_log)
        db.commit()
        
        # Prepare response
        response_data = MultiLangAskResponse(
            question=request.question,
            original_language=working_language,
            detected_language=detected_language if detected_language != request.language else None,
            sql_query=sql_query,
            results=results,
            chart_data=chart_data,
            success=True,
            response_language=working_language,
            suggestion=get_response_template(working_language, 'suggestion') if not results else ""
        )
        
        # Add translations if requested
        if request.translate_response and working_language != 'en':
            response_data.translations = {
                'en': get_response_template('en', 'success' if results else 'no_data')
            }
        
        return response_data
        
    except Exception as e:
        logging.error(f"Error in multilang analytics: {str(e)}")
        
        # Log failed query
        try:
            query_log = QueryLog(
                question=request.question,
                sql_query=sql_query or "",
                result_json=[]
            )
            db.add(query_log)
            db.commit()
        except:
            pass
        
        error_message = get_response_template(request.language, 'error')
        return MultiLangAskResponse(
            question=request.question,
            original_language=request.language,
            sql_query=sql_query or "",
            results=[],
            chart_data={"type": "empty", "data": []},
            success=False,
            error_message=f"{error_message} {str(e)}",
            response_language=request.language,
            suggestion=get_response_template(request.language, 'suggestion')
        )

@analytics_router.get("/summary")
async def get_analytics_summary(db: Session = Depends(get_db)):
    """Get analytics summary with key metrics"""
    try:
        summary_sql = """
        SELECT 
            COUNT(*) as total_events,
            COUNT(DISTINCT session_id) as total_sessions,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN conversion = true THEN 1 END) as conversions,
            COUNT(CASE WHEN bounce = true THEN 1 END) as bounces,
            AVG(session_duration) as avg_session_duration
        FROM website_analytics
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        """
        
        with engine.begin() as conn:
            result = conn.execute(text(summary_sql)).fetchone()
            
            if result:
                return {
                    "total_events": result.total_events or 0,
                    "total_sessions": result.total_sessions or 0,
                    "unique_users": result.unique_users or 0,
                    "conversions": result.conversions or 0,
                    "bounces": result.bounces or 0,
                    "avg_session_duration": round(result.avg_session_duration or 0, 2),
                    "conversion_rate": round((result.conversions or 0) / max(result.total_sessions or 1, 1) * 100, 2),
                    "bounce_rate": round((result.bounces or 0) / max(result.total_sessions or 1, 1) * 100, 2)
                }
            else:
                return {
                    "total_events": 0,
                    "total_sessions": 0,
                    "unique_users": 0,
                    "conversions": 0,
                    "bounces": 0,
                    "avg_session_duration": 0,
                    "conversion_rate": 0,
                    "bounce_rate": 0
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics summary: {str(e)}")

@analytics_router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "total": len(SUPPORTED_LANGUAGES)
    }
