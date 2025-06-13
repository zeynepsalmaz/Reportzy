"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Dataset {
  id: number;
  dataset_name: string;
  table_name: string;
  file_name: string;
  file_size: number;
  row_count: number;
  column_count: number;
  upload_status: string;
  created_at: string;
}

interface PreviewData {
  success: boolean;
  dataset_name: string;
  preview: Record<string, unknown>[];
  total_rows?: number;
}

interface DatasetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  previewData: PreviewData | null;
  loading: boolean;
}

export function DatasetPreviewModal({ 
  isOpen, 
  onClose, 
  dataset, 
  previewData, 
  loading 
}: DatasetPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Dataset Preview</DialogTitle>
          <DialogDescription>
            {dataset && `Preview of ${dataset.dataset_name}`}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading preview...</span>
            </div>
          ) : previewData?.success && previewData.preview.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Dataset: {previewData.dataset_name}
                </h4>
                <span className="text-sm text-gray-600">
                  {previewData.preview.length} rows shown
                  {previewData.total_rows && ` (of ${previewData.total_rows} total)`}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData.preview[0]).map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.preview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value: unknown, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-sm text-gray-900 border border-gray-200"
                          >
                            {value !== null && value !== undefined 
                              ? String(value) 
                              : <span className="text-gray-400">N/A</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <p>No preview data available</p>
                {!previewData?.success && (
                  <p className="text-sm mt-2">Failed to load dataset preview</p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
