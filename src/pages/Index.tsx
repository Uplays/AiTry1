import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResearchPanel } from '@/components/ai/ResearchPanel';
import { DocumentUploader } from '@/components/ai/DocumentUploader';
import { KnowledgeGraphVisualization } from '@/components/ai/KnowledgeGraphVisualization';
import { LearningDashboard } from '@/components/ai/LearningDashboard';
import { KnowledgeGraph } from '@/lib/ai/KnowledgeGraph';
import { ResearchResult } from '@/lib/ai/WebResearcher';
import { ProcessedDocument } from '@/lib/ai/DocumentProcessor';
import { Brain, Sparkles } from 'lucide-react';

const Index = () => {
  const [knowledgeGraph] = useState(() => new KnowledgeGraph());
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [insights, setInsights] = useState({
    topConcepts: [],
    emergingPatterns: [],
    knowledgeGaps: [],
    metrics: {
      totalNodes: 0,
      totalEdges: 0,
      averageConnectivity: 0,
      knowledgeDomains: [],
      growthRate: 0,
      confidenceScore: 0.5
    }
  });

  useEffect(() => {
    knowledgeGraph.initialize().then(() => {
      updateInsights();
    });
  }, []);

  const updateInsights = async () => {
    const newInsights = await knowledgeGraph.getInsights();
    const newGraphData = knowledgeGraph.getGraphData();
    setInsights(newInsights);
    setGraphData(newGraphData);
  };

  const handleResearchComplete = async (results: ResearchResult[]) => {
    for (const result of results) {
      await knowledgeGraph.addKnowledge(
        result.content,
        'concept',
        { source: result.url, confidence: result.relevanceScore, domain: 'research' }
      );
    }
    updateInsights();
  };

  const handleDocumentProcessed = async (document: ProcessedDocument) => {
    await knowledgeGraph.addKnowledge(
      document.content,
      'document',
      { source: document.name, confidence: 0.9, domain: 'document' }
    );
    updateInsights();
  };

  const handleSelfImprove = async () => {
    // Simulate self-improvement by reinforcing high-value knowledge
    const topNodes = insights.topConcepts.slice(0, 3);
    for (const node of topNodes) {
      await knowledgeGraph.reinforceKnowledge(node.id, 'positive');
    }
    updateInsights();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-primary glow-effect" />
            <h1 className="text-4xl font-bold bg-gradient-neural bg-clip-text text-transparent">
              Neural AI Research System
            </h1>
            <Sparkles className="w-10 h-10 text-accent neural-pulse" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Self-learning AI that researches the internet, processes documents, and builds knowledge autonomously
          </p>
          <div className="data-stream w-64 mx-auto"></div>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="research" className="w-full">
          <TabsList className="grid w-full grid-cols-4 neural-card">
            <TabsTrigger value="research" className="neural-button">Research</TabsTrigger>
            <TabsTrigger value="documents" className="neural-button">Documents</TabsTrigger>
            <TabsTrigger value="knowledge" className="neural-button">Knowledge</TabsTrigger>
            <TabsTrigger value="dashboard" className="neural-button">Dashboard</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="research" className="space-y-6">
              <ResearchPanel onResearchComplete={handleResearchComplete} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6">
              <KnowledgeGraphVisualization nodes={graphData.nodes} edges={graphData.edges} />
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <LearningDashboard 
                metrics={insights.metrics}
                insights={insights}
                onSelfImprove={handleSelfImprove}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
