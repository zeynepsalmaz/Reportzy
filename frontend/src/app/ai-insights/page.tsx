'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Lightbulb, 
  TrendingUp, 
  Clock,
  Zap,
  BarChart3,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { AIQuery, AutoInsight, AIResponse } from '@/types';

export default function AIInsightsPage() {
  const { addNotification } = useAppStore();
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AIQuery | null>(null);
  const [queryHistory, setQueryHistory] = useState<AIQuery[]>([]);
  const [autoInsights, setAutoInsights] = useState<AutoInsight[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    generateAutoInsights();
  }, []);

  const handleAskQuestion = async () => {
    if (!query.trim()) return;

    try {
      setIsQuerying(true);
      const response = await apiClient.askQuestion(query) as AIResponse;
      
      const newQuery: AIQuery = {
        id: Math.random().toString(36).substring(7),
        question: query,
        answer: response.answer || response.message || 'No response received',
        timestamp: new Date().toISOString(),
        sql_query: response.sql_query,
        execution_time: response.execution_time
      };
      
      setCurrentAnswer(newQuery);
      setQueryHistory(prev => [newQuery, ...prev]);
      setQuery('');
      
      addNotification({
        type: 'success',
        title: 'Query Completed',
        message: 'Your question has been processed successfully'
      });
      
    } catch (error) {
      console.error('Error asking question:', error);
      addNotification({
        type: 'error',
        title: 'Query Failed',
        message: error instanceof Error ? error.message : 'Failed to process question'
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const generateAutoInsights = async () => {
    try {
      setGeneratingInsights(true);
      
      // Mock auto insights for now
      const mockInsights: AutoInsight[] = [
        {
          id: '1',
          type: 'trend' as const,
          title: 'Data Volume Trend',
          description: 'Your dataset contains patterns showing consistent growth',
          confidence: 0.89,
          timestamp: new Date().toISOString(),
          category: 'Volume Analysis'
        },
        {
          id: '2', 
          type: 'anomaly' as const,
          title: 'Unusual Values Detected',
          description: 'Found 3 outliers in the revenue column',
          confidence: 0.76,
          timestamp: new Date().toISOString(),
          category: 'Anomaly Detection'
        },
        {
          id: '3',
          type: 'recommendation' as const,
          title: 'Strong Correlation Found',
          description: 'Marketing spend correlates strongly with revenue (r=0.82)',
          confidence: 0.94,
          timestamp: new Date().toISOString(),
          category: 'Correlation Analysis'
        }
      ];
      
      setAutoInsights(mockInsights);
      
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const suggestedQuestions = [
    'Show me the top 10 records by value',
    'What are the unique values in each column?',
    'Find any missing or null values',
    'Show me data trends over time',
    'Calculate summary statistics',
    'Find correlations between columns'
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'anomaly': return AlertTriangle;
      case 'correlation': return BarChart3;
      default: return Lightbulb;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">
            Get intelligent insights from your data using natural language queries
          </p>
        </div>

        <Tabs defaultValue="query" className="space-y-6">
          <TabsList>
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Ask Questions
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Auto Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-6">
            {/* Query Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Ask Your Data
                </CardTitle>
                <CardDescription>
                  Ask questions in natural language and get instant insights from your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Show me the average sales by region..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isQuerying && handleAskQuestion()}
                    disabled={isQuerying}
                    className="text-base"
                  />
                  <Button 
                    onClick={handleAskQuestion}
                    disabled={isQuerying || !query.trim()}
                    size="lg"
                  >
                    {isQuerying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Suggested Questions */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Try these sample questions:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedQuestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-3 text-left justify-start"
                        onClick={() => setQuery(suggestion)}
                      >
                        <span className="text-sm text-muted-foreground">{suggestion}</span>
                        <ArrowRight className="ml-auto h-3 w-3 shrink-0" />
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Answer */}
            {currentAnswer && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    Latest Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="font-medium">{currentAnswer.question}</div>
                  <div className="p-3 bg-background rounded-lg border">
                    {currentAnswer.answer}
                  </div>
                  {currentAnswer.sql_query && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View SQL Query
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {currentAnswer.sql_query}
                      </pre>
                    </details>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(currentAnswer.timestamp).toLocaleTimeString()}
                    </span>
                    {currentAnswer.execution_time && (
                      <Badge variant="secondary">{currentAnswer.execution_time}ms</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Query History */}
            {queryHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Query History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {queryHistory.slice(0, 5).map((item) => (
                        <div key={item.id} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm mb-1">{item.question}</div>
                          <div className="text-xs text-muted-foreground mb-2">{item.answer}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Auto-Generated Insights */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Automatic Insights
                  </CardTitle>
                  <CardDescription>
                    AI-generated patterns and discoveries from your data
                  </CardDescription>
                </div>
                <Button 
                  onClick={generateAutoInsights}
                  disabled={generatingInsights}
                  variant="outline"
                >
                  {generatingInsights ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
              </CardHeader>
              <CardContent>
                {autoInsights.length > 0 ? (
                  <div className="space-y-4">
                    {autoInsights.map((insight) => {
                      const IconComponent = getInsightIcon(insight.type);
                      return (
                        <div key={insight.id} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{insight.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{insight.category}</Badge>
                                  <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence || 0)}`}>
                                    {Math.round((insight.confidence || 0) * 100)}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Generated {new Date(insight.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No insights generated yet</p>
                    <p className="text-sm">Click Generate to analyze your data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
