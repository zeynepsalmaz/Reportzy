"use client";

import { API_CONFIG } from '@/constants/config';
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import "./styles/Dashboard.css";
import { 
  Database, 
  Table as TableIcon, 
  Search, 
  Lightbulb,
  Send,
  Loader2,
  BarChartHorizontalBig,
  Code,
  ChartLine
} from "lucide-react";
import { AnalyticsSummary, QueryResult } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

// ...existing code...
const API_BASE = API_CONFIG.BASE_URL;

export function Dashboard() {
  const [stats, setStats] = useState({
    totalRecords: 12450,
    activeTables: 8,
    queriesToday: 24,
    aiInsights: 15
  });
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    console.log('Loading dashboard with API_BASE:', API_BASE);
    try {
      const url = `${API_BASE}/analytics-summary`;
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data: AnalyticsSummary = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          setStats({
            totalRecords: data.summary?.data_stats?.total_records || 0,
            activeTables: data.summary?.available_tables?.length || 0,
            queriesToday: data.summary?.data_stats?.queries_today || 0,
            aiInsights: data.summary?.data_stats?.ai_insights || 0
          });
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (response.ok) {
        const data: QueryResult = await response.json();
        if (data.success && data.data) {
          setResults(data.data);
          setSqlQuery(data.sql_query || "SELECT * FROM data_table;");
          setShowResults(true);
          setQuestion("");
        }
      }
    } catch (error) {
      console.error("Error asking question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      askQuestion();
    }
  };

  const askPredefined = (predefinedQuestion: string) => {
    setQuestion(predefinedQuestion);
    setTimeout(() => askQuestion(), 100);
  };

  return (
    <div className="dashboard">
      <div className="dashboardTitle">Analytics Dashboard</div>
      <div className="dashboardSubtitle">Get insights from your data with AI-powered analytics</div>
      
      {/* KPI Cards */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <div className="kpiContent">
            <div className="kpiInfo">
              <p className="kpiLabel">Total Records</p>
              <p className="kpiValue">{(stats.totalRecords || 0).toLocaleString()}</p>
              <p className="kpiDescription">Across all datasets</p>
            </div>
            <div className="kpiIcon blue">
              <Database className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="kpiCard">
          <div className="kpiContent">
            <div className="kpiInfo">
              <p className="kpiLabel">Active Tables</p>
              <p className="kpiValue">{stats.activeTables}</p>
              <p className="kpiDescription">Available for querying</p>
            </div>
            <div className="kpiIcon green">
              <TableIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="kpiCard">
          <div className="kpiContent">
            <div className="kpiInfo">
              <p className="kpiLabel">Queries Today</p>
              <p className="kpiValue">{stats.queriesToday}</p>
              <p className="kpiDescription">Successful AI queries</p>
            </div>
            <div className="kpiIcon purple">
              <Search className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="kpiCard">
          <div className="kpiContent">
            <div className="kpiInfo">
              <p className="kpiLabel">AI Insights</p>
              <p className="kpiValue">{stats.aiInsights}</p>
              <p className="kpiDescription">Generated by AI</p>
            </div>
            <div className="kpiIcon orange">
              <Lightbulb className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Query Interface */}
      <div className="aiQuerySection">
        <div className="aiQueryHeader">
          <div className="aiIcon">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h2 className="aiTitle">Ask AI Analytics</h2>
            <p className="aiSubtitle">Ask any question about your data in natural language</p>
          </div>
        </div>
        
        <div className="queryInputContainer">
          <input
            type="text"
            placeholder="Ask anything about your data..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="queryInput"
          />
          <button 
            onClick={askQuestion} 
            disabled={loading || !question.trim()}
            className="askButton"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {loading ? "Processing..." : "Ask"}
          </button>
        </div>

        <div className="quickExamples">
          <span className="exampleLabel">Quick examples:</span>
          <button onClick={() => askPredefined('show me all data')} className="exampleButton">
            View all data
          </button>
          <button onClick={() => askPredefined('data summary')} className="exampleButton">
            Data summary
          </button>
          <button onClick={() => askPredefined('show tables')} className="exampleButton">
            Available tables
          </button>
        </div>

        {loading && (
          <div className="loadingState">
            <Loader2 className="loadingIcon h-12 w-12" />
            <p className="loadingTitle">Analyzing your data...</p>
            <p className="loadingSubtitle">Please wait while AI processes your query.</p>
          </div>
        )}

        {showResults && (
          <div className="resultsSection">
            <div className="resultsGrid">
              <div className="resultCard">
                <div className="resultHeader">
                  <div className="resultIcon">
                    <Code className="h-5 w-5" />
                  </div>
                  <h3 className="resultTitle">Generated SQL</h3>
                </div>
                <pre className="sqlCode">{sqlQuery}</pre>
              </div>
              
              <div className="resultCard">
                <div className="resultHeader">
                  <div className="resultIcon">
                    <ChartLine className="h-5 w-5" />
                  </div>
                  <h3 className="resultTitle">Visualization</h3>
                </div>
                <div className="chartPlaceholder">
                  <BarChartHorizontalBig className="h-16 w-16" />
                  <p>Interactive chart will appear here</p>
                </div>
              </div>
            </div>

            <div className="resultCard">
              <div className="resultHeader">
                <div className="resultIcon">
                  <TableIcon className="h-5 w-5" />
                </div>
                <h3 className="resultTitle">Results ({results.length} rows)</h3>
              </div>
              {results.length > 0 ? (
                <ScrollArea className="h-[300px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(results[0]).map((key) => (
                          <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: unknown, cellIndex) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap">
                              {value !== null && value !== undefined ? String(value) : <span className="text-muted-foreground italic">N/A</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="emptyState">
                  <Search className="emptyIcon h-12 w-12" />
                  <p className="emptyTitle">No Results Found</p>
                  <p className="emptySubtitle">Your query did not return any data. Try a different question.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}