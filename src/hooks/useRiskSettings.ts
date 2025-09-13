import { useState, useCallback } from 'react';

interface RiskConfig {
  severityPoints: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  riskThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    minimal: number;
  };
}

interface RiskContext {
  internetFacing: boolean;
  production: boolean;
  handlesPI: boolean;
  legacyCode: boolean;
  businessCritical: boolean;
  compliance: boolean;
  thirdPartyIntegration: boolean;
  complexAuth: boolean;
  customFactors: Record<string, {
    enabled: boolean;
    weight?: number;
    value?: number;
    type: 'multiplier' | 'additive';
  }>;
}

interface RiskProfile {
  name: string;
  createdAt: string;
  updatedAt: string;
  riskConfig: RiskConfig;
  context: RiskContext;
}

const defaultRiskConfig: RiskConfig = {
  severityPoints: {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 1
  },
  riskThresholds: {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20,
    minimal: 0
  }
};

const defaultContext: RiskContext = {
  internetFacing: false,
  production: false,
  handlesPI: false,
  legacyCode: false,
  businessCritical: false,
  compliance: false,
  thirdPartyIntegration: false,
  complexAuth: false,
  customFactors: {}
};

const defaultProfiles: RiskProfile[] = [
  {
    name: "Public Web App",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    riskConfig: defaultRiskConfig,
    context: {
      ...defaultContext,
      internetFacing: true,
      production: true,
      handlesPI: true,
      customFactors: {
        internetFacing: { enabled: true, weight: 1.6, type: 'multiplier' },
        production: { enabled: true, weight: 1.3, type: 'multiplier' },
        handlesPI: { enabled: true, weight: 1.2, type: 'multiplier' }
      }
    }
  },
  {
    name: "Internal Tool",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    riskConfig: defaultRiskConfig,
    context: {
      ...defaultContext,
      production: true,
      customFactors: {
        production: { enabled: true, weight: 1.2, type: 'multiplier' }
      }
    }
  },
  {
    name: "Legacy System",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    riskConfig: defaultRiskConfig,
    context: {
      ...defaultContext,
      legacyCode: true,
      production: true,
      businessCritical: true,
      customFactors: {
        legacyCode: { enabled: true, weight: 1.3, type: 'multiplier' },
        production: { enabled: true, weight: 1.2, type: 'multiplier' },
        businessCritical: { enabled: true, weight: 1.2, type: 'multiplier' }
      }
    }
  }
];

export function useRiskSettings() {
  const [riskConfig, setRiskConfig] = useState<RiskConfig>(() => {
    const saved = localStorage.getItem('neperiaCurrentRiskConfig');
    return saved ? JSON.parse(saved) : defaultRiskConfig;
  });

  const [context, setContext] = useState<RiskContext>(() => {
    const saved = localStorage.getItem('neperiaCurrentRiskContext');
    return saved ? JSON.parse(saved) : defaultContext;
  });

  const [profiles, setProfiles] = useState<RiskProfile[]>(() => {
    const saved = localStorage.getItem('neperiaRiskProfiles');
    return saved ? JSON.parse(saved) : defaultProfiles;
  });

  const [lastScan, setLastScan] = useState<{ endpoint: string; payload: any } | null>(() => {
    const saved = localStorage.getItem('neperiaLastScan');
    return saved ? JSON.parse(saved) : null;
  });

  const saveCurrentProfile = useCallback(() => {
    localStorage.setItem('neperiaCurrentRiskConfig', JSON.stringify(riskConfig));
    localStorage.setItem('neperiaCurrentRiskContext', JSON.stringify(context));
  }, [riskConfig, context]);

  const saveLastScan = useCallback((endpoint: string, payload: any) => {
    const scanData = { endpoint, payload };
    setLastScan(scanData);
    localStorage.setItem('neperiaLastScan', JSON.stringify(scanData));
  }, []);

  const loadProfile = useCallback((profile: RiskProfile) => {
    setRiskConfig(profile.riskConfig);
    setContext(profile.context);
  }, []);

  const saveProfile = useCallback((name: string) => {
    const newProfile: RiskProfile = {
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskConfig,
      context
    };

    const updatedProfiles = [...profiles.filter(p => p.name !== name), newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('neperiaRiskProfiles', JSON.stringify(updatedProfiles));
  }, [profiles, riskConfig, context]);

  const deleteProfile = useCallback((name: string) => {
    const updatedProfiles = profiles.filter(p => p.name !== name);
    setProfiles(updatedProfiles);
    localStorage.setItem('neperiaRiskProfiles', JSON.stringify(updatedProfiles));
  }, [profiles]);

  const getEnabledFactorsCount = useCallback(() => {
    const contextFactors = Object.values(context).filter((value, index, array) => {
      // Exclude customFactors object from boolean count
      return typeof value === 'boolean' && value;
    }).length;
    const customFactors = Object.values(context.customFactors).filter(f => f.enabled).length;
    return contextFactors + customFactors;
  }, [context]);

  const addCustomFactor = useCallback((id: string, type: 'multiplier' | 'additive', value: number) => {
    setContext(prev => ({
      ...prev,
      customFactors: {
        ...prev.customFactors,
        [id]: { enabled: true, type, [type === 'multiplier' ? 'weight' : 'value']: value }
      }
    }));
  }, []);

  const removeCustomFactor = useCallback((id: string) => {
    setContext(prev => {
      const { [id]: removed, ...rest } = prev.customFactors;
      return { ...prev, customFactors: rest };
    });
  }, []);

  const resetToDefaults = useCallback(async () => {
    try {
      // In real implementation, fetch from /config/defaults
      setRiskConfig(defaultRiskConfig);
      setContext(defaultContext);
    } catch (error) {
      console.warn('Failed to load defaults from backend, using built-in defaults');
      setRiskConfig(defaultRiskConfig);
      setContext(defaultContext);
    }
  }, []);

  const getRiskConfig = useCallback(() => riskConfig, [riskConfig]);
  
  const getRiskContext = useCallback(() => {
    // Format for backend API
    return {
      internetFacing: context.internetFacing,
      production: context.production,
      handlesPI: context.handlesPI,
      legacyCode: context.legacyCode,
      businessCritical: context.businessCritical,
      compliance: context.compliance,
      thirdPartyIntegration: context.thirdPartyIntegration,
      complexAuth: context.complexAuth,
      customFactors: context.customFactors
    };
  }, [context]);

  return {
    riskConfig,
    setRiskConfig,
    context,
    setContext,
    profiles,
    lastScan,
    saveCurrentProfile,
    saveLastScan,
    loadProfile,
    saveProfile,
    deleteProfile,
    resetToDefaults,
    getRiskConfig,
    getRiskContext,
    getEnabledFactorsCount,
    addCustomFactor,
    removeCustomFactor
  };
}