import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import RiskConfiguration from './RiskConfiguration';

interface RiskSettingsDrawerProps {
  children?: React.ReactNode;
}

export const RiskSettingsDrawer: React.FC<RiskSettingsDrawerProps> = ({ children }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Risk Settings
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto p-0 border-l border-border/30" style={{ background: 'rgba(245, 247, 250, 0.85)', backdropFilter: 'blur(24px) saturate(180%)' }}>
        <RiskConfiguration />
      </SheetContent>
    </Sheet>
  );
};

export default RiskSettingsDrawer;
