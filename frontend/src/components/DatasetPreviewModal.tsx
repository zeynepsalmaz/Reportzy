'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, X } from 'lucide-react';
import type { Dataset } from '@/types';

interface DatasetPreviewModalProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DatasetPreviewModal({ dataset, isOpen, onClose }: DatasetPreviewModalProps) {
  if (!dataset) return null;

  // Mock preview data
  const mockPreviewData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Sales', salary: 50000 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 55000 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'IT', salary: 60000 },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', department: 'HR', salary: 48000 },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', department: 'Finance', salary: 52000 },
  ];

  const columns = mockPreviewData.length > 0 ? Object.keys(mockPreviewData[0]) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dataset Preview: {dataset.name}
          </DialogTitle>
          <DialogDescription>
            Showing first 5 rows of {dataset.rowCount.toLocaleString()} total rows
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
          <div className="border rounded-lg overflow-auto max-h-96">
            {mockPreviewData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPreviewData.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column} className="whitespace-nowrap">
                          {String((row as Record<string, unknown>)[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No preview data available
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Dataset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
