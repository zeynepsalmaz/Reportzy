'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Database, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Settings,
  Trash2
} from 'lucide-react';
import { useState } from 'react';

interface APIConnection {
  id: string;
  name: string;
  type: 'rest' | 'graphql' | 'database';
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export default function APIConnect() {
  const [connections, setConnections] = useState<APIConnection[]>([
    {
      id: '1',
      name: 'Sales API',
      type: 'rest',
      url: 'https://api.example.com/sales',
      status: 'connected',
      lastSync: '2 hours ago'
    },
    {
      id: '2',
      name: 'Analytics DB',
      type: 'database',
      url: 'postgresql://localhost:5432/analytics',
      status: 'disconnected',
    }
  ]);

  const [newConnection, setNewConnection] = useState<{
    name: string;
    type: 'rest' | 'graphql' | 'database';
    url: string;
    apiKey: string;
  }>({
    name: '',
    type: 'rest',
    url: '',
    apiKey: ''
  });

  const getStatusIcon = (status: APIConnection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: APIConnection['status']) => {
    const variants = {
      connected: 'default',
      disconnected: 'secondary',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleAddConnection = () => {
    if (!newConnection.name || !newConnection.url) return;

    const connection: APIConnection = {
      id: Date.now().toString(),
      name: newConnection.name,
      type: newConnection.type,
      url: newConnection.url,
      status: 'disconnected'
    };

    setConnections([...connections, connection]);
    setNewConnection({
      name: '',
      type: 'rest',
      url: '',
      apiKey: ''
    });
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Connections</h1>
          <p className="text-gray-600">
            Connect external APIs and databases to import data automatically
          </p>
        </div>

        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connections">Active Connections</TabsTrigger>
            <TabsTrigger value="add-new">Add New Connection</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            {connections.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No connections yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add your first API connection to start importing data automatically
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {connection.type === 'database' ? (
                            <Database className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Globe className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{connection.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <span className="capitalize">{connection.type}</span>
                            <span>•</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {connection.url}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(connection.status)}
                        {getStatusBadge(connection.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {connection.lastSync && (
                            <span>Last sync: {connection.lastSync}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteConnection(connection.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add-new" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New API Connection</CardTitle>
                <CardDescription>
                  Connect to external APIs or databases to automatically import data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Connection Name</label>
                    <Input
                      placeholder="e.g., Sales API"
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({
                        ...newConnection,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Connection Type</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={newConnection.type}
                      onChange={(e) => setNewConnection({
                        ...newConnection,
                        type: e.target.value as 'rest' | 'graphql' | 'database'
                      })}
                    >
                      <option value="rest">REST API</option>
                      <option value="graphql">GraphQL</option>
                      <option value="database">Database</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API URL / Connection String</label>
                  <Input
                    placeholder="https://api.example.com/v1 or postgresql://user:pass@host:port/db"
                    value={newConnection.url}
                    onChange={(e) => setNewConnection({
                      ...newConnection,
                      url: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key (Optional)</label>
                  <Input
                    type="password"
                    placeholder="Enter API key or token"
                    value={newConnection.apiKey}
                    onChange={(e) => setNewConnection({
                      ...newConnection,
                      apiKey: e.target.value
                    })}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleAddConnection}
                    disabled={!newConnection.name || !newConnection.url}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                  <Button variant="outline">
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connection Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Connection Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">REST API</h4>
                    <code className="text-xs text-gray-600">
                      https://api.example.com/v1/data
                    </code>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">PostgreSQL</h4>
                    <code className="text-xs text-gray-600">
                      postgresql://user:pass@host:5432/db
                    </code>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">MySQL</h4>
                    <code className="text-xs text-gray-600">
                      mysql://user:pass@host:3306/database
                    </code>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">GraphQL</h4>
                    <code className="text-xs text-gray-600">
                      https://api.example.com/graphql
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
