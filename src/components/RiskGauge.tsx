import { motion } from 'framer-motion';

interface RiskGaugeProps {
  value: number; // 0-100
  size?: number;
}

export const RiskGauge = ({ value, size = 160 }: RiskGaugeProps) => {
  const radius = (size - 20) / 2;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  
  // Calculate stroke offset based on value (0-100)
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  // Determine color based on risk level
  const getColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--critical))';
    if (score >= 60) return 'hsl(var(--high))';
    if (score >= 40) return 'hsl(var(--medium))';
    return 'hsl(var(--low))';
  };

  const getGlow = (score: number) => {
    if (score >= 80) return 'var(--shadow-critical)';
    return 'var(--shadow-glow)';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
        style={{
          filter: `drop-shadow(${getGlow(value)})`
        }}
      >
        {/* Background circle */}
        <circle
          stroke="hsl(var(--border))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Progress circle */}
        <motion.circle
          stroke={getColor(value)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Center dot */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={4}
          fill={getColor(value)}
          className="animate-pulse"
        />
      </svg>
      
      {/* Cyber grid overlay */}
      <div 
        className="absolute inset-0 cyber-grid rounded-full"
        style={{
          width: size,
          height: size,
          mask: `radial-gradient(circle at center, transparent ${normalizedRadius}px, black ${normalizedRadius + 10}px)`
        }}
      />
    </div>
  );
};