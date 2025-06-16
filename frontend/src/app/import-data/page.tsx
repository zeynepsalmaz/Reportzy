'use client';

import { AppLayout } from '@/components/AppLayout';
import { ErrorModal } from '@/components/ErrorModal';
import { DatasetPreviewModal } from '@/components/DatasetPreviewModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/store/app-store';
import { apiClient } from '@/lib/api-client';
import { APP_CONFIG } from '@/constants/config';
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Check, 
  X, 
  AlertCircle,
  AlertTriangle,
  Loader2,
  Database,
  FileSpreadsheet,
  Eye,
  Trash2
} from 'lucide-react';
import type { Dataset, DatasetPreview } from '@/types';

export default function ImportDataPage() {
  const { 
    datasets, 
    uploadingDatasets, 
    deletedDatasets,
    previewData,
    isPreviewLoading,
    setDatasets,
    addNotification, 
    addUploadingDataset,
    updateUploadingDataset,
    removeUploadingDataset,
    removeDataset,
    setDeletedDatasets,
    setPreviewData,
    setIsPreviewLoading
  } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    dataset: Dataset | null;
  }>({
    isOpen: false,
    dataset: null
  });
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load datasets from backend
  const loadDatasets = useCallback(async () => {
    try {
      const response = await apiClient.getDatasets() as {
        success: boolean;
        datasets: Array<{
          id: number;
          dataset_name: string;
          table_name: string;
          file_name: string;
          file_size: number;
          row_count: number;
          column_count: number;
          upload_status: string;
          created_at: string;
        }>;
      };

      if (response.success && response.datasets) {
        const formattedDatasets: Dataset[] = response.datasets.map((item) => ({
          id: item.id.toString(),
          name: item.dataset_name,
          filename: item.file_name,
          upload_date: item.created_at,
          size: item.file_size,
          fileSize: item.file_size,
          rows: item.row_count,
          rowCount: item.row_count,
          columns: item.column_count,
          columnCount: item.column_count,
          status: item.upload_status === 'completed' ? 'completed' : 
                  item.upload_status === 'failed' ? 'failed' : 'processing',
          table_name: item.table_name
        }));

        setDatasets(formattedDatasets);
        console.log('Loaded datasets:', formattedDatasets);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
      addNotification({
        type: 'error',
        title: 'Error Loading Datasets',
        message: 'Failed to load your datasets'
      });
    }
  }, [setDatasets, addNotification]);

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

    const uploadId = Math.random().toString(36).substring(7);
    
    try {
      setUploading(true);

      // Add to uploading datasets with initial progress
      const uploadingDataset: Dataset = {
        id: uploadId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        upload_date: new Date().toISOString(),
        size: file.size,
        fileSize: file.size,
        rows: 0,
        rowCount: 0,
        columns: 0,
        columnCount: 0,
        status: 'processing',
        upload_progress: 0
      };
      
      addUploadingDataset(uploadingDataset);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        updateUploadingDataset(uploadId, { 
          upload_progress: Math.min((uploadingDataset.upload_progress || 0) + 15, 85) 
        });
      }, 300);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_name', file.name.replace(/\.[^/.]+$/, ""));

      const response = await apiClient.uploadDataset(formData) as {
        success: boolean;
        dataset_id?: string;
        table_name?: string;
        rows_processed?: number;
        columns_processed?: number;
        message?: string;
      };
      
      clearInterval(progressInterval);
      updateUploadingDataset(uploadId, { upload_progress: 100 });

      if (response.success) {
        // Move from uploading to completed
        setTimeout(() => {
          removeUploadingDataset(uploadId);
        }, 1000);

        addNotification({
          type: 'success',
          title: 'Upload Successful',
          message: `${file.name} has been uploaded and processed successfully`
        });

        // Reload datasets to show the new one
        loadDatasets();
      } else {
        throw new Error(response.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      const errorDetails = error instanceof Error ? error.stack : 'Unknown error occurred';
      
      // Update uploading dataset to failed
      updateUploadingDataset(uploadId, { 
        status: 'failed',
        error_message: errorMessage 
      });
      
      // Show error modal
      setErrorModal({
        isOpen: true,
        title: 'Upload Failed',
        message: errorMessage,
        details: errorDetails
      });
      
      // Also show notification
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage
      });
    } finally {
      setUploading(false);
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

  const showDeleteConfirmation = (dataset: Dataset) => {
    setDeleteConfirmModal({
      isOpen: true,
      dataset
    });
  };

  const handleDeleteDataset = async (datasetId: string) => {
    if (deletingIds.has(datasetId)) return;
    
    setDeletingIds(prev => new Set([...prev, datasetId]));
    
    try {
      await apiClient.deleteDataset(datasetId);
      removeDataset(datasetId);
      addNotification({
        type: 'success',
        title: 'Dataset Deleted',
        message: 'Dataset has been successfully deleted'
      });
      
      // Close confirmation modal first
      setDeleteConfirmModal({ isOpen: false, dataset: null });
      
      // Clear the deleting state immediately after successful delete
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(datasetId);
        return newSet;
      });
      
      // Reload datasets and deleted datasets to reflect changes
      await loadDatasets();
      await loadDeletedDatasets();
      
    } catch (error) {
      console.error('Delete error:', error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete dataset'
      });
      
      // Also clear the deleting state on error
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(datasetId);
        return newSet;
      });
    }
  };

  const handlePreviewDataset = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setPreviewModalOpen(true);
    setIsPreviewLoading(true);
    setPreviewData(null);
    
    try {
      const response = await apiClient.previewDataset(dataset.id, 10) as DatasetPreview;
      setPreviewData(response);
    } catch (error) {
      console.error('Preview error:', error);
      addNotification({
        type: 'error',
        title: 'Preview Failed',
        message: error instanceof Error ? error.message : 'Failed to load preview data'
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    setSelectedDataset(null);
    setPreviewData(null);
  };

  const loadDeletedDatasets = useCallback(async () => {
    try {
      const response = await apiClient.getDeletedDatasets() as {
        success: boolean;
        deleted_datasets: Array<{
          id: string;
          dataset_name: string;
          table_name: string;
          file_name: string;
          deleted_at: string;
          deleted_by?: string;
          file_size?: number;
          row_count?: number;
          column_count?: number;
        }>;
      };
      
      if (response.success && response.deleted_datasets) {
        setDeletedDatasets(response.deleted_datasets.map((item) => ({
          id: item.id,
          dataset_name: item.dataset_name,
          table_name: item.table_name,
          file_name: item.file_name,
          deleted_at: item.deleted_at,
          deleted_by: item.deleted_by || 'Unknown',
          file_size: item.file_size,
          row_count: item.row_count,
          column_count: item.column_count
        })));
      }
    } catch (error) {
      console.error('Error loading deleted datasets:', error);
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load deleted datasets'
      });
    }
  }, [setDeletedDatasets, addNotification]);

  const handleShowDeletedDatasets = () => {
    setShowDeletedModal(true);
    loadDeletedDatasets();
  };

  // Load data on component mount
  useEffect(() => {
    loadDatasets();
    loadDeletedDatasets();
  }, [loadDatasets, loadDeletedDatasets]);

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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {datasets.length + uploadingDatasets.length} total datasets
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShowDeletedDatasets}
              >
                View Deleted ({deletedDatasets.length})
              </Button>
            </div>

            {/* Uploading Datasets */}
            {uploadingDatasets.length > 0 && (
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-muted-foreground">Uploading</h4>
                {uploadingDatasets.map((dataset) => (
                  <div key={`uploading-${dataset.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{dataset.name}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress value={dataset.upload_progress || 0} className="flex-1" />
                            <span className="text-xs text-muted-foreground min-w-[3rem]">
                              {dataset.upload_progress || 0}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dataset.status === 'processing' ? 'Processing...' : 
                             dataset.status === 'failed' ? `Failed: ${dataset.error_message}` : 
                             'Uploading...'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started {new Date(dataset.upload_date).toLocaleDateString()} {new Date(dataset.upload_date).toLocaleTimeString()} by System
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={dataset.status === 'failed' ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {dataset.status === 'failed' ? (
                        <X className="h-3 w-3" />
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {dataset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Datasets */}
            {datasets.length > 0 ? (
              <div className="space-y-4">
                {uploadingDatasets.length > 0 && (
                  <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                )}
                {datasets.map((dataset) => (
                  <div key={`dataset-${dataset.id}`} className="flex items-center justify-between p-4 border rounded-lg">
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
                          Uploaded {new Date(dataset.upload_date).toLocaleDateString()} {new Date(dataset.upload_date).toLocaleTimeString()} by System
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={dataset.status === 'completed' || dataset.status === 'ready' ? 'default' : 
                                dataset.status === 'failed' || dataset.status === 'error' ? 'destructive' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {(dataset.status === 'completed' || dataset.status === 'ready') ? (
                          <Check className="h-3 w-3" />
                        ) : (dataset.status === 'failed' || dataset.status === 'error') ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {dataset.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePreviewDataset(dataset)}
                        disabled={dataset.status !== 'completed' && dataset.status !== 'ready'}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={deletingIds.has(dataset.id)}
                        onClick={() => showDeleteConfirmation(dataset)}
                      >
                        {deletingIds.has(dataset.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : uploadingDatasets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No datasets uploaded yet</p>
                <p className="text-sm">Upload your first file to get started</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Deleted Datasets Modal */}
      <Dialog open={showDeletedModal} onOpenChange={setShowDeletedModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Deleted Datasets
            </DialogTitle>
            <DialogDescription>
              View previously deleted datasets and their deletion history
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {deletedDatasets.length > 0 ? (
              deletedDatasets.map((dataset) => (
                <div key={`deleted-${dataset.id}`} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{dataset.dataset_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {dataset.file_name} • {dataset.row_count?.toLocaleString()} rows • {dataset.column_count} columns
                        {dataset.file_size && ` • ${formatFileSize(dataset.file_size)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deleted {new Date(dataset.deleted_at).toLocaleDateString()} {new Date(dataset.deleted_at).toLocaleTimeString()}
                        {dataset.deleted_by && ` by ${dataset.deleted_by}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Deleted
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No deleted datasets found</p>
                <p className="text-sm">Deleted datasets will appear here</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline"
              onClick={() => setShowDeletedModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmModal.isOpen} onOpenChange={(open) => 
        !open && setDeleteConfirmModal({ isOpen: false, dataset: null })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Dataset
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dataset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirmModal.dataset && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div><strong>Name:</strong> {deleteConfirmModal.dataset.name}</div>
                <div><strong>Size:</strong> {formatFileSize(deleteConfirmModal.dataset.fileSize)}</div>
                <div><strong>Rows:</strong> {deleteConfirmModal.dataset.rowCount.toLocaleString()}</div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmModal({ isOpen: false, dataset: null })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteConfirmModal.dataset ? deletingIds.has(deleteConfirmModal.dataset.id) : false}
              onClick={() => deleteConfirmModal.dataset && handleDeleteDataset(deleteConfirmModal.dataset.id)}
            >
              {deleteConfirmModal.dataset && deletingIds.has(deleteConfirmModal.dataset.id) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Dataset
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dataset Preview Modal */}
      <DatasetPreviewModal
        dataset={selectedDataset}
        previewData={previewData}
        isOpen={previewModalOpen}
        isLoading={isPreviewLoading}
        onClose={handleClosePreview}
      />

    </AppLayout>
  );
}
