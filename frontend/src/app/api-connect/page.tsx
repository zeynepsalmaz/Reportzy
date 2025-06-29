'use client';

import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Globe, 
  Database, 
  Key, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Plus,
  Settings,
  Trash2,
  Loader2,
  Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { apiClient } from '@/lib/api-client';
import type { APIConnection, APISyncLog } from '@/types';

export default function APIConnect() {
  const { 
    apiConnections, 
    syncLogs,
    setAPIConnections, 
    addAPIConnection, 
    updateAPIConnection, 
    removeAPIConnection,
    setSyncLogs,
    addNotification 
  } = useAppStore();
  
  const [newConnection, setNewConnection] = useState<{
    name: string;
    connection_type: 'rest' | 'graphql' | 'database';
    url: string;
    api_key: string;
  }>({
    name: '',
    connection_type: 'rest',
    url: '',
    api_key: ''
  });

  const [isConnecting, setIsConnecting] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    connectionId: number | null;
    connectionName: string | null;
  }>({
    isOpen: false,
    connectionId: null,
    connectionName: null
  });

  // Load API connections on mount
  useEffect(() => {
    loadAPIConnections();
  }, []);

  const loadAPIConnections = async () => {
    try {
      const response = await apiClient.getAPIConnections() as { success: boolean; connections: APIConnection[] };
      if (response.success) {
        setAPIConnections(response.connections);
      }
    } catch (error) {
      console.error('Error loading API connections:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load API connections'
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleTestConnection = async (connectionId: number) => {
    setIsConnecting(connectionId);
    
    try {
      const response = await apiClient.testAPIConnection(connectionId) as { success: boolean; status?: string; message?: string };
      
      if (response.success) {
        updateAPIConnection(connectionId, { 
          status: 'connected',
          last_sync: new Date().toISOString()
        });
        
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: response.message || 'API connection has been established successfully'
        });
      } else {
        updateAPIConnection(connectionId, { status: 'error' });
        
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: response.message || 'Failed to connect to the API'
        });
      }
    } catch (error) {
      updateAPIConnection(connectionId, { status: 'error' });
      
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: error instanceof Error ? error.message : 'Failed to test connection'
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleSyncData = async (connectionId: number) => {
    setIsSyncing(connectionId);
    
    try {
      const response = await apiClient.syncAPIData(connectionId) as { 
        success: boolean; 
        message?: string; 
        records_synced?: number;
        table_name?: string;
      };
      
      if (response.success) {
        updateAPIConnection(connectionId, { 
          status: 'connected',
          last_sync: new Date().toISOString()
        });
        
        addNotification({
          type: 'success',
          title: 'Data Sync Successful',
          message: response.message || `Successfully synced ${response.records_synced} records`
        });
        
        // Load sync logs
        loadSyncLogs(connectionId);
      } else {
        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: response.message || 'Failed to sync data from API'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sync Error',
        message: error instanceof Error ? error.message : 'Failed to sync data'
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const loadSyncLogs = async (connectionId: number) => {
    try {
      const response = await apiClient.getAPISyncLogs(connectionId) as { success: boolean; logs: APISyncLog[] };
      if (response.success) {
        setSyncLogs(connectionId, response.logs);
      }
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };

  const handleAddConnection = async () => {
    if (!newConnection.name || !newConnection.url) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const response = await apiClient.createAPIConnection({
        name: newConnection.name,
        connection_type: newConnection.connection_type,
        url: newConnection.url,
        api_key: newConnection.api_key || undefined,
      }) as { success: boolean; connection_id: number; target_table_name?: string; message?: string };

      if (response.success) {
        const connection: APIConnection = {
          id: response.connection_id,
          name: newConnection.name,
          type: newConnection.connection_type,
          url: newConnection.url,
          status: 'disconnected',
          target_table_name: response.target_table_name,
          created_at: new Date().toISOString(),
        };

        addAPIConnection(connection);
        
        // Reset form
        setNewConnection({
          name: '',
          connection_type: 'rest',
          url: '',
          api_key: ''
        });

        addNotification({
          type: 'success',
          title: 'Connection Added',
          message: response.message || 'API connection has been added successfully'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add API connection'
      });
    }
  };

  const handleDeleteClick = (connectionId: number) => {
    const connection = apiConnections.find(conn => conn.id === connectionId);
    if (connection) {
      setDeleteConfirm({
        isOpen: true,
        connectionId: connectionId,
        connectionName: connection.name
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.connectionId) return;

    try {
      const response = await apiClient.deleteAPIConnection(deleteConfirm.connectionId) as { success: boolean; message?: string };
      
      if (response.success) {
        removeAPIConnection(deleteConfirm.connectionId);
        
        addNotification({
          type: 'success',
          title: 'Connection Deleted',
          message: response.message || 'API connection has been deleted successfully'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete API connection'
      });
    } finally {
      setDeleteConfirm({
        isOpen: false,
        connectionId: null,
        connectionName: null
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rest':
        return <Globe className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'graphql':
        return <Key className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Connections</h1>
            <p className="text-gray-600">Connect to external APIs and sync data</p>
          </div>
          <Button onClick={() => {}} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>

        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="add-new">Add New</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            {apiConnections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No API connections</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Connect to external APIs to sync data automatically
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first connection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {apiConnections.map((connection) => (
                  <Card key={connection.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(connection.type)}
                          <div>
                            <CardTitle className="text-lg">{connection.name}</CardTitle>
                            <CardDescription>{connection.url}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(connection.status)}
                          {getStatusBadge(connection.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(connection.id)}
                            disabled={isConnecting === connection.id}
                          >
                            {isConnecting === connection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncData(connection.id)}
                            disabled={isSyncing === connection.id || connection.status !== 'connected'}
                          >
                            {isSyncing === connection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Sync
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(connection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Type:</span>
                          <span className="ml-2 capitalize">{connection.type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Last Sync:</span>
                          <span className="ml-2">{formatDate(connection.last_sync)}</span>
                        </div>
                        {connection.target_table_name && (
                          <div>
                            <span className="font-medium text-gray-500">Table:</span>
                            <span className="ml-2">{connection.target_table_name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Sync Logs */}
                      {syncLogs[connection.id] && syncLogs[connection.id].length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Recent Sync History</h4>
                          <div className="space-y-1">
                            {syncLogs[connection.id].slice(0, 3).map((log) => (
                              <div key={log.id} className="flex items-center justify-between text-xs">
                                <span className="flex items-center">
                                  {log.sync_status === 'success' ? (
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                                  )}
                                  {log.records_synced || 0} records
                                </span>
                                <span className="text-gray-500">
                                  {formatDate(log.created_at)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Add New Tab */}
          <TabsContent value="add-new">
            <Card>
              <CardHeader>
                <CardTitle>Add New API Connection</CardTitle>
                <CardDescription>
                  Connect to external APIs to sync data automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Connection Name *
                    </label>
                    <Input
                      placeholder="e.g., Sales API"
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Connection Type
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newConnection.connection_type}
                      onChange={(e) => setNewConnection({ ...newConnection, connection_type: e.target.value as 'rest' | 'graphql' | 'database' })}
                    >
                      <option value="rest">REST API</option>
                      <option value="graphql">GraphQL</option>
                      <option value="database">Database</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    API URL *
                  </label>
                  <Input
                    placeholder="https://api.example.com/data"
                    value={newConnection.url}
                    onChange={(e) => setNewConnection({ ...newConnection, url: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    API Key (Optional)
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter API key if required"
                    value={newConnection.api_key}
                    onChange={(e) => setNewConnection({ ...newConnection, api_key: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setNewConnection({ name: '', connection_type: 'rest', url: '', api_key: '' })}
                  >
                    Clear
                  </Button>
                  <Button onClick={handleAddConnection} className="bg-blue-600 hover:bg-blue-700">
                    Add Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, connectionId: null, connectionName: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete API Connection</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the connection "{deleteConfirm.connectionName}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm({ isOpen: false, connectionId: null, connectionName: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}