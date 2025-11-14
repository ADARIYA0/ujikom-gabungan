'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CustomValidationProps {
  message: string;
  className?: string;
}

export default function CustomValidation({ message, className = "" }: CustomValidationProps) {
  return (
    <div className={`
      mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2
      animate-in slide-in-from-top-2 fade-in-0 duration-200
      ${className}
    `}>
      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 leading-relaxed">
        {message}
      </p>
    </div>
  );
}
