# 🚀 Reportzy Analytics Platform

A modern analytics platform that allows users to upload Excel/CSV files, automatically re## 🏗️ Architecture

```
📁 Reportzy/
├── 🚀 app/
│   ├── __init__.py         # Package initialization
│   ├── main.py             # FastAPI application & routing
│   ├── db.py               # Database connection & initialization  
│   ├── models.py           # SQLAlchemy data models
│   ├── file_upload.py      # File upload & table creation
│   ├── ai_insights.py      # AI analysis & recommendations
│   ├── ask.py              # Natural language SQL interface
│   ├── metadata.py         # Table metadata management
│   └── export.py           # Data export functionality
├── 📊 dashboard.html       # Modern frontend dashboard
├── 🔧 requirements.txt     # Python dependencies
├── 🚀 start.sh            # Application startup script
├── 🧪 test_endpoints.py   # API endpoint testing script
├── 📖 README.md           # Project documentation (this file)
├── 🗄️ reportzy.db         # SQLite database (auto-generated)
└── 📁 venv/               # Virtual environment (auto-generated)
``` database tables, and generate AI-powered SQL queries and visualizations. Features a professional UX-friendly dashboard with sidebar navigation, query history, and AI insights.

## ✨ Key Features

### 📁 File Upload & Data Management
- Upload Excel (.xlsx) and CSV files
- Automatic table creation with proper SQLite schema  
- Clean column name handling (spaces, special chars)
- File metadata tracking and status monitoring

### 🧠 AI-Powered Analytics
- Natural language to SQL conversion using Google Gemini
- Smart query suggestions based on uploaded data
- AI-generated insights and recommendations
- Data health analysis and quality checks

### 📊 Professional Dashboard
- Modern sidebar-based navigation
- Real-time active table counting (user data only)
- Query history with success/failure tracking
- File upload interface with drag-and-drop
- AI insights panel with actionable recommendations

### 🔧 API-First Architecture
- RESTful API endpoints for all functionality
- File upload via multipart/form-data
- JSON responses with detailed metadata
- Future-ready API integration endpoint placeholder

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- SQLite (automatically created)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Reportzy
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file with:
   GOOGLE_API_KEY=your_google_api_key_here
   DATABASE_URL=sqlite:///./reportzy.db
   ```

5. **Run the application**
   ```bash
   # Using the start script (recommended):
   chmod +x start.sh
   ./start.sh
   
   # Or manually:
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

6. **Access the application**
   - **Dashboard**: http://localhost:8001/dashboard
   - **API Documentation**: http://localhost:8001/docs
   - **Health Check**: http://localhost:8001/health

## 📖 API Usage Examples

### File Upload
```bash
# Upload a CSV file
curl -X POST "http://localhost:8001/api/upload" \
  -H "accept: application/json" \
  -F "file=@your_data.csv" \
  -F "dataset_name=my_dataset"

# Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "dataset_id": 1,
  "table_name": "my_dataset",
  "rows_processed": 100,
  "columns_processed": 5
}
```

### List Datasets
```bash
# Get all uploaded datasets
curl "http://localhost:8001/api/datasets"

# Response includes dataset metadata, table names, row counts
```

### Natural Language Queries
```bash
# Ask questions about your data
curl -X POST "http://localhost:8001/api/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me the top 10 records from my dataset"}'

# Response includes SQL query, results, and chart suggestions
```

### AI Insights Generation
```bash
# Generate AI insights for uploaded dataset
curl -X POST "http://localhost:8001/api/generate-insights/1"

# Response includes data statistics and AI recommendations
```

### Get Analytics Summary
```bash
# Get dashboard summary (active tables, suggestions)
curl "http://localhost:8001/api/analytics-summary"
```

## 🏗️ Architecture

```
📁 app/
├── 🚀 main.py              # FastAPI application & routing
├── 🗄️  db.py               # Database connection & initialization  
├── � models.py            # SQLAlchemy data models
├── � file_upload.py       # File upload & table creation
├── 🧠 ai_insights.py       # AI analysis & recommendations
├── 🤖 ask.py              # Natural language SQL interface
├── 🗂️  metadata.py         # Table metadata management
├── � export.py           # Data export functionality
└── � dashboard.html      # Modern frontend dashboard
```

## 🔗 API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /dashboard` - Analytics dashboard UI

### File & Data Management  
- `POST /api/upload` - Upload Excel/CSV files
- `GET /api/datasets` - List uploaded datasets
- `GET /api/dataset/{dataset_id}/preview` - Preview dataset
- `DELETE /api/dataset/{dataset_id}` - Delete dataset
- `POST /api/api-integration` - API integration endpoint
- `GET /api/analytics-summary` - Dashboard summary data
- `GET /api/metadata` - Table metadata management

## 🔗 API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /dashboard` - Analytics dashboard UI

### File & Data Management  
- `POST /api/upload` - Upload Excel/CSV files
- `GET /api/datasets` - List uploaded datasets
- `GET /api/dataset/{dataset_id}/preview` - Preview dataset
- `DELETE /api/dataset/{dataset_id}` - Delete dataset
- `POST /api/api-integration` - API integration endpoint

### AI & Analytics
- `POST /api/ask` - Natural language queries
- `GET /api/query-history` - Query execution history
- `GET /api/analytics-summary` - Dashboard summary data
- `POST /api/generate-insights/{dataset_id}` - Generate AI insights
- `GET /api/insights/{dataset_id}` - Get saved insights for specific dataset
- `GET /api/insights` - Get all insights
- `DELETE /api/insights/{insight_id}` - Delete specific insight
- `GET /api/data-health/{dataset_id}` - Data quality analysis

### Export & Utilities
- `POST /api/export` - Export query results
- `GET /api/export-templates` - Get available export templates
- `POST /api/export-template/{template_name}` - Export using template

### Metadata Management
- `POST /api/metadata` - Create/update metadata
- `GET /api/metadata/{table_name}` - Get metadata for specific table
- `GET /api/metadata` - Get all metadata
- `POST /api/metadata/auto-discover/{table_name}` - Auto-discover table metadata

## 🛠️ Development

### Database Schema
The application uses SQLite with the following key tables:

- **uploaded_datasets** - Tracks uploaded files and their metadata
- **query_logs** - Stores query history and results  
- **table_metadata** - Column descriptions and data types
- **ai_insights** - Generated insights and recommendations
- **[user_tables]** - Dynamic tables created from uploaded files

### Adding New Features
1. Create new router in `app/` directory
2. Add to `main.py` imports and include_router()
3. Update API documentation in README
4. Test with curl commands

## 🧪 Testing

### Automated Endpoint Testing
```bash
# Run the automated test script
python test_endpoints.py

# Or make it executable and run directly
chmod +x test_endpoints.py
./test_endpoints.py
```

### Manual Testing
```bash
# Test file upload
curl -X POST "http://localhost:8001/api/upload" \
  -F "file=@test_data.csv" -F "dataset_name=test"

# Test analytics summary  
curl "http://localhost:8001/api/analytics-summary"

# Test AI insights
curl -X POST "http://localhost:8001/api/generate-insights/1"
```

### Health Check
```bash
curl "http://localhost:8001/health"
# Should return: {"status": "healthy", "database": "connected"}
```

> **Note**: All endpoints have been tested and verified to be working correctly. You can run the automated test script to verify functionality after making changes.

## 🔧 Configuration

### Environment Variables
- `GOOGLE_API_KEY` - Required for AI features
- `DATABASE_URL` - SQLite database path (default: sqlite:///./reportzy.db)
- `PORT` - Server port (default: 8001)

### Supported File Formats
- **CSV** - Comma-separated values
- **Excel** - .xlsx files (using openpyxl)

### Data Types
All uploaded data is stored as TEXT in SQLite for maximum compatibility. The AI system handles type inference automatically.

## 🐛 Troubleshooting

### Common Issues

**Port Already In Use**
```bash
# Use a different port
PORT=8002 ./start.sh
```

**Google API Key Missing**
```bash
# Set your API key in .env file
echo "GOOGLE_API_KEY=your_key_here" >> .env
```

**Dependencies Issues**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Database Issues**
```bash
# Remove and recreate database
rm reportzy.db
# Restart the server to recreate tables
./start.sh
```

### Logs and Debugging
- Server logs are displayed in the terminal when running with `./start.sh`
- Use `/health` endpoint to check server and database status
- Run `python test_endpoints.py` to verify all endpoints

## 🚀 Deployment

### Production Setup
1. Set environment variables in production
2. Use a process manager like PM2 or systemd
3. Configure reverse proxy (nginx) for HTTPS
4. Set up database backups
5. Monitor with health check endpoint

### Docker (Optional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly with sample data
5. Update README if needed
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] PostgreSQL support for larger datasets
- [ ] Advanced chart types and visualizations  
- [ ] Real-time data streaming capabilities
- [ ] User authentication and multi-tenancy
- [ ] Scheduled data imports via API
- [ ] Advanced ML-powered insights
- [ ] Data transformation pipelines

---

**Built with ❤️ using FastAPI, SQLAlchemy, Google Gemini, and modern web technologies.**