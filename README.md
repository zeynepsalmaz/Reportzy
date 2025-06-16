# Reportzy - AI-Powered Data Analytics Platform

A modern, full-stack analytics platform that transforms raw data into actionable insights using AI. Built with a professional tech stack featuring Next.js 15, TypeScript, Python FastAPI, and AI integration.

## 🚀 Features

### Core Functionality
- **Smart Data Import**: Upload CSV/Excel files with intelligent parsing and validation
- **AI-Powered Analytics**: Natural language queries to explore your data
- **Interactive Dashboard**: Dynamic charts and metrics visualization
- **Dataset Management**: Preview, organize, and manage your datasets with ease
- **API Integration**: Connect external data sources seamlessly
- **Insights Generation**: Automated pattern detection and anomaly analysis

### Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Professional Interface**: Clean, modern design with shadcn/ui components
- **Dark/Light Mode**: Theme support (configurable)
- **Modular Components**: Fully componentized React architecture
- **Type Safety**: Full TypeScript coverage for reliability
- **Accessibility**: WCAG compliant interface

## 🏗️ Architecture

### Frontend (Next.js 15 + TypeScript + Turbopack)
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── dashboard/       # Dashboard page
│   │   ├── import-data/     # Data import page
│   │   └── ai-insights/     # AI analytics page
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── AppLayout.tsx    # Main app layout
│   │   ├── Header.tsx       # Top navigation
│   │   └── Sidebar.tsx      # Navigation sidebar
│   ├── types/               # TypeScript interfaces
│   ├── store/               # Zustand state management
│   ├── lib/                 # Utilities and API client
│   └── styles/              # Global styles (Tailwind CSS)
```

### Backend (Python FastAPI)
```
backend/
├── main.py              # FastAPI application entry
├── db.py               # Database configuration
├── models.py           # SQLAlchemy models
├── analytics.py        # Data processing
├── export.py           # Data export functionality
├── feedback.py         # User feedback system
├── ingest.py           # Data ingestion
├── metadata.py         # Dataset metadata
└── monitoring.py       # System monitoring
```

### AI Layer (Python)
```
ai/
├── ask.py              # Natural language query processing
├── ai_insights.py      # Automated insights generation
└── ai_multilang.py     # Multi-language AI support
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router + Turbopack
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management
- **Lucide Icons**: Modern icon system

### Backend  
- **FastAPI**: High-performance Python API framework
- **SQLAlchemy**: Database ORM
- **SQLite**: Lightweight database (configurable)
- **Pydantic**: Data validation

### AI & Analytics
- **Google Gemini AI**: Advanced language model
- **LangChain**: AI framework for LLM applications
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing

## � Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Clone and start both services
git clone <repository-url>
cd Reportzy
./start-dev.sh
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+
- Git

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Reportzy
```

#### 2. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional for AI features)
export GOOGLE_API_KEY="your-gemini-api-key"

# Run backend server
python run_backend.py
```

#### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### 4. Access the Application
- Frontend: http://localhost:3000 (or next available port)
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🎯 Usage Guide

### Getting Started
1. **Upload Data**: Navigate to "Import Data" and upload your CSV/Excel files
2. **Explore Dashboard**: View key metrics and dataset overview
3. **Ask Questions**: Use natural language to query your data (e.g., "Show me sales trends by month")
4. **Connect APIs**: Integrate external data sources via the API Connect tab
5. **Generate Insights**: Let AI automatically discover patterns and anomalies

### Example Queries
- "What are the top 10 customers by revenue?"
- "Show me sales trends over the last 6 months"
- "Find any unusual patterns in the data"
- "Which products have the highest profit margins?"

### API Integration
Connect external APIs to automatically import data:
```javascript
// Example API configuration
{
  "name": "Sales API",
  "endpoint": "https://api.example.com/sales",
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "schedule": "daily"
}
```

## 🔧 Development

### Component Development
All UI components are modular and reusable:

```typescript
// Example component structure
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

### Adding New Features
1. **Frontend**: Create components in `frontend/src/components/`
2. **Backend**: Add endpoints in `backend/` directory
3. **AI**: Extend AI functionality in `ai/` directory
4. **Types**: Update interfaces in `frontend/src/types/`

### Building for Production
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

## 📊 Data Formats

### Supported Import Formats
- CSV files (.csv)
- Excel files (.xlsx, .xls)
- JSON (via API)

### Data Requirements
- Column headers in first row
- Consistent data types per column
- Maximum file size: 50MB
- Recommended: < 1M rows for optimal performance

## 🔐 Security

- **Input Validation**: All data inputs are validated
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data in env files
- **File Upload Security**: Type and size validation

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Frontend Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```env
# Backend
GOOGLE_API_KEY=your-gemini-api-key
DATABASE_URL=sqlite:///./reportzy.db

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
pytest

# Type checking
npm run type-check
```

## 📝 API Documentation

### Key Endpoints
- `GET /api/datasets` - List all datasets
- `POST /api/upload` - Upload new dataset
- `POST /api/ask` - Natural language query
- `GET /api/insights/all` - Get generated insights
- `POST /api/insights/generate` - Generate new insights

Full API documentation available at `/docs` when running the backend.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- **TypeScript**: All frontend code must be typed
- **ESLint/Prettier**: Code formatting enforced
- **Component Testing**: Test all new components
- **Documentation**: Update README for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
1. **Port conflicts**: Use different ports if 3000/8001 are busy
2. **API key errors**: Ensure GOOGLE_API_KEY is set correctly
3. **File upload issues**: Check file size and format
4. **Database errors**: Verify SQLite permissions

### Getting Help
- Check the GitHub Issues page
- Review the API documentation at `/docs`
- Ensure all dependencies are installed correctly

## 🎉 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework  
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model
- [LangChain](https://langchain.com/) - AI framework

---

**Made with ❤️ for data-driven insights**
