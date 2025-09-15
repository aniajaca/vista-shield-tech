import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, FileText, Download } from 'lucide-react';

interface HeaderProps {
  backendStatus: 'online' | 'offline' | 'checking';
  activeTab: 'scanner' | 'dependencies';
  onTabChange: (tab: 'scanner' | 'dependencies') => void;
  hasResults: boolean;
  onNewScan: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
}

export default function Header({ 
  backendStatus, 
  activeTab, 
  onTabChange, 
  hasResults, 
  onNewScan, 
  onExport, 
  onOpenSettings 
}: HeaderProps) {
  const statusConfig = {
    online: { text: 'Backend Online', variant: 'default' as const, className: 'bg-green-100 text-green-700 hover:bg-green-100' },
    offline: { text: 'Backend Offline', variant: 'destructive' as const, className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    checking: { text: 'Checking...', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' }
  };

  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fc56c3a44_image.png" 
                alt="Neperia Logo" 
                className="h-6 w-6 grayscale opacity-40" 
              />
              <h1 className="text-xl font-semibold text-foreground">NEPERIA</h1>
              <span className="text-sm text-muted-foreground">Security Scanner</span>
            </div>
            <Badge 
              variant={statusConfig[backendStatus].variant}
              className={statusConfig[backendStatus].className}
            >
              ● {statusConfig[backendStatus].text}
            </Badge>
          </div>

          {/* Center: Tabs */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => onTabChange('scanner')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'scanner'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Code Scanner
            </button>
            <button
              onClick={() => onTabChange('dependencies')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'dependencies'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dependencies
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {hasResults && (
              <>
                <Button variant="outline" size="sm" onClick={onNewScan}>
                  <FileText className="w-4 h-4 mr-2" />
                  Scan Another
                </Button>
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Risk Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}