import { pipeline } from '@huggingface/transformers';

export interface ResearchResult {
  id: string;
  url: string;
  title: string;
  content: string;
  summary: string;
  relevanceScore: number;
  timestamp: number;
  keywords: string[];
}

export interface ResearchQuery {
  query: string;
  maxResults: number;
  domains?: string[];
}

export class WebResearcher {
  private summarizer: any = null;
  private embedder: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('🧠 Initializing AI Web Researcher...');
    
    try {
      // Initialize summarization model
      this.summarizer = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { device: 'webgpu' }
      );

      // Initialize embedding model for relevance scoring
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'webgpu' }
      );

      this.initialized = true;
      console.log('✅ AI Web Researcher initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI models:', error);
      throw error;
    }
  }

  async research(query: ResearchQuery): Promise<ResearchResult[]> {
    await this.initialize();
    
    console.log(`🔍 Starting research for: "${query.query}"`);
    
    const searchUrls = this.generateSearchUrls(query);
    const results: ResearchResult[] = [];

    for (const url of searchUrls.slice(0, query.maxResults)) {
      try {
        const result = await this.processUrl(url, query.query);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process ${url}:`, error);
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    console.log(`📊 Research complete: ${results.length} results found`);
    return results;
  }

  private generateSearchUrls(query: ResearchQuery): string[] {
    const searchEngines = [
      'https://www.wikipedia.org/wiki/Special:Search?search=',
      'https://arxiv.org/search/?query=',
      'https://scholar.google.com/scholar?q=',
    ];

    const encodedQuery = encodeURIComponent(query.query);
    return searchEngines.map(engine => engine + encodedQuery);
  }

  private async processUrl(url: string, originalQuery: string): Promise<ResearchResult | null> {
    try {
      // In a real implementation, you'd use a proper web scraping service
      // For demo purposes, we'll simulate web content
      const simulatedContent = await this.simulateWebContent(url, originalQuery);
      
      const summary = await this.generateSummary(simulatedContent);
      const relevanceScore = await this.calculateRelevance(originalQuery, simulatedContent);
      const keywords = this.extractKeywords(simulatedContent);

      return {
        id: crypto.randomUUID(),
        url,
        title: this.extractTitle(url),
        content: simulatedContent,
        summary,
        relevanceScore,
        timestamp: Date.now(),
        keywords
      };
    } catch (error) {
      console.error(`Failed to process ${url}:`, error);
      return null;
    }
  }

  private async simulateWebContent(url: string, query: string): Promise<string> {
    // Simulate realistic web content based on the query
    const topics = {
      'artificial intelligence': 'Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to natural intelligence displayed by humans. AI research has been highly successful in developing effective techniques for solving a wide range of problems, from game playing to medical diagnosis.',
      'machine learning': 'Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn and make predictions or decisions based on data. It enables computers to learn without being explicitly programmed.',
      'neural networks': 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information using connectionist approaches to computation.',
      'deep learning': 'Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised.'
    };

    const lowerQuery = query.toLowerCase();
    const matchedTopic = Object.keys(topics).find(topic => lowerQuery.includes(topic));
    
    if (matchedTopic) {
      return topics[matchedTopic as keyof typeof topics] + ` Recent advances in ${matchedTopic} have shown remarkable progress in various applications including computer vision, natural language processing, and robotics.`;
    }

    return `Research content related to "${query}". This field has seen significant developments in recent years, with applications spanning multiple domains and industries.`;
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      if (content.length < 100) return content;
      
      const result = await this.summarizer(content, {
        max_length: 100,
        min_length: 30,
        do_sample: false
      });
      
      return result[0].summary_text;
    } catch (error) {
      console.warn('Failed to generate summary:', error);
      return content.substring(0, 100) + '...';
    }
  }

  private async calculateRelevance(query: string, content: string): Promise<number> {
    try {
      const queryEmbedding = await this.embedder(query);
      const contentEmbedding = await this.embedder(content.substring(0, 500));
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(
        Array.from(queryEmbedding.data),
        Array.from(contentEmbedding.data)
      );
      
      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.warn('Failed to calculate relevance:', error);
      return Math.random() * 0.5 + 0.3; // Random relevance as fallback
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractTitle(url: string): string {
    if (url.includes('wikipedia')) return 'Wikipedia Article';
    if (url.includes('arxiv')) return 'Academic Paper';
    if (url.includes('scholar')) return 'Research Paper';
    return 'Web Resource';
  }
}