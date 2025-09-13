import React from 'react';
import { CheckCircle, Shield } from 'lucide-react';

interface EmptyStateProps {
  type?: 'code' | 'dependencies';
}

export function EmptyState({ type = 'code' }: EmptyStateProps) {
  const isCode = type === 'code';
  
  return (
    <div className="bg-white p-12 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {isCode ? 'No Security Issues Found' : 'No Vulnerable Dependencies Found'}
      </h3>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {isCode 
          ? 'Great! Your code passed our security analysis. Keep following secure coding practices to maintain this clean state.'
          : 'Excellent! All your dependencies appear to be secure and up-to-date. Regular scanning helps maintain this security posture.'
        }
      </p>
      
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>Keep secure coding practices</span>
      </div>
    </div>
  );
}