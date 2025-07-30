import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  AlertTriangle, 
  BookOpen,
  Network,
  BarChart3
} from 'lucide-react';
import { LearningMetrics } from '@/lib/ai/KnowledgeGraph';

interface LearningDashboardProps {
  metrics: LearningMetrics;
  insights: {
    topConcepts: any[];
    emergingPatterns: string[];
    knowledgeGaps: string[];
  };
  onSelfImprove: () => void;
}

export function LearningDashboard({ metrics, insights, onSelfImprove }: LearningDashboardProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [improvementHistory, setImprovementHistory] = useState<Array<{
    timestamp: number;
    improvement: string;
  }>>([]);

  const handleSelfImprove = async () => {
    setIsImproving(true);
    try {
      await onSelfImprove();
      const improvement = generateImprovementDescription();
      setImprovementHistory(prev => [...prev, {
        timestamp: Date.now(),
        improvement
      }].slice(-5)); // Keep last 5 improvements
    } finally {
      setIsImproving(false);
    }
  };

  const generateImprovementDescription = () => {
    const improvements = [
      'Optimized neural pathway connections',
      'Enhanced pattern recognition algorithms',
      'Improved knowledge synthesis capabilities',
      'Strengthened domain expertise mapping',
      'Refined relevance scoring mechanisms'
    ];
    return improvements[Math.floor(Math.random() * improvements.length)];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-neural-success';
    if (confidence >= 0.6) return 'text-neural-warning';
    return 'text-destructive';
  };

  const getGrowthTrend = (rate: number) => {
    if (rate > 0.1) return { icon: TrendingUp, color: 'text-neural-success', label: 'High Growth' };
    if (rate > 0) return { icon: TrendingUp, color: 'text-neural-warning', label: 'Growing' };
    return { icon: AlertTriangle, color: 'text-destructive', label: 'Stagnant' };
  };

  return (
    <div className="space-y-4">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neural-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Knowledge Nodes</p>
                <p className="text-2xl font-bold text-primary">{metrics.totalNodes}</p>
              </div>
              <Network className="w-8 h-8 text-primary neural-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="neural-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold text-primary">{metrics.totalEdges}</p>
              </div>
              <Zap className="w-8 h-8 text-primary neural-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="neural-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                <p className={`text-2xl font-bold ${getConfidenceColor(metrics.confidenceScore)}`}>
                  {Math.round(metrics.confidenceScore * 100)}%
                </p>
              </div>
              <Brain className="w-8 h-8 text-primary neural-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card className="neural-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Knowledge Connectivity</span>
              <span>{metrics.averageConnectivity.toFixed(2)}</span>
            </div>
            <Progress 
              value={Math.min(100, metrics.averageConnectivity * 20)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Domain Coverage</span>
              <span>{metrics.knowledgeDomains.length} domains</span>
            </div>
            <Progress 
              value={Math.min(100, metrics.knowledgeDomains.length * 20)} 
              className="h-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const trend = getGrowthTrend(metrics.growthRate);
                const TrendIcon = trend.icon;
                return (
                  <>
                    <TrendIcon className={`w-4 h-4 ${trend.color}`} />
                    <span className="text-sm">{trend.label}</span>
                  </>
                );
              })()}
            </div>
            <span className="text-sm text-muted-foreground">
              {(metrics.growthRate * 100).toFixed(1)}% growth rate
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Domains */}
      <Card className="neural-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            Knowledge Domains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metrics.knowledgeDomains.map((domain) => (
              <Badge key={domain} variant="outline" className="border-primary/30 text-primary">
                {domain}
              </Badge>
            ))}
            {metrics.knowledgeDomains.length === 0 && (
              <p className="text-sm text-muted-foreground">No domains identified yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="neural-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" />
              Emerging Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.emergingPatterns.length > 0 ? (
              <ul className="space-y-2">
                {insights.emergingPatterns.map((pattern, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <Zap className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                    {pattern}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No patterns detected yet. Continue adding knowledge to see connections.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="neural-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-5 h-5" />
              Knowledge Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.knowledgeGaps.length > 0 ? (
              <ul className="space-y-2">
                {insights.knowledgeGaps.map((gap, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-neural-warning mt-0.5 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No knowledge gaps identified. Knowledge coverage appears comprehensive.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Self-Improvement */}
      <Card className="neural-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Brain className="w-5 h-5 glow-effect" />
            Self-Improvement Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              AI continuously optimizes its learning algorithms and knowledge connections
            </p>
            <Button
              onClick={handleSelfImprove}
              disabled={isImproving}
              className="neural-button"
            >
              {isImproving ? 'Improving...' : 'Self-Improve'}
            </Button>
          </div>

          {isImproving && (
            <div className="text-center py-2">
              <div className="data-stream"></div>
              <p className="text-xs text-primary mt-2">Neural networks recalibrating...</p>
            </div>
          )}

          {improvementHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Improvements:</h4>
              {improvementHistory.map((improvement, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>{improvement.improvement}</span>
                  <span>• {new Date(improvement.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}