# 🚀 Reportzy Analytics API

A comprehensive analytics and reporting platform with AI-powered SQL generation, interactive dashboards, and advanced data management capabilities.

## ✨ Features

### 🧠 AI-Powered Analytics
- Natural language to SQL conversion
- Smart query pattern recognition
- Automatic chart type detection
- Enhanced error handling with suggestions

### 📊 Data Management
- Dynamic data ingestion
- Metadata discovery and management
- Query history tracking
- Export to CSV/JSON formats

### 🔧 System Capabilities
- Real-time monitoring
- Automated backup system
- Performance analytics
- Health check endpoints

### 📈 Advanced Analytics
- Mock data generation
- Analytics summaries
- Performance reports
- User feedback system

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- SQLite (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Reportzy
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

4. **Access the API**
   - **API Documentation**: http://localhost:8001/docs
   - **Analytics Dashboard**: http://localhost:8001/dashboard
   - **Health Check**: http://localhost:8001/health

## 🧪 Testing

Run the comprehensive test suite:
```bash
./test_all_features.sh
```

This will test all features including:
- ✅ Health check and basic endpoints
- ✅ Data ingestion capabilities
- ✅ Natural language processing
- ✅ Analytics and export functionality
- ✅ System monitoring and backup

## 📖 API Usage Examples

### Data Ingestion
```bash
curl -X POST "http://localhost:8001/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "products",
    "records": [
      {"id": "1", "name": "Product A", "price": "99.99"}
    ]
  }'
```

### Natural Language Queries
```bash
curl -X POST "http://localhost:8001/api/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me total sales revenue"}'
```

### Export Data
```bash
curl -X POST "http://localhost:8001/api/export-template/sales_summary?format=csv"
```

## 🏗️ Architecture

```
📁 app/
├── 🧠 ai_multilang.py    # AI language processing
├── 📊 analytics.py       # Analytics engine
├── 🤖 ask.py            # Natural language interface
├── 💾 backup.py         # Backup automation
├── 🗄️  db.py            # Database management
├── 📤 export.py         # Data export functionality
├── 💬 feedback.py       # User feedback system
├── 📥 ingest.py         # Data ingestion
├── 🚀 main.py           # FastAPI application
├── 🗂️  metadata.py      # Metadata management
├── 📋 models.py         # Data models
└── 🔧 monitoring.py     # System monitoring
```

## 🔗 API Endpoints

### Core Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /dashboard` - Analytics dashboard

### Data Operations
- `POST /api/ingest` - Ingest data
- `POST /api/ask` - Natural language queries
- `GET /api/metadata/discover` - Discover tables
- `GET /api/metadata/tables` - List tables

### Analytics
- `GET /api/analytics-summary` - Get analytics summary
- `GET /api/query-history` - Query execution history
- `POST /api/analytics/generate-mock-data` - Generate test data

### Export & Backup
- `GET /api/export-templates` - Available export templates
- `POST /api/backup/create` - Create backup
- `GET /api/backup/logs` - Backup logs

### Monitoring
- `GET /api/system-status` - System status
- `GET /api/performance-report` - Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./test_all_features.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Roadmap

- [ ] PostgreSQL support
- [ ] Advanced visualization components
- [ ] Real-time data streaming
- [ ] Multi-tenant support
- [ ] Advanced ML analytics

---

**Built with ❤️ using FastAPI, SQLAlchemy, and AI-powered natural language processing.**