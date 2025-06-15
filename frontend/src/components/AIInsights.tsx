'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Send, Loader2, Lightbulb } from 'lucide-react';

interface AIInsightsProps {
  className?: string;
}

export function AIInsights({ className }: AIInsightsProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    timestamp: string;
  }>>([]);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // Mock AI response - replace with actual API call
      const mockResponse = {
        id: Math.random().toString(36).substring(7),
        question: query,
        answer: `Based on your data analysis, here are some insights about "${query}". This is a mock response that would normally come from your AI backend.`,
        timestamp: new Date().toISOString(),
      };
      
      setInsights(prev => [mockResponse, ...prev]);
      setQuery('');
    } catch (error) {
      console.error('Error getting AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Ask questions about your data and get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleQuery} 
              disabled={isLoading || !query.trim()}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {insights.length === 0 ? (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Ask questions like &quot;Show me top sales by region&quot; or &quot;What are the trends in my data?&quot;
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm text-gray-700">
                          {insight.question}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {insight.answer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
