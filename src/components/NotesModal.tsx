'use client';

import { useState } from 'react';
import NotesComponent from '@/components/NotesComponent';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectType: 'property' | 'client' | 'viewing';
  objectId: number;
  objectName: string;
  modelName: string;
  appLabel: string;
}

export default function NotesModal({
  isOpen,
  onClose,
  objectType,
  objectId,
  objectName,
  modelName,
  appLabel,
}: NotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Notes for {objectName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <NotesComponent
            objectType={objectType}
            objectId={objectId}
            modelName={modelName}
            appLabel={appLabel}
          />
        </div>
      </div>
    </div>
  );
}
