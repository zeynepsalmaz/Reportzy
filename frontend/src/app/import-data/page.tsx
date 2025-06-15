'use client';

import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';
import { apiClient } from '@/lib/api-client';
import { APP_CONFIG } from '@/constants/config';
import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  Database,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import type { Dataset } from '@/types';

export default function ImportDataPage() {
  const { datasets, setDatasets, addDataset, addNotification } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    // Validate file
    const fileExtension = ('.' + file.name.split('.').pop()?.toLowerCase()) as string;
    if (!APP_CONFIG.SUPPORTED_FORMATS.includes(fileExtension as '.csv' | '.xlsx' | '.xls')) {
      addNotification({
        type: 'error',
        title: 'Invalid File Format',
        message: `Supported formats: ${APP_CONFIG.SUPPORTED_FORMATS.join(', ')}`
      });
      return;
    }

    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: `Maximum file size is ${APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.uploadDataset(formData) as any;
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        const newDataset: Dataset = {
          id: response.dataset_id || Math.random().toString(36).substring(7),
          name: file.name.replace(/\.[^/.]+$/, ""),
          filename: file.name,
          upload_date: new Date().toISOString(),
          size: file.size,
          fileSize: file.size, // Added for compatibility
          rows: response.rows || 0,
          rowCount: response.rows || 0, // Added for compatibility
          columns: response.columns || 0,
          columnCount: response.columns || 0, // Added for compatibility
          status: 'ready'
        };

        addDataset(newDataset);
        addNotification({
          type: 'success',
          title: 'Upload Successful',
          message: `${file.name} has been uploaded and processed successfully`
        });
      } else {
        throw new Error(response.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Failed to upload file'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Import Data</h1>
          <p className="text-muted-foreground">
            Upload your CSV or Excel files to start analyzing your data
          </p>
        </div>

        {/* Upload Area */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Dataset
            </CardTitle>
            <CardDescription>
              Drag and drop your files or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading and processing...</p>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your files here</p>
                    <p className="text-sm text-muted-foreground">
                      or{' '}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse to upload
                      </button>
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span>Max size: {APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB</span>
                    <span>•</span>
                    <span>Formats: {APP_CONFIG.SUPPORTED_FORMATS.join(', ')}</span>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={APP_CONFIG.SUPPORTED_FORMATS.join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={uploading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Format Guide */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Data format tips:</strong> Ensure your CSV/Excel files have column headers in the first row and consistent data types in each column for best results.
          </AlertDescription>
        </Alert>

        {/* Uploaded Datasets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Your Datasets
            </CardTitle>
            <CardDescription>
              Manage and preview your uploaded datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datasets.length > 0 ? (
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{dataset.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dataset.rows.toLocaleString()} rows • {dataset.columns} columns • {formatFileSize(dataset.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(dataset.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={dataset.status === 'ready' ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {dataset.status === 'ready' ? (
                          <Check className="h-3 w-3" />
                        ) : dataset.status === 'error' ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {dataset.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No datasets uploaded yet</p>
                <p className="text-sm">Upload your first file to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
