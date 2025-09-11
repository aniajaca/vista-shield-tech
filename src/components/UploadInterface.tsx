import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-8 py-6">
        <div className="flex items-baseline space-x-2">
          <div className="text-lg font-semibold text-gray-900">NEPERIA</div>
          <div className="text-sm text-gray-500">Code Guardian</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-full max-w-lg">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-20 transition-colors ${
              isDragOver 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              
              <div className="text-center">
                <div className="text-base text-gray-900 mb-1">
                  Drag & drop a file or{' '}
                  <button 
                    onClick={handleFileSelect}
                    className="text-green-600 underline hover:text-green-700"
                  >
                    click to browse
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Upload your source code file for analysis
                </div>
              </div>
            </div>
          </div>

          {/* Scan Button */}
          <div className="flex justify-end mt-8">
            <Button 
              onClick={handleScan}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              <Upload className="w-4 h-4 mr-2" />
              Scan File
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="text-sm text-gray-400">
          © 2025 Neperia. All rights reserved.
        </div>
      </div>
    </div>
  );
};