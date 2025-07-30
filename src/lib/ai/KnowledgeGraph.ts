export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'document' | 'query';
  content: string;
  embedding?: number[];
  connections: string[];
  weight: number;
  timestamp: number;
  metadata: {
    source?: string;
    confidence?: number;
    domain?: string;
  };
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight: number;
  timestamp: number;
}

export interface LearningMetrics {
  totalNodes: number;
  totalEdges: number;
  averageConnectivity: number;
  knowledgeDomains: string[];
  growthRate: number;
  confidenceScore: number;
}

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private embedder: any = null;
  private learningHistory: LearningMetrics[] = [];

  async initialize() {
    console.log('🧠 Initializing Knowledge Graph...');
    
    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'webgpu' }
      );
      
      // Load existing knowledge from localStorage
      this.loadFromStorage();
      
      console.log('✅ Knowledge Graph initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Knowledge Graph:', error);
      throw error;
    }
  }

  async addKnowledge(content: string, type: KnowledgeNode['type'], metadata: KnowledgeNode['metadata'] = {}): Promise<string> {
    const nodeId = crypto.randomUUID();
    const embedding = await this.generateEmbedding(content);
    
    const node: KnowledgeNode = {
      id: nodeId,
      label: this.extractLabel(content),
      type,
      content,
      embedding,
      connections: [],
      weight: 1,
      timestamp: Date.now(),
      metadata: {
        confidence: 0.8,
        domain: this.inferDomain(content),
        ...metadata
      }
    };

    this.nodes.set(nodeId, node);
    
    // Find and create connections to similar nodes
    await this.createConnections(nodeId);
    
    // Update learning metrics
    this.updateMetrics();
    
    // Persist to storage
    this.saveToStorage();
    
    console.log(`📊 Added knowledge node: ${node.label}`);
    return nodeId;
  }

  async findSimilarNodes(query: string, limit: number = 10): Promise<KnowledgeNode[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const similarities: { node: KnowledgeNode; similarity: number }[] = [];

    for (const node of this.nodes.values()) {
      if (node.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);
        similarities.push({ node, similarity });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.node);
  }

  async reinforceKnowledge(nodeId: string, feedback: 'positive' | 'negative'): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const adjustment = feedback === 'positive' ? 0.1 : -0.1;
    node.weight = Math.max(0.1, Math.min(2.0, node.weight + adjustment));
    
    if (node.metadata.confidence) {
      node.metadata.confidence = Math.max(0.1, Math.min(1.0, node.metadata.confidence + adjustment));
    }

    this.saveToStorage();
    console.log(`🎯 Reinforced knowledge: ${node.label} (${feedback})`);
  }

  async getInsights(): Promise<{
    topConcepts: KnowledgeNode[];
    emergingPatterns: string[];
    knowledgeGaps: string[];
    metrics: LearningMetrics;
  }> {
    const topConcepts = Array.from(this.nodes.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    const emergingPatterns = this.detectPatterns();
    const knowledgeGaps = this.identifyGaps();
    const metrics = this.calculateMetrics();

    return {
      topConcepts,
      emergingPatterns,
      knowledgeGaps,
      metrics
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embedder(text.substring(0, 500));
      return Array.from(result.data);
    } catch (error) {
      console.warn('Failed to generate embedding:', error);
      return Array(384).fill(0).map(() => Math.random() - 0.5);
    }
  }

  private async createConnections(nodeId: string): Promise<void> {
    const newNode = this.nodes.get(nodeId);
    if (!newNode?.embedding) return;

    for (const [existingId, existingNode] of this.nodes) {
      if (existingId === nodeId || !existingNode.embedding) continue;

      const similarity = this.cosineSimilarity(newNode.embedding, existingNode.embedding);
      
      if (similarity > 0.7) { // High similarity threshold
        const edgeId = crypto.randomUUID();
        const edge: KnowledgeEdge = {
          id: edgeId,
          source: nodeId,
          target: existingId,
          relationship: this.inferRelationship(newNode, existingNode),
          weight: similarity,
          timestamp: Date.now()
        };

        this.edges.set(edgeId, edge);
        newNode.connections.push(existingId);
        existingNode.connections.push(nodeId);
      }
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private extractLabel(content: string): string {
    const sentences = content.split(/[.!?]+/);
    return sentences[0]?.substring(0, 50) + '...' || 'Unknown';
  }

  private inferDomain(content: string): string {
    const domains = {
      'ai': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning'],
      'science': ['research', 'study', 'experiment', 'theory', 'hypothesis'],
      'technology': ['software', 'hardware', 'computer', 'digital', 'tech'],
      'business': ['market', 'company', 'economy', 'finance', 'business'],
      'general': []
    };

    const lowerContent = content.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
  }

  private inferRelationship(nodeA: KnowledgeNode, nodeB: KnowledgeNode): string {
    if (nodeA.type === nodeB.type) return 'similar_to';
    if (nodeA.type === 'document' && nodeB.type === 'concept') return 'contains';
    if (nodeA.type === 'concept' && nodeB.type === 'entity') return 'relates_to';
    return 'connected_to';
  }

  private detectPatterns(): string[] {
    const patterns: string[] = [];
    
    // Detect frequently connected domains
    const domainConnections: { [key: string]: number } = {};
    for (const edge of this.edges.values()) {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);
      if (sourceNode && targetNode) {
        const key = `${sourceNode.metadata.domain}-${targetNode.metadata.domain}`;
        domainConnections[key] = (domainConnections[key] || 0) + 1;
      }
    }

    const topConnections = Object.entries(domainConnections)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    patterns.push(...topConnections.map(([connection]) => `Strong connection between ${connection.replace('-', ' and ')}`));

    return patterns;
  }

  private identifyGaps(): string[] {
    const gaps: string[] = [];
    
    // Find isolated nodes
    const isolatedNodes = Array.from(this.nodes.values())
      .filter(node => node.connections.length === 0);
    
    if (isolatedNodes.length > 0) {
      gaps.push(`${isolatedNodes.length} isolated knowledge concepts need connections`);
    }

    // Find underrepresented domains
    const domains: { [key: string]: number } = {};
    for (const node of this.nodes.values()) {
      const domain = node.metadata.domain || 'unknown';
      domains[domain] = (domains[domain] || 0) + 1;
    }

    const minThreshold = Math.max(1, this.nodes.size * 0.1);
    const underrepresented = Object.entries(domains)
      .filter(([, count]) => count < minThreshold)
      .map(([domain]) => domain);

    if (underrepresented.length > 0) {
      gaps.push(`Need more knowledge in: ${underrepresented.join(', ')}`);
    }

    return gaps;
  }

  private calculateMetrics(): LearningMetrics {
    const totalNodes = this.nodes.size;
    const totalEdges = this.edges.size;
    const averageConnectivity = totalNodes > 0 ? totalEdges / totalNodes : 0;
    
    const domains = Array.from(new Set(
      Array.from(this.nodes.values()).map(node => node.metadata.domain || 'unknown')
    ));

    const previousMetrics = this.learningHistory[this.learningHistory.length - 1];
    const growthRate = previousMetrics ? 
      (totalNodes - previousMetrics.totalNodes) / Math.max(1, previousMetrics.totalNodes) : 0;

    const confidenceScore = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + (node.metadata.confidence || 0.5), 0) / Math.max(1, totalNodes);

    return {
      totalNodes,
      totalEdges,
      averageConnectivity,
      knowledgeDomains: domains,
      growthRate,
      confidenceScore
    };
  }

  private updateMetrics(): void {
    const metrics = this.calculateMetrics();
    this.learningHistory.push(metrics);
    
    // Keep only last 100 metrics
    if (this.learningHistory.length > 100) {
      this.learningHistory = this.learningHistory.slice(-100);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        nodes: Array.from(this.nodes.entries()),
        edges: Array.from(this.edges.entries()),
        learningHistory: this.learningHistory
      };
      localStorage.setItem('ai-knowledge-graph', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save knowledge graph:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai-knowledge-graph');
      if (stored) {
        const data = JSON.parse(stored);
        this.nodes = new Map(data.nodes || []);
        this.edges = new Map(data.edges || []);
        this.learningHistory = data.learningHistory || [];
        console.log(`📚 Loaded ${this.nodes.size} knowledge nodes from storage`);
      }
    } catch (error) {
      console.warn('Failed to load knowledge graph:', error);
    }
  }

  getGraphData() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }
}
