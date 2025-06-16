'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
}

export function ErrorModal({ isOpen, onClose, title, message, details }: ErrorModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base mt-4">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {details && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Technical Details:</h4>
            <div className="bg-gray-50 p-3 rounded-md text-xs font-mono text-gray-600 max-h-40 overflow-y-auto border">
              {details}
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
