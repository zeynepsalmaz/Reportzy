"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Download } from "lucide-react";

interface DeletedDataset {
  id: number;
  dataset_name: string;
  table_name: string;
  file_name: string;
  row_count: number;
  column_count: number;
  deleted_at: string;
  deleted_items: Record<string, unknown>;
  backup_path?: string;
}

interface DeletedDatasetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedDatasets: DeletedDataset[];
  loading: boolean;
  onRestore: (datasetId: number) => Promise<void>;
  onPermanentDelete: (datasetId: number) => Promise<void>;
  onDownloadBackup: (datasetId: number) => Promise<void>;
}

export function DeletedDatasetsModal({ 
  isOpen, 
  onClose, 
  deletedDatasets,
  loading,
  onRestore,
  onPermanentDelete,
  onDownloadBackup
}: DeletedDatasetsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',  
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Deleted Datasets
          </DialogTitle>
          <DialogDescription>
            Manage your deleted datasets. You can restore them or permanently delete them.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading deleted datasets...</span>
            </div>
          ) : deletedDatasets.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <Trash2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No deleted datasets</p>
                <p className="text-sm">When you delete datasets, they will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedDatasets.map((dataset) => (
                <div key={dataset.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{dataset.dataset_name}</h4>
                        <Badge variant="destructive" className="text-xs">
                          Deleted
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">File:</span>
                          <br />
                          {dataset.file_name}
                        </div>
                        <div>
                          <span className="font-medium">Records:</span>
                          <br />
                          {dataset.row_count.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Deleted:</span>
                          <br />
                          {formatDate(dataset.deleted_at)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRestore(dataset.id)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </Button>
                        
                        {dataset.backup_path && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownloadBackup(dataset.id)}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download Backup
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onPermanentDelete(dataset.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Permanently
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
