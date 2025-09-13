import React, { useState } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Settings, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  Plus,
  X 
} from 'lucide-react';
import { useRiskSettings, CustomFactor, EnvironmentalFactors } from '@/hooks/useRiskSettings';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface RiskSettingsDrawerProps {
  children?: React.ReactNode;
}

const CustomFactorForm = ({ 
  onAdd, 
  onCancel 
}: { 
  onAdd: (factor: Omit<CustomFactor, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [factor, setFactor] = useState({
    name: '',
    level: 'file' as 'file' | 'vulnerability',
    type: 'multiplier' as 'multiplier' | 'additive',
    defaultValue: 1.2,
    rationale: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (factor.name.trim()) {
      onAdd(factor);
      onCancel();
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="factor-name">Factor Name</Label>
          <Input
            id="factor-name"
            value={factor.name}
            onChange={(e) => setFactor(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., High Availability Required"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="factor-level">Level</Label>
            <Select 
              value={factor.level} 
              onValueChange={(value: 'file' | 'vulnerability') => 
                setFactor(prev => ({ ...prev, level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">File Level</SelectItem>
                <SelectItem value="vulnerability">Vulnerability Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="factor-type">Type</Label>
            <Select 
              value={factor.type} 
              onValueChange={(value: 'multiplier' | 'additive') => 
                setFactor(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiplier">Multiplier</SelectItem>
                <SelectItem value="additive">Additive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="factor-value">Default Value</Label>
          <Input
            id="factor-value"
            type="number"
            step="0.1"
            min="0.1"
            max="5.0"
            value={factor.defaultValue}
            onChange={(e) => setFactor(prev => ({ ...prev, defaultValue: parseFloat(e.target.value) }))}
          />
        </div>
        
        <div>
          <Label htmlFor="factor-rationale">Rationale</Label>
          <Textarea
            id="factor-rationale"
            value={factor.rationale}
            onChange={(e) => setFactor(prev => ({ ...prev, rationale: e.target.value }))}
            placeholder="Brief explanation of why this factor affects risk..."
            rows={2}
          />
        </div>
        
        <div className="flex gap-2">
          <Button type="submit" size="sm">Add Factor</Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
      
      <div className="text-xs text-muted-foreground">
        <AlertTriangle className="w-3 h-3 inline mr-1" />
        New factor types are stored locally and will be ignored by scoring until backend support is added.
      </div>
    </div>
  );
};

const SeverityPointsSection = () => {
  const { severityPoints, setSeverityPoints } = useRiskSettings();
  
  const updatePoint = (severity: keyof typeof severityPoints, value: number) => {
    setSeverityPoints(prev => ({ ...prev, [severity]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Severity Weights (Points per Finding)</h3>
      <div className="space-y-3">
        {Object.entries(severityPoints).map(([severity, points]) => (
          <div key={severity} className="flex items-center justify-between">
            <Label className="capitalize text-sm">{severity}</Label>
            <div className="flex items-center space-x-2 w-32">
              <Slider
                value={[points]}
                onValueChange={([value]) => updatePoint(severity as keyof typeof severityPoints, value)}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={points}
                onChange={(e) => updatePoint(severity as keyof typeof severityPoints, parseInt(e.target.value) || 0)}
                className="w-16 text-xs"
                min={0}
                max={100}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RiskThresholdsSection = () => {
  const { riskThresholds, setRiskThresholds } = useRiskSettings();
  
  const updateThreshold = (level: keyof typeof riskThresholds, value: number) => {
    setRiskThresholds(prev => ({ ...prev, [level]: value }));
  };

  const validateThresholds = () => {
    const values = Object.values(riskThresholds).sort((a, b) => b - a);
    const keys = ['critical', 'high', 'medium', 'low', 'minimal'] as const;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (riskThresholds[keys[i]] <= riskThresholds[keys[i + 1]]) {
        return `${keys[i]} threshold must be higher than ${keys[i + 1]}`;
      }
    }
    return null;
  };

  const validationError = validateThresholds();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Risk Thresholds</h3>
      {validationError && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {validationError}
        </div>
      )}
      <div className="space-y-3">
        {Object.entries(riskThresholds).map(([level, threshold]) => (
          <div key={level} className="flex items-center justify-between">
            <Label className="capitalize text-sm">{level}</Label>
            <div className="flex items-center space-x-2 w-32">
              <Slider
                value={[threshold]}
                onValueChange={([value]) => updateThreshold(level as keyof typeof riskThresholds, value)}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={threshold}
                onChange={(e) => updateThreshold(level as keyof typeof riskThresholds, parseInt(e.target.value) || 0)}
                className="w-16 text-xs"
                min={0}
                max={100}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EnvironmentalFactorsSection = () => {
  const { factors, updateFactor, factorMetadata, customFactors, addCustomFactor, removeCustomFactor } = useRiskSettings();
  const [showCustomForm, setShowCustomForm] = useState(false);

  const getFactorValue = (factor: string, type: 'weight' | 'value') => {
    const factorData = factors[factor as keyof EnvironmentalFactors];
    return type === 'weight' ? factorData?.weight || 1.0 : factorData?.value || 0.0;
  };

  const updateFactorValue = (factor: string, type: 'weight' | 'value', value: number) => {
    updateFactor(factor as keyof EnvironmentalFactors, { [type]: value });
  };

  const isOutOfRange = (value: number, range: [number, number]) => {
    return value < range[0] || value > range[1];
  };

  const multiplierFactors = Object.entries(factorMetadata).filter(([_, meta]) => meta.type === 'multiplier');
  const additiveFactors = Object.entries(factorMetadata).filter(([_, meta]) => meta.type === 'additive');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Environmental Factors</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Custom
        </Button>
      </div>

      {showCustomForm && (
        <CustomFactorForm
          onAdd={addCustomFactor}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="multiplier-factors">
          <AccordionTrigger className="text-sm">
            Multiplier Factors (File-level)
            <Badge variant="secondary" className="ml-2">
              {multiplierFactors.filter(([key]) => factors[key as keyof EnvironmentalFactors]?.enabled).length} enabled
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            {multiplierFactors.map(([key, metadata]) => {
              const factor = factors[key as keyof EnvironmentalFactors];
              const value = getFactorValue(key, 'weight');
              const outOfRange = isOutOfRange(value, metadata.recommendedRange as [number, number]);
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={factor?.enabled || false}
                        onCheckedChange={(enabled) => updateFactor(key as keyof EnvironmentalFactors, { enabled })}
                      />
                      <div>
                        <Label className="text-sm font-medium">{metadata.label}</Label>
                        <p className="text-xs text-muted-foreground">{metadata.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {factor?.enabled && (
                    <div className="ml-6 flex items-center space-x-2">
                      <Label className="text-xs w-12">Weight</Label>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => updateFactorValue(key, 'weight', newValue)}
                        max={3.0}
                        min={0.5}
                        step={0.1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateFactorValue(key, 'weight', parseFloat(e.target.value) || 1.0)}
                        className={`w-16 text-xs ${outOfRange ? 'border-orange-300' : ''}`}
                        min={0.5}
                        max={3.0}
                        step={0.1}
                      />
                      {outOfRange && (
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="additive-factors">
          <AccordionTrigger className="text-sm">
            Additive Factors (Vulnerability-level)
            <Badge variant="secondary" className="ml-2">
              {additiveFactors.filter(([key]) => factors[key as keyof EnvironmentalFactors]?.enabled).length} enabled
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            {additiveFactors.map(([key, metadata]) => {
              const factor = factors[key as keyof EnvironmentalFactors];
              const value = getFactorValue(key, 'value');
              const outOfRange = isOutOfRange(value, metadata.recommendedRange as [number, number]);
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={factor?.enabled || false}
                        onCheckedChange={(enabled) => updateFactor(key as keyof EnvironmentalFactors, { enabled })}
                      />
                      <div>
                        <Label className="text-sm font-medium">{metadata.label}</Label>
                        <p className="text-xs text-muted-foreground">{metadata.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {factor?.enabled && (
                    <div className="ml-6 flex items-center space-x-2">
                      <Label className="text-xs w-12">Value</Label>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => updateFactorValue(key, 'value', newValue)}
                        max={3.0}
                        min={0.0}
                        step={0.1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateFactorValue(key, 'value', parseFloat(e.target.value) || 0.0)}
                        className={`w-16 text-xs ${outOfRange ? 'border-orange-300' : ''}`}
                        min={0.0}
                        max={3.0}
                        step={0.1}
                      />
                      {outOfRange && (
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        {customFactors.length > 0 && (
          <AccordionItem value="custom-factors">
            <AccordionTrigger className="text-sm">
              Custom Factors (Proposed)
              <Badge variant="outline" className="ml-2">{customFactors.length}</Badge>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {customFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <Badge variant="outline" className="text-xs">proposed</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {factor.level} {factor.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{factor.rationale}</p>
                    <p className="text-xs text-muted-foreground">Default: {factor.defaultValue}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomFactor(factor.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export const RiskSettingsDrawer: React.FC<RiskSettingsDrawerProps> = ({ children }) => {
  const { 
    selectedProfile, 
    profiles, 
    loadProfile, 
    resetToDefaults, 
    isDrawerOpen,
    setIsDrawerOpen 
  } = useRiskSettings();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Risk Settings
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Risk Assessment Settings</SheetTitle>
          <SheetDescription>
            Configure severity weights, thresholds, and environmental factors for risk calculation.
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Profile Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Risk Profile</Label>
            <Select value={selectedProfile} onValueChange={loadProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-xs text-muted-foreground">{profile.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Points */}
          <SeverityPointsSection />

          {/* Risk Thresholds */}
          <RiskThresholdsSection />

          {/* Environmental Factors */}
          <EnvironmentalFactorsSection />

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};