"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Database, 
  Eye, 
  Lightbulb, 
  Trash2, 
  RefreshCw,
  FileText,
  Calendar
} from "lucide-react";
import { Dataset, DeletedDataset } from "@/types";
import { DatasetPreviewModal } from "./DatasetPreviewModal";
import { DeletedDatasetsModal } from "./DeletedDatasetsModal";

const API_BASE = `http://localhost:8001/api`;

export function ImportData() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    success: boolean;
    dataset_name: string;
    preview: Record<string, unknown>[];
    total_rows?: number; 
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  
  // Deleted datasets modal state
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [deletedDatasets, setDeletedDatasets] = useState<DeletedDataset[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImportedDatasets();
  }, []);

  const loadImportedDatasets = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      }
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && datasetName.trim()) {
      uploadFile(file);
    } else if (!datasetName.trim()) {
      alert("Please enter a dataset name before uploading.");
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dataset_name", datasetName.trim());

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + Math.random() * 30, 90));
    }, 500);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully uploaded! ${result.rows_processed || result.rows_inserted} rows processed.`);
        setDatasetName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        loadImportedDatasets();
      } else {
        const error = await response.json();
        alert("Upload failed: " + (error.detail || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Network error occurred");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const previewDataset = async (datasetId: number) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;
    
    setSelectedDataset(dataset);
    setPreviewLoading(true);
    setPreviewOpen(true);
    
    try {
      const response = await fetch(`${API_BASE}/preview-dataset/${datasetId}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        setPreviewData({
          success: false,
          dataset_name: dataset.dataset_name,
          preview: []
        });
      }
    } catch (error) {
      console.error("Error previewing dataset:", error);
      setPreviewData({
        success: false,
        dataset_name: dataset.dataset_name,
        preview: []
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const deleteDataset = async (datasetId: number) => {
    if (!confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      return;
    }
    
    if (!confirm("This will permanently delete the dataset, table, and all related data. Continue?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/dataset/${datasetId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || "Dataset deleted successfully");
        loadImportedDatasets();
      } else {
        const error = await response.json();
        alert("Delete failed: " + (error.detail || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
      alert("Error deleting dataset");
    }
  };

  const generateInsights = async (datasetId: number) => {
    try {
      const response = await fetch(`${API_BASE}/generate-insights/${datasetId}`, {
        method: "POST"
      });

      if (response.ok) {
        alert("Insights generated successfully!");
      } else {
        alert("Failed to generate insights");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      alert("Error generating insights");
    }
  };

  const loadDeletedDatasets = async () => {
    setDeletedLoading(true);
    try {
      const response = await fetch(`${API_BASE}/deleted-datasets`);
      if (response.ok) {
        const data = await response.json();
        setDeletedDatasets(data.deleted_datasets || []);
      }
    } catch (error) {
      console.error("Error loading deleted datasets:", error);
    } finally {
      setDeletedLoading(false);
    }
  };

  const openDeletedDatasetsModal = () => {
    setDeletedOpen(true);
    loadDeletedDatasets();
  };

  const restoreDataset = async (datasetId: number) => {
    try {
      const response = await fetch(`${API_BASE}/restore-dataset/${datasetId}`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Dataset restored successfully!');
        loadDeletedDatasets();
        loadImportedDatasets();
      } else {
        alert('Failed to restore dataset');
      }
    } catch (error) {
      console.error('Error restoring dataset:', error);
      alert('Error restoring dataset');
    }
  };

  const permanentDeleteDataset = async (datasetId: number) => {
    if (!confirm('This will permanently delete the dataset. This action cannot be undone. Continue?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/permanent-delete/${datasetId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Dataset permanently deleted');
        loadDeletedDatasets();
      } else {
        alert('Failed to permanently delete dataset');
      }
    } catch (error) {
      console.error('Error permanently deleting dataset:', error);
      alert('Error deleting dataset');
    }
  };

  const downloadBackup = async (datasetId: number) => {
    try {
      const response = await fetch(`${API_BASE}/download-backup/${datasetId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `dataset_backup_${datasetId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download backup');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Error downloading backup');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📁 Import Your Data</h2>
        <p className="text-gray-600">Upload CSV or Excel files to get started with AI analytics</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="dataset-name" className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name
            </label>
            <Input
              id="dataset-name"
              placeholder="Enter a name for your dataset..."
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">Drop your files here or click to browse</p>
            <p className="text-sm text-gray-500">Supports CSV, Excel files (Max 50MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Imported Datasets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📁 Imported Datasets</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={openDeletedDatasetsModal}>
                <Trash2 className="h-4 w-4 mr-1" />
                View Deleted
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadImportedDatasets}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Database className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg mb-2">No datasets imported yet</p>
              <p className="text-sm">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset) => (
                <Card key={dataset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {dataset.dataset_name || dataset.table_name}
                          </h4>
                          <p className="text-sm text-gray-500">{dataset.file_name}</p>
                          <p className="text-xs text-gray-400 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(dataset.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className={getStatusColor(dataset.upload_status)}>
                          {dataset.upload_status}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-2">
                          <div className="flex items-center space-x-4">
                            <span>{dataset.row_count || 0} rows</span>
                            <span>{dataset.column_count || 0} columns</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatFileSize(dataset.file_size)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewDataset(dataset.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateInsights(dataset.id)}
                        >
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Insights
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDataset(dataset.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DatasetPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        dataset={selectedDataset}
        previewData={previewData}
        loading={previewLoading}
      />

      <DeletedDatasetsModal
        isOpen={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        deletedDatasets={deletedDatasets}
        loading={deletedLoading}
        onRestore={restoreDataset}
        onPermanentDelete={permanentDeleteDataset}
        onDownloadBackup={downloadBackup}
      />
    </div>
  );
}
