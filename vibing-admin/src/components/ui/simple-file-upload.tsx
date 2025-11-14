"use client";

import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, FileText, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface SimpleFileUploadProps {
  label: string;
  accept: string[];
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  currentFile?: File;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export default function SimpleFileUpload({
  label,
  accept,
  onFileSelected,
  onFileRemoved,
  currentFile,
  disabled = false,
  required = false,
  error
}: SimpleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    onFileSelected(file);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onFileRemoved();
  };

  const handleReplaceFile = () => {
    handleRemoveFile();
    fileInputRef.current?.click();
  };

  const renderPreview = () => {
    if (!currentFile) return null;

    // Truncate filename if too long
    const truncateFilename = (filename: string, maxLength: number = 20) => {
      if (filename.length <= maxLength) return filename;
      const extension = filename.split('.').pop();
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
      return `${truncatedName}.${extension}`;
    };

    return (
      <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-w-full overflow-hidden">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {currentFile.type.startsWith('image/') ? (
                <div className="relative">
                  <img
                    src={previewUrl || URL.createObjectURL(currentFile)}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded border"
                  />
                </div>
              ) : currentFile.type === 'application/pdf' ? (
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded border">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded border">
                  <ImageIcon className="w-6 h-6 text-gray-600" />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={currentFile.name}>
                {truncateFilename(currentFile.name)}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round(currentFile.size / 1024)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReplaceFile}
              disabled={disabled}
              className="text-xs px-2 py-1"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Ganti
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              disabled={disabled}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        <Upload className="w-4 h-4" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        
        {!currentFile ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-full h-24 border-2 border-dashed border-teal-300 hover:border-teal-400 hover:bg-teal-50 flex flex-col items-center justify-center space-y-2 text-teal-600 hover:text-teal-700 transition-all duration-200"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Klik untuk upload file</span>
            </Button>
            <p className="text-xs text-gray-500 text-center">
              {accept.map(type => type.replace('.', '').toUpperCase()).join(', ')} • Max 10MB
            </p>
          </div>
        ) : (
          renderPreview()
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
