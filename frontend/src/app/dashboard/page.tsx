'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { apiClient } from '@/lib/api-client';
import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Database, 
  TrendingUp, 
  Brain,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import type { DashboardStats, AIQuery } from '@/types';

export default function DashboardPage() {
  const { datasets, addNotification } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    activeTables: 0,
    queriesToday: 0,
    aiInsights: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryHistory, setQueryHistory] = useState<AIQuery[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading dashboard data...');
      
      const response = await apiClient.getDashboardStats();
      console.log('Dashboard stats response:', response);
      
      setStats(response as {
        totalRecords: number;
        activeTables: number;
        queriesToday: number;
        aiInsights: number;
      });
      
      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Error Loading Dashboard',
        message: 'Failed to load dashboard statistics'
      });
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    try {
      setIsQuerying(true);
      const response = await apiClient.askQuestion(query) as {
        answer?: string;
        message?: string;
        sql_query?: string;
        execution_time?: number;
      };
      
      const newQuery: AIQuery = {
        id: Math.random().toString(36).substring(7),
        question: query,
        answer: response.answer || response.message || 'No response received',
        timestamp: new Date().toISOString(),
        sql_query: response.sql_query,
        execution_time: response.execution_time
      };
      
      setQueryHistory(prev => [newQuery, ...prev]);
      setQuery('');
      
      addNotification({
        type: 'success',
        title: 'Query Executed',
        message: 'Your query has been processed successfully'
      });
    } catch (error) {
      console.error('Error executing query:', error);
      addNotification({
        type: 'error',
        title: 'Query Failed',
        message: 'Failed to execute your query'
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ElementType; 
    description: string; 
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Icon className="h-8 w-8 text-blue-500" />
            {trend && (
              <TrendingUp className={`h-4 w-4 ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 'text-gray-400'
              }`} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your analytics data</p>
          </div>
          <Button onClick={loadDashboardData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Records"
            value={stats.totalRecords.toLocaleString()}
            icon={Database}
            description="Across all datasets"
            trend="up"
          />
          <StatCard
            title="Active Tables"
            value={stats.activeTables}
            icon={BarChart3}
            description="Available for analysis"
            trend="neutral"
          />
          <StatCard
            title="Queries Today"
            value={stats.queriesToday}
            icon={Search}
            description="AI-powered queries"
            trend="up"
          />
          <StatCard
            title="AI Insights"
            value={stats.aiInsights}
            icon={Brain}
            description="Generated insights"
            trend="up"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Query */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Quick Query
              </CardTitle>
              <CardDescription>
                Ask questions about your data using natural language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="What insights can you show me about my data?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  disabled={isQuerying}
                />
                <Button 
                  onClick={handleQuery} 
                  disabled={isQuerying || !query.trim()}
                >
                  {isQuerying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {queryHistory.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {queryHistory.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">{item.question}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Datasets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recent Datasets
              </CardTitle>
              <CardDescription>
                Your recently uploaded datasets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datasets.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No datasets uploaded yet. Upload your first dataset to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {datasets.slice(0, 5).map((dataset) => (
                    <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{dataset.name}</p>
                        <p className="text-sm text-gray-500">
                          {dataset.rows.toLocaleString()} rows • {dataset.columns} columns
                        </p>
                      </div>
                      <Badge variant={dataset.status === 'ready' ? 'default' : 'secondary'}>
                        {dataset.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Summary</CardTitle>
            <CardDescription>
              Key insights and recommendations based on your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Data Volume</h4>
                    <p className="text-sm text-gray-600">
                      You have {stats.totalRecords.toLocaleString()} records across {stats.activeTables} tables.
                      This gives you a solid foundation for analysis.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Query Activity</h4>
                    <p className="text-sm text-gray-600">
                      {stats.queriesToday} queries executed today. 
                      Regular querying helps uncover valuable insights.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-4">
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">AI insights will appear here as you analyze your data</p>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Upload more data</p>
                      <p className="text-sm text-blue-700">
                        More data leads to better insights. Consider uploading additional datasets.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Try AI queries</p>
                      <p className="text-sm text-green-700">
                        Ask natural language questions to discover patterns in your data.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
