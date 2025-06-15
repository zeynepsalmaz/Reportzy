'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import type { Dataset } from '@/types';

interface DeletedDatasetsModalProps {
  deletedDatasets: Dataset[];
  isOpen: boolean;
  onClose: () => void;
  onRestore?: (datasetId: string) => void;
  onPermanentDelete?: (datasetId: string) => void;
}

export function DeletedDatasetsModal({ 
  deletedDatasets, 
  isOpen, 
  onClose, 
  onRestore, 
  onPermanentDelete 
}: DeletedDatasetsModalProps) {
  
  const handleRestore = (datasetId: string) => {
    if (onRestore) {
      onRestore(datasetId);
    }
  };

  const handlePermanentDelete = (datasetId: string) => {
    if (onPermanentDelete) {
      onPermanentDelete(datasetId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deleted Datasets
          </DialogTitle>
          <DialogDescription>
            Manage your deleted datasets. You can restore or permanently delete them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {deletedDatasets.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No deleted datasets found.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {deletedDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-700">{dataset.name}</h4>
                      <Badge variant="secondary">
                        {dataset.rows.toLocaleString()} rows
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {dataset.filename} • {(dataset.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded: {new Date(dataset.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(dataset.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePermanentDelete(dataset.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            {deletedDatasets.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  // Clear all deleted datasets
                  deletedDatasets.forEach(dataset => handlePermanentDelete(dataset.id));
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
