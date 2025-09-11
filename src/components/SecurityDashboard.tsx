import { motion } from 'framer-motion';
import { Shield, AlertTriangle, FileText, Activity, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RiskGauge } from './RiskGauge';
import { VulnerabilityChart } from './VulnerabilityChart';
import { VulnerabilityList } from './VulnerabilityList';

interface SecurityMetrics {
  riskScore: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}

const SecurityDashboard = () => {
  const metrics: SecurityMetrics = {
    riskScore: 72.5,
    totalVulnerabilities: 47,
    criticalCount: 2,
    highCount: 5,
    mediumCount: 15,
    lowCount: 20,
    infoCount: 5,
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Code Guardian</h1>
                <p className="text-sm text-muted-foreground">Security Assessment Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-accent border-accent/30">
                Live Monitoring
              </Badge>
              <Button variant="default" className="glow-primary">
                New Scan
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Risk Score Section */}
          <motion.div variants={item} className="lg:col-span-1">
            <Card className="glass hover-lift h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Security Risk Score</h2>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div className="flex flex-col items-center">
                  <RiskGauge value={metrics.riskScore} />
                  <div className="mt-4 text-center">
                    <p className="text-3xl font-bold text-high">{metrics.riskScore}</p>
                    <p className="text-sm text-muted-foreground">out of 100</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Metrics Overview */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="glass hover-lift h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Vulnerability Overview</h2>
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 rounded-lg bg-critical/10 border border-critical/20">
                    <div className="text-2xl font-bold text-critical pulse-critical">
                      {metrics.criticalCount}
                    </div>
                    <div className="text-sm text-critical-foreground/80">Critical</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-high/10 border border-high/20">
                    <div className="text-2xl font-bold text-high">
                      {metrics.highCount}
                    </div>
                    <div className="text-sm text-high-foreground/80">High</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-medium/10 border border-medium/20">
                    <div className="text-2xl font-bold text-medium">
                      {metrics.mediumCount}
                    </div>
                    <div className="text-sm text-medium-foreground/80">Medium</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-low/10 border border-low/20">
                    <div className="text-2xl font-bold text-low">
                      {metrics.lowCount}
                    </div>
                    <div className="text-sm text-low-foreground/80">Low</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-info/10 border border-info/20">
                    <div className="text-2xl font-bold text-info">
                      {metrics.infoCount}
                    </div>
                    <div className="text-sm text-info-foreground/80">Info</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Chart Section */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="glass hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Risk Distribution</h2>
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <VulnerabilityChart data={metrics} />
              </div>
            </Card>
          </motion.div>

          {/* Vulnerability List */}
          <motion.div variants={item} className="lg:col-span-1">
            <Card className="glass hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Critical Issues</h2>
                  <AlertTriangle className="h-5 w-5 text-critical pulse-critical" />
                </div>
                <VulnerabilityList />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default SecurityDashboard;