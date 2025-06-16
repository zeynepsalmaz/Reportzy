'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, X, Loader2 } from 'lucide-react';
import type { Dataset, DatasetPreview } from '@/types';
import styles from './styles/DatasetPreviewModal.module.css';

interface DatasetPreviewModalProps {
  dataset: Dataset | null;
  previewData: DatasetPreview | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export function DatasetPreviewModal({ dataset, previewData, isOpen, isLoading, onClose }: DatasetPreviewModalProps) {
  if (!dataset) return null;

  const columns = previewData?.columns || [];
  const rows = previewData?.preview_data || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={styles.modal}>
        <div className={styles.modalContent}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Dataset Preview: {dataset.name}
            </DialogTitle>
            <DialogDescription>
              {previewData 
                ? `Showing first ${rows.length} rows of ${previewData.dataset_info.row_count.toLocaleString()} total rows`
                : 'Loading preview data...'
              }
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-4">
          {/* Dataset Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {dataset.rowCount.toLocaleString()} rows
            </Badge>
            <Badge variant="secondary">
              {dataset.columnCount} columns
            </Badge>
            <Badge variant="secondary">
              {(dataset.fileSize / 1024 / 1024).toFixed(2)} MB
            </Badge>
            <Badge 
              variant={dataset.status === 'completed' ? 'default' : 'destructive'}
            >
              {dataset.status}
            </Badge>
          </div>

          {/* Preview Table */}
          <div className={styles.tableContainer}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <Loader2 className={`h-6 w-6 ${styles.loadingSpinner}`} />
                <p>Loading preview data...</p>
              </div>
            ) : rows.length > 0 ? (
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className={styles.tableHeaderCell}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className={styles.tableRow}>
                      {columns.map((column) => (
                        <td 
                          key={column} 
                          className={styles.tableCell}
                          title={String((row as Record<string, unknown>)[column] ?? '')}
                        >
                          {String((row as Record<string, unknown>)[column] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>
                <p>No preview data available</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="outline" onClick={onClose} size="sm">
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
            <Button disabled={!previewData} size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
