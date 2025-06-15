'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Upload, 
  Brain, 
  Zap, 
  ArrowRight,
  Database,
  Activity,
  TrendingUp
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: Upload,
      title: 'Smart Data Import',
      description: 'Upload CSV/Excel files with intelligent parsing and validation',
      action: () => router.push('/import-data'),
      badge: 'New'
    },
    {
      icon: Brain,
      title: 'AI-Powered Analytics',
      description: 'Ask questions in natural language and get instant insights',
      action: () => router.push('/ai-insights'),
      badge: 'Popular'
    },
    {
      icon: BarChart3,
      title: 'Interactive Dashboard',
      description: 'Visualize your data with dynamic charts and metrics',
      action: () => router.push('/dashboard'),
      badge: null
    }
  ];

  const stats = [
    { icon: Database, label: 'Datasets', value: '0', color: 'text-blue-600' },
    { icon: Activity, label: 'Queries Today', value: '0', color: 'text-green-600' },
    { icon: TrendingUp, label: 'Insights Generated', value: '0', color: 'text-purple-600' }
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome to Reportzy
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your data into actionable insights with AI-powered analytics. 
            Upload, analyze, and discover patterns in your data effortlessly.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <feature.icon className="h-8 w-8 text-primary" />
                  {feature.badge && (
                    <Badge variant={feature.badge === 'Popular' ? 'default' : 'secondary'}>
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={feature.action}
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                  variant="outline"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to get started?</CardTitle>
            <CardDescription className="text-lg">
              Upload your first dataset and start exploring your data with AI
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/import-data')}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Data
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              View Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
