// Utility functions for processing security findings

export interface Finding {
  id?: string;
  title?: string;
  name?: string;
  check_id?: string;
  message?: string;
  severity: string;
  cwe?: { id: string; name?: string; description?: string };
  owasp?: { category?: string; title?: string };
  cvss?: { 
    baseScore?: number; 
    adjustedScore?: number; 
    vector?: string; 
  };
  risk?: {
    original?: { cvss?: number; vector?: string };
    adjusted?: { score?: number; adjustments?: Record<string, any> };
  };
  location?: { 
    path?: string; 
    file?: string; 
    line?: number; 
    row?: number; 
  };
  start?: { path?: string; file?: string; line?: number; row?: number };
  file?: string;
  code?: string;
  extractedCode?: string;
  codeSnippet?: string;
  extra?: { lines?: string };
  description?: string;
  remediation?: any;
  scope?: string;
  functionName?: string;
  route?: string;
}

export interface GroupedFinding extends Finding {
  duplicateLines?: number[];
  duplicateCount?: number;
}

/**
 * Groups similar findings to reduce noise
 * Groups by (file, cwe, scope) where scope is function/route name or "global"
 */
export function deduplicateFindings(findings: Finding[]): GroupedFinding[] {
  const groups = new Map<string, Finding[]>();

  // Group findings
  findings.forEach(finding => {
    const file = finding.location?.path || finding.location?.file || finding.start?.path || finding.start?.file || finding.file || 'unknown';
    const cwe = finding.cwe?.id || 'unknown';
    const scope = finding.scope || finding.functionName || finding.route || 'global';
    
    const groupKey = `${file}:${cwe}:${scope}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(finding);
  });

  // Process each group
  const deduplicated: GroupedFinding[] = [];

  groups.forEach(groupFindings => {
    if (groupFindings.length === 1) {
      deduplicated.push(groupFindings[0]);
      return;
    }

    // Sort by severity (critical > high > medium > low > info)
    const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    groupFindings.sort((a, b) => {
      const aScore = severityOrder[a.severity?.toLowerCase()] || 1;
      const bScore = severityOrder[b.severity?.toLowerCase()] || 1;
      return bScore - aScore;
    });

    const representative = groupFindings[0];
    const duplicateLines = groupFindings.slice(1).map(f => {
      return f.location?.line || f.location?.row || f.start?.line || f.start?.row || 0;
    }).filter(line => line > 0);

    deduplicated.push({
      ...representative,
      duplicateLines,
      duplicateCount: groupFindings.length - 1
    });
  });

  return deduplicated.sort((a, b) => {
    // Sort by severity, then by file
    const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    const aScore = severityOrder[a.severity?.toLowerCase()] || 1;
    const bScore = severityOrder[b.severity?.toLowerCase()] || 1;
    
    if (aScore !== bScore) {
      return bScore - aScore;
    }
    
    const aFile = a.location?.path || a.location?.file || a.file || '';
    const bFile = b.location?.path || b.location?.file || b.file || '';
    return aFile.localeCompare(bFile);
  });
}

/**
 * Get risk level color classes based on severity
 */
export function getRiskLevelStyles(level: string) {
  const normalizedLevel = level?.toLowerCase() || 'minimal';
  
  switch (normalizedLevel) {
    case 'critical':
      return {
        bg: 'bg-critical/10',
        text: 'text-critical',
        border: 'border-critical/20',
        badge: 'bg-critical text-critical-foreground'
      };
    case 'high':
      return {
        bg: 'bg-high/10',
        text: 'text-high',
        border: 'border-high/20',
        badge: 'bg-high text-high-foreground'
      };
    case 'medium':
      return {
        bg: 'bg-medium/10',
        text: 'text-medium',
        border: 'border-medium/20',
        badge: 'bg-medium text-medium-foreground'
      };
    case 'low':
      return {
        bg: 'bg-low/10',
        text: 'text-low',
        border: 'border-low/20',
        badge: 'bg-low text-low-foreground'
      };
    case 'info':
    case 'minimal':
      return {
        bg: 'bg-info/10',
        text: 'text-info',
        border: 'border-info/20',
        badge: 'bg-info text-info-foreground'
      };
    default:
      return {
        bg: 'bg-muted/10',
        text: 'text-muted-foreground',
        border: 'border-muted/20',
        badge: 'bg-muted text-muted-foreground'
      };
  }
}

/**
 * Format scan time for display
 */
export function formatScanTime(startTime: number, endTime?: number, backendTime?: number): string {
  if (backendTime && backendTime > 0) {
    return backendTime < 1000 ? `${Math.round(backendTime)}ms` : `${(backendTime / 1000).toFixed(2)}s`;
  }
  
  if (endTime && startTime) {
    const duration = endTime - startTime;
    return duration < 1000 ? `${Math.round(duration)}ms` : `${(duration / 1000).toFixed(2)}s`;
  }
  
  return 'N/A';
}

/**
 * Get CVSS score color
 */
export function getCvssScoreColor(score: number): string {
  if (score >= 9.0) return 'text-red-600';
  if (score >= 7.0) return 'text-orange-600';
  if (score >= 4.0) return 'text-amber-600';
  if (score >= 0.1) return 'text-lime-600';
  return 'text-gray-600';
}

/**
 * Generate CWE link
 */
export function getCweLink(cweId: string): string {
  const cleanId = cweId.replace('CWE-', '');
  return `https://cwe.mitre.org/data/definitions/${cleanId}.html`;
}