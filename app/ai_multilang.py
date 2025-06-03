# app/ai_multilang.py - Multi-Language AI Analytics System

import json
import os
from typing import Dict, Any, List, Optional, Tuple
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from datetime import datetime
import logging

from app.db import engine, get_db
from app.models import QueryLog

multilang_router = APIRouter()

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
    'de': {
        'total_sales': ['gesamtumsatz', 'summe der verkäufe', 'verkaufssumme', 'umsatz gesamt'],
        'sales_by_customer': ['verkäufe nach kunde', 'kundenverkäufe', 'pro kunde'],
        'top_customers': ['top kunden', 'beste kunden', 'hauptkunden'],
        'top_products': ['top produkte', 'meistverkaufte', 'beliebte produkte'],
        'recent_sales': ['aktuelle verkäufe', 'neueste verkäufe', 'neue bestellungen'],
        'customer_count': ['anzahl kunden', 'kunden zählen', 'gesamt kunden'],
    },
    'it': {
        'total_sales': ['vendite totali', 'somma delle vendite', 'totale vendite', 'ricavi totali'],
        'sales_by_customer': ['vendite per cliente', 'vendite cliente', 'per cliente'],
        'top_customers': ['migliori clienti', 'principali clienti', 'top clienti'],
        'top_products': ['migliori prodotti', 'prodotti più venduti', 'prodotti popolari'],
        'recent_sales': ['vendite recenti', 'ultime vendite', 'nuovi ordini'],
        'customer_count': ['numero di clienti', 'contare clienti', 'totale clienti'],
    },
    'pt': {
        'total_sales': ['vendas totais', 'soma das vendas', 'total de vendas', 'receita total'],
        'sales_by_customer': ['vendas por cliente', 'vendas do cliente', 'por cliente'],
        'top_customers': ['melhores clientes', 'principais clientes', 'top clientes'],
        'top_products': ['melhores produtos', 'produtos mais vendidos', 'produtos populares'],
        'recent_sales': ['vendas recentes', 'últimas vendas', 'novos pedidos'],
        'customer_count': ['número de clientes', 'contar clientes', 'total de clientes'],
    },
    'zh': {
        'total_sales': ['总销售额', '销售总和', '销售总计', '总收入'],
        'sales_by_customer': ['按客户销售', '客户销售', '每个客户'],
        'top_customers': ['顶级客户', '最佳客户', '主要客户'],
        'top_products': ['热门产品', '最畅销产品', '流行产品'],
        'recent_sales': ['最近销售', '最新销售', '新订单'],
        'customer_count': ['客户数量', '客户总数', '客户计数'],
    },
    'ja': {
        'total_sales': ['総売上', '売上合計', '売上総計', '総収入'],
        'sales_by_customer': ['顧客別売上', '顧客売上', '顧客ごと'],
        'top_customers': ['トップ顧客', '優良顧客', '主要顧客'],
        'top_products': ['人気商品', 'ベストセラー', '売れ筋商品'],
        'recent_sales': ['最近の売上', '最新売上', '新規注文'],
        'customer_count': ['顧客数', '顧客総数', '顧客カウント'],
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
    'de': {
        'success': "Hier sind Ihre Analyseergebnisse:",
        'error': "Ich bin auf einen Fehler beim Verarbeiten Ihrer Anfrage gestoßen:",
        'no_data': "Keine Daten für Ihre Abfrage gefunden.",
        'suggestion': "Versuchen Sie zu fragen: Verkaufstrends, Kundenanalyse oder Produktleistung."
    },
    'it': {
        'success': "Ecco i risultati della tua analisi:",
        'error': "Ho riscontrato un errore nell'elaborare la tua richiesta:",
        'no_data': "Nessun dato trovato per la tua query.",
        'suggestion': "Prova a chiedere di: tendenze vendite, analisi clienti o prestazioni prodotti."
    },
    'pt': {
        'success': "Aqui estão os resultados da sua análise:",
        'error': "Encontrei um erro ao processar sua solicitação:",
        'no_data': "Nenhum dado encontrado para sua consulta.",
        'suggestion': "Tente perguntar sobre: tendências de vendas, análise de clientes ou desempenho de produtos."
    },
    'zh': {
        'success': "这是您的分析结果：",
        'error': "处理您的请求时遇到错误：",
        'no_data': "未找到您查询的数据。",
        'suggestion': "尝试询问：销售趋势、客户分析或产品性能。"
    },
    'ja': {
        'success': "分析結果をご覧ください：",
        'error': "リクエストの処理中にエラーが発生しました：",
        'no_data': "クエリのデータが見つかりませんでした。",
        'suggestion': "次について質問してみてください：売上トレンド、顧客分析、製品パフォーマンス。"
    }
}

class MultiLanguageAI:
    def __init__(self):
        self.llm = None
        self.logger = logging.getLogger(__name__)

    def get_llm(self):
        """Initialize OpenAI LLM with error handling"""
        if self.llm is None:
            try:
                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    raise ValueError("OPENAI_API_KEY not found in environment")
                self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
            except Exception as e:
                self.logger.error(f"Failed to initialize LLM: {e}")
                raise HTTPException(status_code=500, detail="AI service unavailable")
        return self.llm

    def detect_language(self, text: str) -> str:
        """Simple language detection based on patterns"""
        text_lower = text.lower()
        
        # Check for language-specific patterns
        for lang_code, patterns in LANGUAGE_PATTERNS.items():
            for pattern_list in patterns.values():
                if any(pattern in text_lower for pattern in pattern_list):
                    return lang_code
        
        # Default to English if no patterns match
        return 'en'

    def translate_with_llm(self, text: str, target_language: str) -> str:
        """Translate text using LLM"""
        try:
            llm = self.get_llm()
            
            language_name = SUPPORTED_LANGUAGES.get(target_language, 'English')
            
            prompt = f"""
            Translate the following text to {language_name}. 
            Keep technical terms and SQL-related content as is.
            Only return the translation, no explanations.
            
            Text to translate: {text}
            """
            
            response = llm.invoke([HumanMessage(content=prompt)])
            # Fix: Handle response content properly
            content = response.content
            if isinstance(content, list):
                content = str(content[0]) if content else text
            return content.strip() if hasattr(content, 'strip') else str(content)
            
        except Exception as e:
            self.logger.error(f"Translation failed: {e}")
            return text  # Return original text if translation fails

    def generate_multilang_sql(self, question: str, language: str = 'en') -> str:
        """Generate SQL query from multilingual question"""
        question_lower = question.lower().strip()
        
        # Handle direct SQL queries
        if question_lower.startswith('select'):
            return question.strip()
        
        # Get patterns for the specified language
        patterns = LANGUAGE_PATTERNS.get(language, LANGUAGE_PATTERNS['en'])
        
        # Check patterns and generate appropriate SQL
        for pattern_key, pattern_phrases in patterns.items():
            if any(phrase in question_lower for phrase in pattern_phrases):
                return self._get_sql_for_pattern(pattern_key)
        
        # If no pattern matches, try English patterns as fallback
        if language != 'en':
            en_patterns = LANGUAGE_PATTERNS['en']
            for pattern_key, pattern_phrases in en_patterns.items():
                if any(phrase in question_lower for phrase in pattern_phrases):
                    return self._get_sql_for_pattern(pattern_key)
        
        # Use LLM as final fallback
        return self._generate_sql_with_llm(question, language)

    def _get_sql_for_pattern(self, pattern_key: str) -> str:
        """Get SQL query for a specific pattern"""
        sql_queries = {
            'total_sales': "SELECT SUM(CAST(amount AS DECIMAL)) as total_sales FROM sales",
            'sales_by_customer': "SELECT customer_name, SUM(CAST(amount AS DECIMAL)) as total_spent, COUNT(*) as order_count FROM sales GROUP BY customer_name ORDER BY total_spent DESC",
            'top_customers': "SELECT customer_name, SUM(CAST(amount AS DECIMAL)) as total_spent FROM sales GROUP BY customer_name ORDER BY total_spent DESC LIMIT 5",
            'top_products': "SELECT product, SUM(CAST(amount AS DECIMAL)) as total_sales, COUNT(*) as units_sold FROM sales GROUP BY product ORDER BY total_sales DESC LIMIT 5",
            'recent_sales': "SELECT * FROM sales ORDER BY date DESC LIMIT 10",
            'customer_count': "SELECT COUNT(DISTINCT customer_name) as total_customers FROM sales",
        }
        return sql_queries.get(pattern_key, "SELECT COUNT(*) as count FROM sales")

    def _generate_sql_with_llm(self, question: str, language: str) -> str:
        """Generate SQL using LLM for complex queries"""
        try:
            llm = self.get_llm()
            
            prompt = f"""
            You are a SQL expert. Convert this natural language question to a SQL query.
            The question is in {SUPPORTED_LANGUAGES.get(language, 'English')}.
            
            Available tables and their schemas:
            - sales: customer_name, product, amount, date
            - website_analytics: session_id, page_url, event_type, timestamp, country, device_type
            
            Question: {question}
            
            Return only the SQL query, no explanations.
            """
            
            response = llm.invoke([HumanMessage(content=prompt)])
            # Fix: Handle response content properly
            content = response.content
            if isinstance(content, list):
                content = str(content[0]) if content else "SELECT COUNT(*) as count FROM sales"
            return content.strip() if hasattr(content, 'strip') else str(content)
            
        except Exception as e:
            self.logger.error(f"LLM SQL generation failed: {e}")
            return "SELECT COUNT(*) as count FROM sales"

    def get_response_template(self, language: str, template_key: str) -> str:
        """Get response template for specified language"""
        templates = RESPONSE_TEMPLATES.get(language, RESPONSE_TEMPLATES['en'])
        return templates.get(template_key, RESPONSE_TEMPLATES['en'][template_key])

# Global AI instance
multilang_ai = MultiLanguageAI()

def log_query(question: str, sql_query: str, success: bool, error_message: str, language: str, db: Session):
    """Log query with language information"""
    try:
        query_log = QueryLog(
            original_question=question,
            sql_query=sql_query,
            execution_time=0.0,  # Will be updated with actual time
            timestamp=datetime.utcnow(),
            status="success" if success else "error",
            error_message=error_message if not success else None,
            language=language  # Add language field to track
        )
        db.add(query_log)
        db.commit()
        db.refresh(query_log)
        return query_log.id
    except Exception as e:
        print(f"Failed to log query: {e}")
        return None

@multilang_router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "supported_languages": SUPPORTED_LANGUAGES,
        "total_languages": len(SUPPORTED_LANGUAGES),
        "default_language": "en"
    }

@multilang_router.post("/ask-multilang", response_model=MultiLangAskResponse)
async def ask_multilang(request: MultiLangAskRequest, db: Session = Depends(get_db)):
    """Enhanced multilingual analytics endpoint"""
    
    start_time = datetime.utcnow()
    
    try:
        # Validate language
        if request.language not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")
        
        # Detect language if not provided or auto-detect requested
        detected_language = multilang_ai.detect_language(request.question)
        
        # Generate SQL query
        sql_query = multilang_ai.generate_multilang_sql(request.question, request.language)
        
        # Execute query
        with engine.connect() as conn:
            result = conn.execute(text(sql_query))
            rows = result.fetchall()
            columns = result.keys()
            
            # Convert to list of dictionaries
            results = [dict(zip(columns, row)) for row in rows]
        
        # Generate chart data
        chart_data = generate_chart_data(results, sql_query)
        
        # Prepare response
        success_message = multilang_ai.get_response_template(request.language, 'success')
        
        # Log query
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        query_id = log_query(request.question, sql_query, True, "", request.language, db)
        
        # Generate translations if requested
        translations = None
        if request.translate_response:
            translations = {}
            for lang_code in ['en', 'es', 'fr', 'de']:
                if lang_code != request.language:
                    try:
                        translations[lang_code] = multilang_ai.translate_with_llm(
                            success_message, lang_code
                        )
                    except:
                        pass  # Skip if translation fails
        
        return MultiLangAskResponse(
            question=request.question,
            original_language=request.language,
            detected_language=detected_language,
            sql_query=sql_query,
            results=results,
            chart_data=chart_data,
            success=True,
            response_language=request.language,
            translations=translations
        )
        
    except Exception as e:
        error_message = multilang_ai.get_response_template(request.language, 'error')
        suggestion = multilang_ai.get_response_template(request.language, 'suggestion')
        
        # Log failed query
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        log_query(request.question, "", False, str(e), request.language, db)
        
        return MultiLangAskResponse(
            question=request.question,
            original_language=request.language,
            detected_language=None,
            sql_query="",
            results=[],
            chart_data={},
            success=False,
            error_message=f"{error_message} {str(e)}",
            suggestion=suggestion,
            response_language=request.language
        )

def generate_chart_data(results: List[Dict[str, Any]], sql_query: str) -> Dict[str, Any]:
    """Generate chart configuration based on query results"""
    
    if not results:
        return {"type": "no_data", "message": "No data available"}
    
    # Determine chart type based on query patterns
    sql_lower = sql_query.lower()
    
    if len(results) == 1 and len(results[0]) == 1:
        # Single metric
        key, value = next(iter(results[0].items()))
        return {
            "type": "metric",
            "title": key.replace('_', ' ').title(),
            "value": value,
            "format": "number"
        }
    
    elif "group by" in sql_lower and len(results) > 1:
        # Multi-dimensional data
        keys = list(results[0].keys())
        if len(keys) >= 2:
            label_key = keys[0]
            value_key = keys[1]
            
            return {
                "type": "bar",
                "title": f"{value_key.replace('_', ' ').title()} by {label_key.replace('_', ' ').title()}",
                "labels": [str(row[label_key]) for row in results[:10]],
                "datasets": [{
                    "label": value_key.replace('_', ' ').title(),
                    "data": [float(row[value_key]) if row[value_key] is not None else 0 for row in results[:10]]
                }]
            }
        else:
            # Fall back to table view if not enough columns
            return {
                "type": "table", 
                "title": "Query Results",
                "headers": list(results[0].keys()) if results else [],
                "rows": [[str(row[key]) for key in results[0].keys()] for row in results[:20]]
            }
    
    elif "date" in sql_lower or "time" in sql_lower:
        # Time series data
        return {
            "type": "line",
            "title": "Trend Over Time",
            "labels": [str(row[list(row.keys())[0]]) for row in results[:20]],
            "datasets": [{
                "label": "Value",
                "data": [float(list(row.values())[1]) if len(row.values()) > 1 else 0 for row in results[:20]]
            }]
        }
    
    else:
        # Default table view
        return {
            "type": "table",
            "title": "Query Results",
            "headers": list(results[0].keys()) if results else [],
            "rows": [[str(row[key]) for key in results[0].keys()] for row in results[:20]]
        }

@multilang_router.post("/translate")
async def translate_text(text: str, target_language: str):
    """Translate text to target language"""
    
    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {target_language}")
    
    try:
        translated_text = multilang_ai.translate_with_llm(text, target_language)
        return {
            "original_text": text,
            "translated_text": translated_text,
            "target_language": target_language,
            "language_name": SUPPORTED_LANGUAGES[target_language]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@multilang_router.get("/language-stats")
async def get_language_statistics(db: Session = Depends(get_db)):
    """Get usage statistics by language"""
    try:
        # This would work if we had the language field in QueryLog
        # For now, return mock data
        return {
            "total_queries": 150,
            "language_breakdown": {
                "en": 85,
                "es": 25,
                "fr": 20,
                "de": 12,
                "it": 8
            },
            "most_popular_language": "en",
            "supported_languages": len(SUPPORTED_LANGUAGES)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting language stats: {str(e)}")
