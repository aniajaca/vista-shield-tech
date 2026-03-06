import { useState, useCallback } from "react";

// ─── Profile presets matching actual backend profiles ───
const PROFILES: Record<string, any> = {
  default: {
    id: "default",
    name: "Default",
    description: "Balanced risk profile for general use",
    severityPoints: { critical: 25, high: 15, medium: 8, low: 3, info: 1 },
    contextMultipliers: {
      internetFacing: { value: 1.5, enabled: true },
      handlesPI: { value: 1.4, enabled: true },
      production: { value: 1.3, enabled: true },
      noAuthentication: { value: 1.3, enabled: true },
      businessCritical: { value: 1.6, enabled: true },
      compliance: { value: 1.3, enabled: true },
      thirdPartyIntegration: { value: 1.2, enabled: true },
      legacyCode: { value: 1.1, enabled: true },
    },
    contextWeights: {
      internetFacing: 0.20,
      production: 0.15,
      handlesPI: 0.15,
      legacyCode: 0.10,
      businessCritical: 0.20,
      compliance: 0.15,
      thirdPartyIntegration: 0.10,
      complexAuth: 0.10,
    },
    totalLiftCap: 0.70,
    priorityBands: { P0: 80, P1: 65, P2: 50, P3: 0 },
    slaMapping: { P0: 7, P1: 14, P2: 30, P3: 90 },
    fileRiskThresholds: { critical: 80, high: 60, medium: 40, low: 20, minimal: 0 },
  },
  startup: {
    id: "startup",
    name: "Startup",
    description: "Fast iteration with moderate risk tolerance",
    severityPoints: { critical: 25, high: 15, medium: 8, low: 3, info: 1 },
    contextMultipliers: {
      internetFacing: { value: 1.3, enabled: true },
      handlesPI: { value: 1.2, enabled: true },
      production: { value: 1.1, enabled: true },
      noAuthentication: { value: 1.2, enabled: true },
      businessCritical: { value: 1.3, enabled: false },
      compliance: { value: 1.1, enabled: false },
      thirdPartyIntegration: { value: 1.1, enabled: false },
      legacyCode: { value: 1.0, enabled: false },
    },
    contextWeights: {
      internetFacing: 0.20,
      production: 0.10,
      handlesPI: 0.10,
      legacyCode: 0.05,
      businessCritical: 0.10,
      compliance: 0.05,
      thirdPartyIntegration: 0.05,
      complexAuth: 0.05,
    },
    totalLiftCap: 0.50,
    priorityBands: { P0: 85, P1: 70, P2: 50, P3: 0 },
    slaMapping: { P0: 21, P1: 45, P2: 90, P3: 120 },
    fileRiskThresholds: { critical: 80, high: 60, medium: 40, low: 20, minimal: 0 },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Conservative profile with strict remediation SLAs",
    severityPoints: { critical: 25, high: 15, medium: 8, low: 3, info: 1 },
    contextMultipliers: {
      internetFacing: { value: 1.5, enabled: true },
      handlesPI: { value: 1.4, enabled: true },
      production: { value: 1.3, enabled: true },
      noAuthentication: { value: 1.3, enabled: true },
      businessCritical: { value: 1.6, enabled: true },
      compliance: { value: 1.3, enabled: true },
      thirdPartyIntegration: { value: 1.2, enabled: true },
      legacyCode: { value: 1.1, enabled: true },
    },
    contextWeights: {
      internetFacing: 0.20,
      production: 0.15,
      handlesPI: 0.15,
      legacyCode: 0.10,
      businessCritical: 0.20,
      compliance: 0.15,
      thirdPartyIntegration: 0.10,
      complexAuth: 0.10,
    },
    totalLiftCap: 0.70,
    priorityBands: { P0: 80, P1: 65, P2: 50, P3: 0 },
    slaMapping: { P0: 7, P1: 14, P2: 30, P3: 90 },
    fileRiskThresholds: { critical: 80, high: 60, medium: 40, low: 20, minimal: 0 },
  },
  compliance: {
    id: "compliance",
    name: "Compliance",
    description: "Maximum scrutiny for regulated environments",
    severityPoints: { critical: 25, high: 15, medium: 8, low: 3, info: 1 },
    contextMultipliers: {
      internetFacing: { value: 1.6, enabled: true },
      handlesPI: { value: 1.5, enabled: true },
      production: { value: 1.3, enabled: true },
      noAuthentication: { value: 1.4, enabled: true },
      businessCritical: { value: 1.6, enabled: true },
      compliance: { value: 1.5, enabled: true },
      thirdPartyIntegration: { value: 1.3, enabled: true },
      legacyCode: { value: 1.2, enabled: true },
    },
    contextWeights: {
      internetFacing: 0.25,
      production: 0.15,
      handlesPI: 0.25,
      legacyCode: 0.10,
      businessCritical: 0.20,
      compliance: 0.25,
      thirdPartyIntegration: 0.10,
      complexAuth: 0.10,
    },
    totalLiftCap: 0.70,
    priorityBands: { P0: 75, P1: 60, P2: 40, P3: 0 },
    slaMapping: { P0: 3, P1: 7, P2: 14, P3: 30 },
    fileRiskThresholds: { critical: 75, high: 55, medium: 35, low: 15, minimal: 0 },
  },
};

const FACTOR_LABELS: Record<string, string> = {
  internetFacing: "Internet-Facing",
  handlesPI: "Handles PII",
  production: "Production Environment",
  noAuthentication: "No Authentication",
  businessCritical: "Business-Critical",
  compliance: "Compliance Scope",
  thirdPartyIntegration: "3rd-Party Integration",
  legacyCode: "Legacy Code",
};

const FACTOR_ICONS: Record<string, string> = {
  internetFacing: "🌐",
  handlesPI: "🔒",
  production: "🚀",
  noAuthentication: "⚠️",
  businessCritical: "💎",
  compliance: "📋",
  thirdPartyIntegration: "🔗",
  legacyCode: "🏚️",
};

const BAND_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  P0: { bg: "#2d0a0a", border: "#dc2626", text: "#fca5a5", dot: "#ef4444" },
  P1: { bg: "#2d1a0a", border: "#ea580c", text: "#fdba74", dot: "#f97316" },
  P2: { bg: "#2d2a0a", border: "#ca8a04", text: "#fde68a", dot: "#eab308" },
  P3: { bg: "#0a1a2d", border: "#2563eb", text: "#93c5fd", dot: "#3b82f6" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  info: "#6b7280",
  minimal: "#374151",
};

// ─── Micro-components ───

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: checked ? "#10b981" : "#374151",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  width = 64,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
  suffix?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{
          width,
          padding: "6px 8px",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 6,
          color: "#e5e7eb",
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          textAlign: "right",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e) => (e.target.style.borderColor = "#374151")}
      />
      {suffix && (
        <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>{suffix}</span>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#1f2937", margin: "4px 0" }} />;
}

// ─── Main Component ───

export default function RiskConfiguration() {
  const [selectedProfileId, setSelectedProfileId] = useState("default");
  const [config, setConfig] = useState(JSON.parse(JSON.stringify(PROFILES.default)));
  const [expandedSections, setExpandedSections] = useState({
    context: true,
    severity: false,
    priority: true,
    fileRisk: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleProfileChange = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
    setConfig(JSON.parse(JSON.stringify(PROFILES[profileId])));
    setHasChanges(false);
  }, []);

  const updateConfig = useCallback((path: string, value: any) => {
    setConfig((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setHasChanges(true);
  }, []);

  const toggleSection = (key: keyof typeof expandedSections) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const enabledFactorCount = Object.values(config.contextMultipliers).filter(
    (f: any) => f.enabled
  ).length;

  const maxCombinedMultiplier = (Object.values(config.contextMultipliers) as any[])
    .filter((f) => f.enabled)
    .reduce((acc: number, f) => acc * f.value, 1)
    .toFixed(2);

  return (
    <div style={{ background: "#030712", color: "#e5e7eb", minHeight: "100%" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1f2937" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>⚙️</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#f9fafb" }}>
              Risk Configuration
            </h2>
          </div>
          <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
            Configure the multi-stage scoring pipeline: BTS → CRS → BPS → FARS → PRS
          </p>
        </div>

        {/* ── Profile Selector ── */}
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Active Profile
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 8 }}>
            {Object.values(PROFILES).map((p: any) => (
              <button
                key={p.id}
                onClick={() => handleProfileChange(p.id)}
                style={{
                  padding: "10px 8px",
                  borderRadius: 8,
                  border: selectedProfileId === p.id ? "1.5px solid #6366f1" : "1px solid #1f2937",
                  background: selectedProfileId === p.id ? "#1e1b4b" : "#0a0e17",
                  color: selectedProfileId === p.id ? "#c7d2fe" : "#9ca3af",
                  fontSize: 12,
                  fontWeight: selectedProfileId === p.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p style={{ color: "#6b7280", fontSize: 11, margin: 0, fontStyle: "italic" }}>
            {config.description}
          </p>
        </div>

        <Divider />

        {/* ── Context Multipliers (CRS Stage) ── */}
        <div style={{ borderBottom: "1px solid #1f2937" }}>
          <button
            onClick={() => toggleSection("context")}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                Context Multipliers
              </span>
              <span style={{ fontSize: 10, background: "#1e1b4b", color: "#a5b4fc", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                CRS Stage
              </span>
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                {enabledFactorCount} active · max {maxCombinedMultiplier}×
              </span>
            </div>
            <span style={{ color: "#6b7280", fontSize: 12, transition: "transform 0.2s", transform: expandedSections.context ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>

          {expandedSections.context && (
            <div style={{ padding: "0 16px 16px" }}>
              {/* Total Lift Cap */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#0f172a", borderRadius: 8, marginBottom: 12, border: "1px solid #1e293b" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 12, margin: 0, color: "#e2e8f0" }}>Total Lift Cap</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                    Maximum CRS uplift from context factors
                  </p>
                </div>
                <NumberInput
                  value={config.totalLiftCap}
                  onChange={(v) => updateConfig("totalLiftCap", v)}
                  min={0}
                  max={1}
                  step={0.05}
                  width={56}
                />
              </div>

              {/* Factor list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(config.contextMultipliers).map(([key, factor]: [string, any]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: factor.enabled ? "#111827" : "#0a0e17",
                      borderRadius: 6,
                      opacity: factor.enabled ? 1 : 0.5,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>
                      {FACTOR_ICONS[key]}
                    </span>
                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#d1d5db" }}>
                        {FACTOR_LABELS[key]}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <NumberInput
                        value={factor.value}
                        onChange={(v) => updateConfig(`contextMultipliers.${key}.value`, v)}
                        min={1.0}
                        max={3.0}
                        step={0.1}
                        width={52}
                        suffix="×"
                      />
                      <Toggle
                        checked={factor.enabled}
                        onChange={(v) => updateConfig(`contextMultipliers.${key}.enabled`, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* ── Priority Bands & SLA ── */}
        <div style={{ borderBottom: "1px solid #1f2937" }}>
          <button
            onClick={() => toggleSection("priority")}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                Priority Bands & SLA
              </span>
              <span style={{ fontSize: 10, background: "#1a1a0a", color: "#fde68a", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                Band Assignment
              </span>
            </div>
            <span style={{ color: "#6b7280", fontSize: 12, transition: "transform 0.2s", transform: expandedSections.priority ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>

          {expandedSections.priority && (
            <div style={{ padding: "0 16px 16px" }}>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px" }}>
                CRS score thresholds that map findings to remediation bands
              </p>

              {/* Band rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(["P0", "P1", "P2", "P3"] as const).map((band) => {
                  const c = BAND_COLORS[band];
                  return (
                    <div
                      key={band}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "8px 10px",
                        background: c.bg,
                        borderRadius: 6,
                        border: `1px solid ${c.border}33`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, width: 60 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
                        <span style={{ fontWeight: 600, color: c.text, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                          {band}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#6b7280", fontSize: 11 }}>CRS ≥</span>
                        <NumberInput
                          value={config.priorityBands[band]}
                          onChange={(v) => updateConfig(`priorityBands.${band}`, v)}
                          min={0}
                          max={100}
                          width={52}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#6b7280", fontSize: 11 }}>SLA</span>
                        <NumberInput
                          value={config.slaMapping[band]}
                          onChange={(v) => updateConfig(`slaMapping.${band}`, v)}
                          min={1}
                          max={365}
                          width={52}
                          suffix="d"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* ── Severity Points (BTS Stage) ── */}
        <div style={{ borderBottom: "1px solid #1f2937" }}>
          <button
            onClick={() => toggleSection("severity")}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                Severity Points
              </span>
              <span style={{ fontSize: 10, background: "#0a2d1a", color: "#86efac", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                BTS Stage
              </span>
            </div>
            <span style={{ color: "#6b7280", fontSize: 12, transition: "transform 0.2s", transform: expandedSections.severity ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>

          {expandedSections.severity && (
            <div style={{ padding: "0 16px 16px" }}>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px" }}>
                Points assigned per finding at each severity level for file-level aggregation
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(config.severityPoints).map(([level, points]) => (
                  <div
                    key={level}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: "#111827",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEVERITY_COLORS[level] || "#6b7280" }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#d1d5db", textTransform: "capitalize" }}>
                        {level}
                      </span>
                    </div>
                    <NumberInput
                      value={points as number}
                      onChange={(v) => updateConfig(`severityPoints.${level}`, v)}
                      min={0}
                      max={50}
                      width={52}
                      suffix="pts"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* ── File Risk Thresholds (FARS Stage) ── */}
        <div style={{ borderBottom: "1px solid #1f2937" }}>
          <button
            onClick={() => toggleSection("fileRisk")}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#e5e7eb",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                File Risk Thresholds
              </span>
              <span style={{ fontSize: 10, background: "#2d0a1a", color: "#fda4af", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                FARS Stage
              </span>
            </div>
            <span style={{ color: "#6b7280", fontSize: 12, transition: "transform 0.2s", transform: expandedSections.fileRisk ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>

          {expandedSections.fileRisk && (
            <div style={{ padding: "0 16px 16px" }}>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px" }}>
                Score boundaries for classifying file-level risk (0–100 scale)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(config.fileRiskThresholds).map(([level, threshold]) => (
                  <div
                    key={level}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: "#111827",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEVERITY_COLORS[level] || "#6b7280" }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#d1d5db", textTransform: "capitalize" }}>
                        {level}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#6b7280", fontSize: 11 }}>≥</span>
                      <NumberInput
                        value={threshold as number}
                        onChange={(v) => updateConfig(`fileRiskThresholds.${level}`, v)}
                        min={0}
                        max={100}
                        width={52}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* ── Pipeline Preview ── */}
        <div style={{ padding: "16px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Pipeline Preview — sample CRITICAL finding
          </p>
          {(() => {
            const bts = 9.0;
            const enabledWeightSum = Object.entries(config.contextWeights)
              .filter(([key]) => config.contextMultipliers[key]?.enabled)
              .reduce((sum: number, [, w]: any) => sum + w, 0);
            const cappedUplift = Math.min(enabledWeightSum, config.totalLiftCap);
            const crs = Math.min(100, Math.round(bts * 10 * (1 + cappedUplift)));
            const band = crs >= config.priorityBands.P0
              ? "P0"
              : crs >= config.priorityBands.P1
              ? "P1"
              : crs >= config.priorityBands.P2
              ? "P2"
              : "P3";
            const sla = config.slaMapping[band];
            const bc = BAND_COLORS[band];

            return (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
                {[
                  { label: "BTS", value: bts.toFixed(1), color: "#d1d5db" },
                  { label: "→" },
                  { label: "CRS", value: String(crs), color: bc.text },
                  { label: "→" },
                  { label: "Band", value: band, color: bc.dot },
                  { label: "→" },
                  { label: "SLA", value: `${sla}d`, color: bc.text },
                ].map((item: any, i) =>
                  item.value !== undefined ? (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                        {item.value}
                      </div>
                    </div>
                  ) : (
                    <span key={i} style={{ color: "#374151", fontSize: 14 }}>
                      →
                    </span>
                  )
                )}
              </div>
            );
          })()}
        </div>

        <Divider />

        {/* ── Action bar ── */}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: hasChanges ? "#fbbf24" : "#4b5563", fontWeight: 500 }}>
            {hasChanges ? "⚠ Unsaved changes" : "No changes"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleProfileChange(selectedProfileId)}
              disabled={!hasChanges}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #374151",
                background: "transparent",
                color: hasChanges ? "#d1d5db" : "#4b5563",
                fontSize: 12,
                fontWeight: 500,
                cursor: hasChanges ? "pointer" : "default",
              }}
            >
              Reset
            </button>
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: hasChanges ? "#4f46e5" : "#1e1b4b",
                color: hasChanges ? "#fff" : "#6366f1",
                fontSize: 12,
                fontWeight: 600,
                cursor: hasChanges ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              Apply Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
