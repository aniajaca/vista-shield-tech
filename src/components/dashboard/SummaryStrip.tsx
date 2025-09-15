import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Zap } from 'lucide-react';

interface SummaryStripProps {
  riskScore: number;
  riskLevel: string;
  findings: Record<string, number>;
  scanTime: string;
  engine: string;
  rulesExecuted: number | string;
  semgrepVersion?: string;
}

const SeverityChip = ({ severity, count }: { severity: string; count: number }) => {
  const severityConfig = {
    critical: { bg: 'bg-critical', text: 'text-critical-foreground' },
    high: { bg: 'bg-high', text: 'text-high-foreground' },
    medium: { bg: 'bg-medium', text: 'text-medium-foreground' },
    low: { bg: 'bg-low', text: 'text-low-foreground' },
    info: { bg: 'bg-info', text: 'text-info-foreground' }
  };

  const config = severityConfig[severity.toLowerCase()] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <div className={`${config.bg} ${config.text} px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1`}>
      <span className="capitalize">{severity}</span>
      <span className="tabular-nums">{count}</span>
    </div>
  );
};

export default function SummaryStrip({
  riskScore,
  riskLevel,
  findings,
  scanTime,
  engine,
  rulesExecuted,
  semgrepVersion
}: SummaryStripProps) {
  const totalFindings = Object.values(findings).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0);

  return (
    <div className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Score Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Overall Risk</h3>
              </div>
              <div className="text-4xl font-bold text-foreground tabular-nums">
                {riskScore.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {riskLevel} Risk
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                Adjusted from CVSS using context
              </Badge>
            </CardContent>
          </Card>

          {/* Findings Breakdown Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Findings by Severity ({totalFindings})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(findings)
                  .filter(([_, count]) => count > 0)
                  .sort(([a], [b]) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
                    return order[a.toLowerCase()] - order[b.toLowerCase()];
                  })
                  .map(([severity, count]) => (
                    <SeverityChip key={severity} severity={severity} count={count} />
                  ))}
                {totalFindings === 0 && (
                  <div className="text-sm text-muted-foreground">No vulnerabilities found</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scan Metadata Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Scan Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Scan Time</span>
                  <span className="text-sm font-medium tabular-nums">{scanTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Engine</span>
                  <span className="text-sm font-medium">{engine}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rules Applied</span>
                  <span className="text-sm font-medium tabular-nums">{rulesExecuted}</span>
                </div>
                {semgrepVersion && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium font-mono">{semgrepVersion}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}