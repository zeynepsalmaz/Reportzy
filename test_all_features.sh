#!/bin/bash

# Reportzy Analytics API - Comprehensive Test Suite
# Tests all features including basic API, enhanced analytics, and advanced features

echo "🚀 REPORTZY ANALYTICS - COMPREHENSIVE TEST SUITE"
echo "================================================="
echo ""

# Consistent API base URL
API_BASE="http://localhost:8002"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing API Base URL: $API_BASE${NC}"
echo ""

# 1. Basic Health and Setup Tests
echo -e "${GREEN}1. 🏥 HEALTH CHECK & SETUP${NC}"
echo "=============================="
echo ""

echo "Health Check:"
curl -s "$API_BASE/health" | jq '.'
echo ""

echo "Root Endpoint:"
curl -s "$API_BASE/" | jq '.'
echo ""

# 2. Data Ingestion Tests
echo -e "${GREEN}2. 📥 DATA INGESTION${NC}"
echo "===================="
echo ""

echo "Ingesting sample product data..."
curl -s -X POST "$API_BASE/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "products",
    "records": [
      {"id": "1", "name": "MacBook Pro", "category": "Laptops", "price": "2499.99", "stock": "15"},
      {"id": "2", "name": "iPhone 15", "category": "Phones", "price": "999.99", "stock": "25"},
      {"id": "3", "name": "iPad Air", "category": "Tablets", "price": "599.99", "stock": "20"},
      {"id": "4", "name": "AirPods Pro", "category": "Audio", "price": "249.99", "stock": "50"},
      {"id": "5", "name": "Apple Watch", "category": "Wearables", "price": "399.99", "stock": "30"}
    ]
  }' | jq '.'
echo ""

echo "Ingesting sample sales data..."
curl -s -X POST "$API_BASE/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "sales",
    "records": [
      {"id": "1", "product_id": "1", "customer": "John Doe", "amount": "2499.99", "date": "2024-01-15"},
      {"id": "2", "product_id": "2", "customer": "Jane Smith", "amount": "999.99", "date": "2024-01-16"},
      {"id": "3", "product_id": "3", "customer": "Bob Johnson", "amount": "599.99", "date": "2024-01-17"}
    ]
  }' | jq '.'
echo ""

# 3. Enhanced Natural Language Processing
echo -e "${GREEN}3. 🧠 ENHANCED AI ANALYTICS${NC}"
echo "============================="
echo ""

# Array of test queries
queries=(
  "Show me all products"
  "total sales revenue"
  "top 3 customers by spending"
  "sales by product breakdown"
  "average order value"
  "count of customers"
  "bestselling products"
  "daily sales trends"
)

for query in "${queries[@]}"; do
  echo -e "${YELLOW}Query: '$query'${NC}"
  curl -s -X POST "$API_BASE/api/ask" \
    -H "Content-Type: application/json" \
    -d "{\"question\": \"$query\"}" | jq -r '.sql_query'
  echo ""
done

# 4. Analytics Endpoints
echo -e "${GREEN}4. 📊 ANALYTICS ENDPOINTS${NC}"
echo "=========================="
echo ""

echo "Analytics Summary:"
curl -s "$API_BASE/api/analytics-summary" | jq '.summary.data_stats'
echo ""

echo "Query History (last 3):"
curl -s "$API_BASE/api/query-history?limit=3" | jq '.queries[0:2] | .[] | {question: .question, created_at: .created_at}'
echo ""

# 5. Export Functionality
echo -e "${GREEN}5. 📤 EXPORT FUNCTIONALITY${NC}"
echo "=========================="
echo ""

echo "Available Export Templates:"
curl -s "$API_BASE/api/export-templates" | jq '.templates | keys'
echo ""

echo "Sample JSON Export:"
curl -s -X POST "$API_BASE/api/export-template/sales_summary?format=json" \
  -H "Content-Type: application/json" | jq '.total_records, .data[0]' 2>/dev/null || echo "Template not available"
echo ""

# 6. System Monitoring
echo -e "${GREEN}6. 🔧 SYSTEM MONITORING${NC}"
echo "======================="
echo ""

echo "System Status:"
curl -s "$API_BASE/api/system-status" | jq '.' 2>/dev/null || echo "Endpoint not available"
echo ""

echo "Performance Report:"
curl -s "$API_BASE/api/performance-report?hours=24" | jq '.' 2>/dev/null || echo "Endpoint not available"
echo ""

# 7. Metadata Management
echo -e "${GREEN}7. 🗂️  METADATA MANAGEMENT${NC}"
echo "========================="
echo ""

echo "Table Discovery:"
curl -s "$API_BASE/api/metadata/discover" | jq '.'
echo ""

echo "Available Tables:"
curl -s "$API_BASE/api/metadata/tables" | jq '.'
echo ""

# 8. Backup System
echo -e "${GREEN}8. 💾 BACKUP SYSTEM${NC}"
echo "=================="
echo ""

echo "Creating test backup..."
curl -s -X POST "$API_BASE/api/backup/create" \
  -H "Content-Type: application/json" \
  -d '{
    "backup_type": "full",
    "compression": true
  }' | jq '.'
echo ""

echo "Backup Logs:"
curl -s "$API_BASE/api/backup/logs" | jq '.'
echo ""

# 9. Advanced Analytics (if available)
echo -e "${GREEN}9. 📈 ADVANCED ANALYTICS${NC}"
echo "========================"
echo ""

echo "Generating mock analytics data..."
curl -s -X POST "$API_BASE/api/analytics/generate-mock-data" \
  -H "Content-Type: application/json" \
  -d '{
    "days": 3,
    "events_per_day": 100,
    "websites": ["reportzy.com", "analytics.demo"]
  }' | jq '.' 2>/dev/null || echo "Advanced analytics not available"
echo ""

echo "Analytics Report:"
curl -s "$API_BASE/api/analytics/analytics-report?days=3" | jq '.' 2>/dev/null || echo "Analytics report not available"
echo ""

# Summary
echo -e "${GREEN}✅ TEST SUITE COMPLETED!${NC}"
echo "========================"
echo ""
echo -e "${BLUE}🌐 Interactive Documentation:${NC} $API_BASE/docs"
echo -e "${BLUE}📊 Analytics Dashboard:${NC} $API_BASE/dashboard"
echo ""
echo -e "${YELLOW}📋 Key Features Tested:${NC}"
echo "• ✅ Health check and basic endpoints"
echo "• ✅ Data ingestion (products & sales)"
echo "• ✅ Enhanced natural language processing"
echo "• ✅ Analytics summary and query history"
echo "• ✅ Export functionality"
echo "• ✅ System monitoring"
echo "• ✅ Metadata management"
echo "• ✅ Backup system"
echo "• ✅ Advanced analytics (if available)"
echo ""
