import React, { useState } from 'react';
import { ChevronDown, MapPin, ExternalLink, Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SeverityPill = ({ severity }) => {
    const s = severity?.toLowerCase() || 'low';
    const styles = {
        critical: 'bg-[#FEE2E2] text-[#DC2626]',
        high: 'bg-[#FED7AA] text-[#EA580C]',
        medium: 'bg-[#FEF3C7] text-[#D97706]',
        low: 'bg-[#DBEAFE] text-[#2563EB]',
    };
    return (
        <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[s]}`}>
            {severity}
        </div>
    );
};

const InfoBlock = ({ title, children }) => (
    <div>
        <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em]">{title}</h4>
        <div className="text-sm text-[#374151] space-y-1">
            {children}
        </div>
    </div>
);

const VulnerabilityItem = ({ vulnerability }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const {
        package: packageName,
        current_version: currentVersion,
        severity = 'Medium',
        title,
        description,
        affected_ranges: affectedRanges,
        recommendation,
        advisory_url: advisoryUrl
    } = vulnerability;

    const displayTitle = `${packageName}@${currentVersion} — ${title}`;

    return (
        <div className={`bg-white rounded-xl transition-all duration-150 ${isOpen ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : 'shadow-[0_1px_3px_rgba(0,0,0,0.05)]'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full hover:bg-[#F9FAFB] px-6 py-4 transition-colors duration-150 group rounded-t-xl"
            >
                <div className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center gap-4">
                        <SeverityPill severity={severity} />
                        <span className="font-medium text-[#374151]">{displayTitle}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                             <MapPin className="w-4 h-4" strokeWidth={1.5} />
                             <span className="font-mono text-xs">package.json</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </div>
                </div>
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-[#F3F4F6]">
                   <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-6">
                            <InfoBlock title="Affected Versions">
                                <p><span className="font-semibold">{affectedRanges || 'N/A'}</span></p>
                            </InfoBlock>
                            
                            {advisoryUrl && (
                                <InfoBlock title="Advisory">
                                    <a 
                                        href={advisoryUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[#AFCB0E] hover:underline flex items-center gap-1"
                                    >
                                        View Details <ExternalLink className="w-3 h-3" />
                                    </a>
                                </InfoBlock>
                            )}
                        </div>
                       
                       <div className="md:col-span-2 space-y-6">
                            <InfoBlock title="Description">
                                <p>{description}</p>
                            </InfoBlock>

                            <InfoBlock title="Recommended Fix">
                                <p>{recommendation || 'Update to a secure version'}</p>
                            </InfoBlock>
                       </div>
                   </div>
                </div>
            )}
        </div>
    );
};

export default function DependenciesFindingsCard({ vulnerabilities = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');

    const filteredVulns = vulnerabilities.filter(vuln => {
        const matchesSearch = searchTerm === '' || 
            vuln.package?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vuln.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesSeverity = severityFilter === 'all' || 
            vuln.severity?.toLowerCase() === severityFilter.toLowerCase();
        
        return matchesSearch && matchesSeverity;
    });

    if (!vulnerabilities || vulnerabilities.length === 0) {
        return (
             <div className="bg-white p-12 text-center rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-medium text-[#374151]">No Vulnerabilities Found 🎉</h3>
                <p className="mt-2 text-[#6B7280]">All your dependencies appear to be secure.</p>
            </div>
        );
    }

    // Severity counts for summary
    const severityCounts = vulnerabilities.reduce((acc, vuln) => {
        const sev = vuln.severity?.toLowerCase() || 'low';
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                {['critical', 'high', 'medium', 'low'].map(severity => (
                    <div key={severity} className="bg-white p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-center">
                        <div className="text-2xl font-bold text-[#374151] tabular-nums">
                            {severityCounts[severity] || 0}
                        </div>
                        <div className="text-sm text-[#6B7280] capitalize">{severity}</div>
                    </div>
                ))}
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
                    <Input
                        placeholder="Search packages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#374151]"
                >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Findings List */}
            <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#6B7280] mb-4">
                    Security Vulnerabilities ({filteredVulns.length})
                </h3>
                <div className="space-y-2">
                    {filteredVulns.map((vulnerability, index) => (
                        <VulnerabilityItem vulnerability={vulnerability} key={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}