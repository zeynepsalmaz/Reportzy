"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lightbulb, MessageSquare, TrendingUp, Database, RefreshCw } from "lucide-react";

interface InsightItem {
  id: string;
  title: string;
  description: string;
  category: 'pattern' | 'anomaly' | 'trend' | 'suggestion';
  confidence: number;
  created_at: string;
  table_name: string;
}

interface QueryResult {
  question: string;
  sql_query: string;
  results: Record<string, unknown>[];
  chart_data?: Record<string, unknown>;
  success: boolean;
  error_message?: string;
  suggestion?: string;
}

export function AIInsights() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [question, setQuestion] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('ask');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/insights/all');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const generateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadInsights(); // Reload the insights
        }
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setQueryResult(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await response.json();
      setQueryResult(data);
    } catch (error) {
      console.error('Error asking question:', error);
      setQueryResult({
        question: question,
        sql_query: '',
        results: [],
        success: false,
        error_message: 'Failed to process question. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const getCategoryIcon = (category: InsightItem['category']) => {
    switch (category) {
      case 'pattern':
        return <TrendingUp className="w-4 h-4" />;
      case 'anomaly':
        return <Database className="w-4 h-4" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: InsightItem['category']) => {
    switch (category) {
      case 'pattern':
        return 'bg-blue-100 text-blue-800';
      case 'anomaly':
        return 'bg-red-100 text-red-800';
      case 'trend':
        return 'bg-green-100 text-green-800';
      case 'suggestion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="mt-2 text-gray-600">
            Leverage AI to discover patterns, anomalies, and insights in your data
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={generatingInsights}
          className="flex items-center gap-2"
        >
          {generatingInsights ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Generate New Insights
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ask" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Ask Questions
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Generated Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ask" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ask Questions About Your Data</CardTitle>
              <CardDescription>
                Use natural language to query your datasets and get AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Show me sales trends by month, Find anomalies in customer data..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  onClick={askQuestion}
                  disabled={loading || !question.trim()}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Ask
                </Button>
              </div>

              {loading && (
                <Alert>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <AlertDescription>
                    Analyzing your data and generating response...
                  </AlertDescription>
                </Alert>
              )}

              {queryResult && (
                <div className="space-y-4">
                  {queryResult.success ? (
                    <div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-green-800 mb-2">Query Results</h4>
                        <p className="text-sm text-green-700 mb-2">
                          <strong>Question:</strong> {queryResult.question}
                        </p>
                        <p className="text-sm text-green-700 font-mono bg-green-100 p-2 rounded">
                          {queryResult.sql_query}
                        </p>
                      </div>
                      
                      {queryResult.results && queryResult.results.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(queryResult.results[0]).map((key) => (
                                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {queryResult.results.slice(0, 10).map((row, index) => (
                                <tr key={index}>
                                  {Object.values(row).map((value: unknown, cellIndex) => (
                                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {value !== null ? String(value) : 'N/A'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {queryResult.results.length > 10 && (
                            <p className="text-sm text-gray-500 mt-2">
                              Showing first 10 of {queryResult.results.length} results
                            </p>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            Query executed successfully but returned no results.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <strong>Error:</strong> {queryResult.error_message}
                        {queryResult.suggestion && (
                          <>
                            <br />
                            <strong>Suggestion:</strong> {queryResult.suggestion}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Lightbulb className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No insights generated yet</h3>
                <p className="text-gray-500 text-center mb-4">                    Click &quot;Generate New Insights&quot; to analyze your data and discover patterns, anomalies, and trends.
                </p>
                <Button
                  onClick={generateInsights}
                  disabled={generatingInsights}
                  className="flex items-center gap-2"
                >
                  {generatingInsights ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                  Generate Insights
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {insights.map((insight) => (
                <Card key={insight.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(insight.category)}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(insight.category)}>
                          {insight.category}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-500">
                      {insight.table_name} • {new Date(insight.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
