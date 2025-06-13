"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Database, 
  Table as TableIcon, 
  Search, 
  Lightbulb,
  Send,
  Loader2
} from "lucide-react";
import { AnalyticsSummary, QueryResult } from "@/types";

const API_BASE = `http://localhost:8001/api`;

export function Dashboard() {
  const [stats, setStats] = useState({
    totalRecords: 0,
    activeTables: 0,
    queriesToday: 0,
    aiInsights: 0
  });
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics-summary`);
      if (response.ok) {
        const data: AnalyticsSummary = await response.json();
        if (data.success) {
          setStats({
            totalRecords: data.summary.data_stats.total_records,
            activeTables: data.summary.available_tables.length,
            queriesToday: data.summary.data_stats.queries_today,
            aiInsights: data.summary.data_stats.ai_insights
          });
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
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

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries Today</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queriesToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiInsights}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Query Input */}
        <Card>
          <CardHeader>
            <CardTitle>Ask Questions About Your Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., Show me sales trends by month..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button onClick={askQuestion} disabled={loading || !question.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="text-gray-600 mt-2">Analyzing your data...</p>
              </div>
            )}

            {showResults && results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Query Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(results[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: unknown, cellIndex) => (
                              <TableCell key={cellIndex}>
                                {value !== null && value !== undefined ? String(value) : 'N/A'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Data Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-center text-gray-400">
              <div>
                <div className="text-4xl mb-2">📊</div>
                <p>Charts will appear here</p>
                <p className="text-sm">Ask questions to generate visualizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
