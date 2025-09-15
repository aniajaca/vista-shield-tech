import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Search, Filter, Wrench, MapPin } from 'lucide-react';

interface Finding {
  id?: string;
  title?: string;
  name?: string;
  check_id?: string;
  message?: string;
  severity: string;
  adjustedScore?: number;
  cvss?: { baseScore?: number };
  file?: string;
  location?: { path?: string; line?: number };
  startLine?: number;
  line?: number;
  cwe?: { id?: string | number };
  owasp?: { category?: string };
  remediation?: any;
}

interface FindingsTableProps {
  findings: Finding[];
  onFindingClick: (finding: Finding) => void;
}

const SeverityChip = ({ severity }: { severity: string }) => {
  const severityConfig = {
    critical: 'severity-critical',
    high: 'severity-high', 
    medium: 'severity-medium',
    low: 'severity-low',
    info: 'severity-info'
  };

  const className = severityConfig[severity?.toLowerCase()] || 'severity-info';

  return (
    <span className={className}>
      {severity || 'Unknown'}
    </span>
  );
};

const QuickFixIndicator = ({ hasQuickFix }: { hasQuickFix: boolean }) => {
  if (!hasQuickFix) return null;
  
  return (
    <Badge variant="outline" className="text-xs">
      <Wrench className="w-3 h-3 mr-1" />
      Quick Fix
    </Badge>
  );
};

export default function FindingsTable({ findings, onFindingClick }: FindingsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fileFilter, setFileFilter] = useState('');
  const [scoreRange, setScoreRange] = useState([0, 10]);
  const [hasQuickFixOnly, setHasQuickFixOnly] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'severity',
    direction: 'desc'
  });

  // Extract unique values for filters
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    findings.forEach(f => {
      if (f.cwe?.id) categories.add(`CWE-${f.cwe.id}`);
      if (f.owasp?.category) categories.add(f.owasp.category);
    });
    return Array.from(categories).sort();
  }, [findings]);

  const uniqueFiles = useMemo(() => {
    const files = new Set<string>();
    findings.forEach(f => {
      const file = f.location?.path || f.file;
      if (file) files.add(file);
    });
    return Array.from(files).sort();
  }, [findings]);

  // Helper function to get display values
  const getDisplayTitle = (finding: Finding) => 
    finding.title || finding.name || finding.check_id || finding.message || 'Security Vulnerability';

  const getDisplayFile = (finding: Finding) => {
    const file = finding.location?.path || finding.file || 'Unknown';
    const line = finding.location?.line || finding.startLine || finding.line;
    return line ? `${file}:${line}` : file;
  };

  const getAdjustedScore = (finding: Finding) =>
    finding.adjustedScore || finding.cvss?.baseScore || 0;

  const getCvssBaseScore = (finding: Finding) =>
    finding.cvss?.baseScore || 0;

  const getCategory = (finding: Finding) => {
    if (finding.cwe?.id) return `CWE-${finding.cwe.id}`;
    if (finding.owasp?.category) return finding.owasp.category;
    return 'N/A';
  };

  const hasQuickFix = (finding: Finding) => {
    return Boolean(finding.remediation);
  };

  // Filter and sort findings
  const filteredAndSortedFindings = useMemo(() => {
    let filtered = findings.filter(finding => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const title = getDisplayTitle(finding).toLowerCase();
        const file = getDisplayFile(finding).toLowerCase();
        if (!title.includes(searchLower) && !file.includes(searchLower)) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter.length > 0 && !severityFilter.includes(finding.severity)) {
        return false;
      }

      // Category filter
      if (categoryFilter && getCategory(finding) !== categoryFilter) {
        return false;
      }

      // File filter
      if (fileFilter) {
        const file = finding.location?.path || finding.file;
        if (file !== fileFilter) return false;
      }

      // Score range filter
      const score = getAdjustedScore(finding);
      if (score < scoreRange[0] || score > scoreRange[1]) {
        return false;
      }

      // Quick fix filter
      if (hasQuickFixOnly && !hasQuickFix(finding)) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy.field) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
          aVal = severityOrder[a.severity?.toLowerCase()] || 0;
          bVal = severityOrder[b.severity?.toLowerCase()] || 0;
          break;
        case 'adjustedScore':
          aVal = getAdjustedScore(a);
          bVal = getAdjustedScore(b);
          break;
        case 'title':
          aVal = getDisplayTitle(a);
          bVal = getDisplayTitle(b);
          break;
        case 'file':
          aVal = getDisplayFile(a);
          bVal = getDisplayFile(b);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortBy.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [findings, searchTerm, severityFilter, categoryFilter, fileFilter, scoreRange, hasQuickFixOnly, sortBy]);

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSeverityFilter([]);
    setCategoryFilter('');
    setFileFilter('');
    setScoreRange([0, 10]);
    setHasQuickFixOnly(false);
  };

  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No Vulnerabilities Found</h3>
          <p className="text-muted-foreground">Great! Your code appears to be secure.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Security Findings ({filteredAndSortedFindings.length})</h3>
          {(searchTerm || severityFilter.length > 0 || categoryFilter || fileFilter || hasQuickFixOnly) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 py-4 border-t">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <Select
            value={severityFilter.join(',')}
            onValueChange={(value) => setSeverityFilter(value ? value.split(',') : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* File Filter */}
          <Select value={fileFilter} onValueChange={setFileFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Files" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Files</SelectItem>
              {uniqueFiles.map(file => (
                <SelectItem key={file} value={file}>{file}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick Fix Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quickfix"
              checked={hasQuickFixOnly}
              onCheckedChange={(checked) => setHasQuickFixOnly(checked as boolean)}
            />
            <label htmlFor="quickfix" className="text-sm font-medium">
              Has Quick Fix
            </label>
          </div>
        </div>

        {/* Score Range Filter */}
        <div className="pt-4 border-t">
          <label className="text-sm font-medium mb-2 block">
            Adjusted Score Range: {scoreRange[0]}-{scoreRange[1]}
          </label>
          <Slider
            value={scoreRange}
            onValueChange={setScoreRange}
            max={10}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredAndSortedFindings.length === 0 ? (
          <div className="p-8 text-center">
            <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No findings match your filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('severity')}
                    className="font-medium"
                  >
                    Severity <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('adjustedScore')}
                    className="font-medium"
                  >
                    Adjusted Score <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-medium">CVSS Base</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('title')}
                    className="font-medium"
                  >
                    Title/Message <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('file')}
                    className="font-medium"
                  >
                    File:Line <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-medium">Category</TableHead>
                <TableHead className="font-medium">Quick Fix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFindings.map((finding, index) => (
                <TableRow
                  key={finding.id || index}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onFindingClick(finding)}
                >
                  <TableCell>
                    <SeverityChip severity={finding.severity} />
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">
                    {getAdjustedScore(finding).toFixed(1)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {getCvssBaseScore(finding).toFixed(1)}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={getDisplayTitle(finding)}>
                      {getDisplayTitle(finding)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono text-xs truncate" title={getDisplayFile(finding)}>
                        {getDisplayFile(finding)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getCategory(finding)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <QuickFixIndicator hasQuickFix={hasQuickFix(finding)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}