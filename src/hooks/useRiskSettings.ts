import { useState, useEffect } from 'react';

export interface SeverityPoints {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface RiskThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
  minimal: number;
}

export interface EnvironmentalFactor {
  enabled: boolean;
  weight?: number; // multiplier factors (file-level)
  value?: number;  // additive factors (vuln-level)
}

export interface EnvironmentalFactors {
  internetFacing: EnvironmentalFactor;
  handlesPI: EnvironmentalFactor;
  production: EnvironmentalFactor;
  legacyCode: EnvironmentalFactor;
  businessCritical: EnvironmentalFactor;
  compliance: EnvironmentalFactor;
  thirdPartyIntegration: EnvironmentalFactor;
  complexAuth: EnvironmentalFactor;
  publicAPI: EnvironmentalFactor;
  noWAF: EnvironmentalFactor;
}

export interface RiskConfig {
  severityPoints: SeverityPoints;
  riskThresholds: RiskThresholds;
}

export interface RiskContext {
  production?: boolean;
  internetFacing?: boolean;
  factors: Record<string, EnvironmentalFactor>;
}

export interface RiskProfile {
  id: string;
  name: string;
  description: string;
  severityPoints: SeverityPoints;
  riskThresholds: RiskThresholds;
  factors: Partial<EnvironmentalFactors>;
}

export interface CustomFactor {
  id: string;
  name: string;
  level: 'file' | 'vulnerability';
  type: 'multiplier' | 'additive';
  defaultValue: number;
  rationale: string;
}

// Default profiles
const DEFAULT_PROFILES: RiskProfile[] = [
  {
    id: 'public-web-app',
    name: 'Public Web App',
    description: 'Internet-facing web application',
    severityPoints: { critical: 25, high: 15, medium: 8, low: 3, info: 1 },
    riskThresholds: { critical: 80, high: 60, medium: 40, low: 20, minimal: 0 },
    factors: {
      internetFacing: { enabled: true, weight: 1.5 },
      handlesPI: { enabled: true, weight: 1.4 },
      production: { enabled: true, weight: 1.3 },
      publicAPI: { enabled: true, value: 1.2 }
    }
  },
  {
    id: 'internal-tool',
    name: 'Internal Tool',
    description: 'Internal corporate application',
    severityPoints: { critical: 20, high: 12, medium: 6, low: 2, info: 1 },
    riskThresholds: { critical: 75, high: 55, medium: 35, low: 15, minimal: 0 },
    factors: {
      production: { enabled: true, weight: 1.2 },
      businessCritical: { enabled: true, weight: 1.3 },
      compliance: { enabled: true, weight: 1.2 }
    }
  },
  {
    id: 'legacy-system',
    name: 'Legacy System',
    description: 'Older system with technical debt',
    severityPoints: { critical: 30, high: 18, medium: 10, low: 4, info: 1 },
    riskThresholds: { critical: 85, high: 65, medium: 45, low: 25, minimal: 0 },
    factors: {
      legacyCode: { enabled: true, weight: 1.6 },
      production: { enabled: true, weight: 1.4 },
      thirdPartyIntegration: { enabled: true, weight: 1.3 }
    }
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    description: 'Public API service',
    severityPoints: { critical: 28, high: 16, medium: 9, low: 3, info: 1 },
    riskThresholds: { critical: 82, high: 62, medium: 42, low: 22, minimal: 0 },
    factors: {
      internetFacing: { enabled: true, weight: 1.7 },
      publicAPI: { enabled: true, value: 1.5 },
      thirdPartyIntegration: { enabled: true, weight: 1.3 },
      noWAF: { enabled: true, value: 1.3 }
    }
  },
  {
    id: 'development',
    name: 'Development',
    description: 'Development environment',
    severityPoints: { critical: 15, high: 10, medium: 5, low: 2, info: 1 },
    riskThresholds: { critical: 70, high: 50, medium: 30, low: 10, minimal: 0 },
    factors: {
      legacyCode: { enabled: false, weight: 1.0 },
      production: { enabled: false, weight: 1.0 }
    }
  }
];

// Default factor definitions
const DEFAULT_FACTORS: EnvironmentalFactors = {
  internetFacing: { enabled: false, weight: 1.5 },
  handlesPI: { enabled: false, weight: 1.4 },
  production: { enabled: false, weight: 1.3 },
  legacyCode: { enabled: false, weight: 1.2 },
  businessCritical: { enabled: false, weight: 1.3 },
  compliance: { enabled: false, weight: 1.2 },
  thirdPartyIntegration: { enabled: false, weight: 1.3 },
  complexAuth: { enabled: false, weight: 1.2 },
  publicAPI: { enabled: false, value: 1.2 },
  noWAF: { enabled: false, value: 1.3 }
};

const FACTOR_METADATA = {
  internetFacing: { 
    label: 'Internet Facing', 
    description: 'Application accessible from the public internet',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.2, 2.0]
  },
  handlesPI: { 
    label: 'Handles Personal Information', 
    description: 'Processes or stores personal/sensitive data',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.2, 1.8]
  },
  production: { 
    label: 'Production Environment', 
    description: 'Running in production environment',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.2, 1.5]
  },
  legacyCode: { 
    label: 'Legacy Code', 
    description: 'Older codebase with potential technical debt',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.2, 2.0]
  },
  businessCritical: { 
    label: 'Business Critical', 
    description: 'Critical to business operations',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.2, 1.6]
  },
  compliance: { 
    label: 'Compliance Required', 
    description: 'Subject to regulatory compliance requirements',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.1, 1.4]
  },
  thirdPartyIntegration: { 
    label: 'Third Party Integration', 
    description: 'Integrates with external services',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.1, 1.5]
  },
  complexAuth: { 
    label: 'Complex Authentication', 
    description: 'Uses complex authentication mechanisms',
    level: 'file',
    type: 'multiplier',
    recommendedRange: [1.1, 1.3]
  },
  publicAPI: { 
    label: 'Public API', 
    description: 'Exposes public API endpoints',
    level: 'vulnerability',
    type: 'additive',
    recommendedRange: [0.5, 2.0]
  },
  noWAF: { 
    label: 'No WAF Protection', 
    description: 'Not protected by Web Application Firewall',
    level: 'vulnerability',
    type: 'additive',
    recommendedRange: [0.5, 2.0]
  }
};

export const useRiskSettings = () => {
  const [selectedProfile, setSelectedProfile] = useState<string>('public-web-app');
  const [severityPoints, setSeverityPoints] = useState<SeverityPoints>(DEFAULT_PROFILES[0].severityPoints);
  const [riskThresholds, setRiskThresholds] = useState<RiskThresholds>(DEFAULT_PROFILES[0].riskThresholds);
  const [factors, setFactors] = useState<EnvironmentalFactors>(DEFAULT_FACTORS);
  const [customFactors, setCustomFactors] = useState<CustomFactor[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('riskSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedProfile) setSelectedProfile(parsed.selectedProfile);
        if (parsed.severityPoints) setSeverityPoints(parsed.severityPoints);
        if (parsed.riskThresholds) setRiskThresholds(parsed.riskThresholds);
        if (parsed.factors) setFactors({ ...DEFAULT_FACTORS, ...parsed.factors });
        if (parsed.customFactors) setCustomFactors(parsed.customFactors);
      }
    } catch (error) {
      console.warn('Failed to load risk settings from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    const settings = {
      selectedProfile,
      severityPoints,
      riskThresholds,
      factors,
      customFactors
    };
    try {
      localStorage.setItem('riskSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save risk settings to localStorage:', error);
    }
  }, [selectedProfile, severityPoints, riskThresholds, factors, customFactors]);

  const loadProfile = (profileId: string) => {
    const profile = DEFAULT_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profileId);
      setSeverityPoints(profile.severityPoints);
      setRiskThresholds(profile.riskThresholds);
      
      // Merge profile factors with defaults
      const newFactors = { ...DEFAULT_FACTORS };
      Object.entries(profile.factors).forEach(([key, value]) => {
        if (newFactors[key as keyof EnvironmentalFactors]) {
          newFactors[key as keyof EnvironmentalFactors] = value;
        }
      });
      setFactors(newFactors);
    }
  };

  const resetToDefaults = async () => {
    try {
      // In a real app, you'd fetch from /config/defaults
      loadProfile('public-web-app');
    } catch (error) {
      console.warn('Failed to load defaults, using built-in defaults');
      loadProfile('public-web-app');
    }
  };

  const updateFactor = (factorId: keyof EnvironmentalFactors, updates: Partial<EnvironmentalFactor>) => {
    setFactors(prev => ({
      ...prev,
      [factorId]: { ...prev[factorId], ...updates }
    }));
  };

  const addCustomFactor = (factor: Omit<CustomFactor, 'id'>) => {
    const newFactor: CustomFactor = {
      ...factor,
      id: `custom_${Date.now()}`
    };
    setCustomFactors(prev => [...prev, newFactor]);
  };

  const removeCustomFactor = (factorId: string) => {
    setCustomFactors(prev => prev.filter(f => f.id !== factorId));
  };

  // Generate API payload objects
  const getRiskConfig = (): RiskConfig => ({
    severityPoints,
    riskThresholds
  });

  const getRiskContext = (): RiskContext => {
    const enabledFactors = Object.entries(factors)
      .filter(([_, factor]) => factor.enabled)
      .reduce((acc, [key, factor]) => {
        acc[key] = factor;
        return acc;
      }, {} as Record<string, EnvironmentalFactor>);

    return {
      production: factors.production?.enabled || false,
      internetFacing: factors.internetFacing?.enabled || false,
      factors: enabledFactors
    };
  };

  return {
    // Current settings
    selectedProfile,
    severityPoints,
    riskThresholds,
    factors,
    customFactors,
    
    // UI state
    isDrawerOpen,
    setIsDrawerOpen,
    
    // Actions
    setSelectedProfile,
    setSeverityPoints,
    setRiskThresholds,
    setFactors,
    loadProfile,
    resetToDefaults,
    updateFactor,
    addCustomFactor,
    removeCustomFactor,
    
    // API helpers
    getRiskConfig,
    getRiskContext,
    
    // Constants
    profiles: DEFAULT_PROFILES,
    factorMetadata: FACTOR_METADATA
  };
};