import { useState } from 'react';
import { Upload, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadInterfaceProps {
  onScanComplete: () => void;
}

export const UploadInterface = ({ onScanComplete }: UploadInterfaceProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file drop logic here
  };

  const handleFileSelect = () => {
    // Handle file selection logic here
  };

  const handleScan = () => {
    // Simulate scan process
    setTimeout(() => {
      onScanComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-foreground">NEPERIA</div>
            <div className="text-sm text-muted-foreground">Code Guardian</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-16 transition-colors ${
              isDragOver 
                ? 'border-accent bg-accent/5' 
                : 'border-border bg-muted/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <FileCode className="w-8 h-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <div className="text-lg font-medium text-foreground">
                  Drag & drop a file or{' '}
                  <button 
                    onClick={handleFileSelect}
                    className="text-accent hover:underline"
                  >
                    click to browse
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Upload your source code file for analysis
                </div>
              </div>
            </div>
          </div>

          {/* Scan Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleScan}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-2 rounded-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Scan File
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="text-sm text-muted-foreground">
          © 2025 Neperia. All rights reserved.
        </div>
      </div>
    </div>
  );
};