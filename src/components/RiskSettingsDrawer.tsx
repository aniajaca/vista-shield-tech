import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRiskSettings } from "@/hooks/useRiskSettings";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RiskSettingsDrawerProps {
  children: React.ReactNode;
  onSettingsChange?: (riskConfig: any, context: any) => void;
}

export function RiskSettingsDrawer({ children, onSettingsChange }: RiskSettingsDrawerProps) {
  const {
    riskConfig,
    setRiskConfig,
    context,
    setContext,
    profiles,
    saveCurrentProfile,
    loadProfile,
    saveProfile,
    deleteProfile,
    resetToDefaults,
    getEnabledFactorsCount,
    addCustomFactor,
    removeCustomFactor,
    lastScan
  } = useRiskSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newCustomFactor, setNewCustomFactor] = useState({
    id: "",
    type: "multiplier" as "multiplier" | "additive",
    value: 1.0
  });

  const handleApplySettings = () => {
    saveCurrentProfile();
    
    // Show snackbar if there's a previous scan
    if (lastScan && onSettingsChange) {
      toast("Apply new risk settings to current results?", {
        action: {
          label: "Apply",
          onClick: () => {
            onSettingsChange(riskConfig, context);
            toast.success("Risk settings applied to current results");
          },
        },
      });
    } else if (onSettingsChange) {
      onSettingsChange(riskConfig, context);
      toast.success("Risk settings applied successfully");
    } else {
      toast.success("Risk settings saved");
    }
    
    setIsOpen(false);
  };

  const handleLoadProfile = (profileName: string) => {
    const profile = profiles.find(p => p.name === profileName);
    if (profile) {
      loadProfile(profile);
      toast.success(`Loaded profile: ${profileName}`);
    }
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }
    saveProfile(newProfileName.trim());
    toast.success(`Profile saved: ${newProfileName}`);
    setNewProfileName("");
  };

  const handleAddCustomFactor = () => {
    if (!newCustomFactor.id.trim()) {
      toast.error("Please enter a factor ID");
      return;
    }
    addCustomFactor(newCustomFactor.id.trim(), newCustomFactor.type, newCustomFactor.value);
    toast.success(`Added custom factor: ${newCustomFactor.id}`);
    setNewCustomFactor({ id: "", type: "multiplier", value: 1.0 });
  };

  const enabledCount = getEnabledFactorsCount();

  const validateValue = (value: number, type: 'multiplier' | 'additive') => {
    if (type === 'multiplier') {
      return value >= 0.5 && value <= 3.0;
    } else {
      return value >= 0 && value <= 3.0;
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="h-[90vh]">
        <div className="mx-auto w-full max-w-4xl p-6 overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Risk Assessment Settings</DrawerTitle>
            <DrawerDescription>
              Configure severity weights, thresholds, and environmental factors.
              <Badge variant="outline" className="ml-2">
                {enabledCount} factors enabled
              </Badge>
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
            {/* Profile Management */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Risk Profiles</h3>
              
              <div className="space-y-2">
                <Label>Load Preset Profile</Label>
                <Select onValueChange={handleLoadProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.name} value={profile.name}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Save Current as New Profile</Label>
                <div className="flex gap-2">
                  <Input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile name..."
                  />
                  <Button onClick={handleSaveProfile} size="sm">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Severity Points */}
              <div className="space-y-4">
                <h4 className="font-medium">Severity Points (0-100)</h4>
                {Object.entries(riskConfig.severityPoints).map(([severity, value]) => (
                  <div key={severity} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="capitalize">{severity}</Label>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([newValue]) =>
                        setRiskConfig(prev => ({
                          ...prev,
                          severityPoints: { ...prev.severityPoints, [severity]: newValue }
                        }))
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Risk Thresholds */}
              <div className="space-y-4">
                <h4 className="font-medium">Risk Thresholds (0-100)</h4>
                {Object.entries(riskConfig.riskThresholds).map(([level, value]) => (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="capitalize">{level}</Label>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([newValue]) =>
                        setRiskConfig(prev => ({
                          ...prev,
                          riskThresholds: { ...prev.riskThresholds, [level]: newValue }
                        }))
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Factors */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Environmental Factors</h3>
              
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Legend:</strong> Multipliers 0.5–3.0 (file-level) • Additives 0–3.0 (vulnerability-level)
              </div>

              {/* Context Toggles */}
              <div className="space-y-3">
                <h4 className="font-medium">Deployment Context</h4>
                {Object.entries(context).filter(([key]) => key !== 'customFactors').map(([factor, enabled]) => (
                  <div key={factor} className="flex items-center justify-between">
                    <Label htmlFor={factor} className="capitalize">
                      {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <Switch
                      id={factor}
                      checked={enabled as boolean}
                      onCheckedChange={(checked) =>
                        setContext(prev => ({ ...prev, [factor]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Custom Factors */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="custom-factors">
                  <AccordionTrigger className="text-sm font-medium">
                    Custom Risk Factors ({Object.keys(context.customFactors).length})
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    
                    {Object.entries(context.customFactors).map(([factorId, config]) => (
                      <div key={factorId} className="flex items-center gap-2 p-3 border rounded">
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) =>
                            setContext(prev => ({
                              ...prev,
                              customFactors: {
                                ...prev.customFactors,
                                [factorId]: { ...config, enabled: checked }
                              }
                            }))
                          }
                        />
                        <div className="flex-1">
                          <span className="text-sm font-mono">{factorId}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {config.type === 'multiplier' ? `×${config.weight}` : `+${config.value}`}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomFactor(factorId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Add Custom Factor */}
                    <div className="space-y-2 p-3 border rounded bg-muted/50">
                      <Label className="text-xs font-medium">Add Custom Factor</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Factor ID"
                          value={newCustomFactor.id}
                          onChange={(e) => setNewCustomFactor(prev => ({ ...prev, id: e.target.value }))}
                          className="flex-1"
                        />
                        <Select
                          value={newCustomFactor.type}
                          onValueChange={(value: "multiplier" | "additive") =>
                            setNewCustomFactor(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiplier">Multiplier</SelectItem>
                            <SelectItem value="additive">Additive</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={newCustomFactor.type === 'multiplier' ? 0.5 : 0}
                          max={3}
                          step={0.1}
                          value={newCustomFactor.value}
                          onChange={(e) => setNewCustomFactor(prev => ({ ...prev, value: parseFloat(e.target.value) || 1 }))}
                          className={`w-20 ${!validateValue(newCustomFactor.value, newCustomFactor.type) ? 'border-orange-300' : ''}`}
                        />
                        <Button onClick={handleAddCustomFactor} size="sm" disabled={!newCustomFactor.id.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {!validateValue(newCustomFactor.value, newCustomFactor.type) && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          Value outside recommended range
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        New factors are stored locally and ignored by scoring until backend support is added.
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <Button onClick={handleApplySettings} className="flex-1">
              Apply Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                resetToDefaults();
                toast.info("Settings reset to defaults");
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}