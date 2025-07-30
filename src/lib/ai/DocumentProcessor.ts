import { getDocument } from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { pipeline } from '@huggingface/transformers';

export interface ProcessedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'image';
  content: string;
  summary: string;
  keywords: string[];
  entities: string[];
  timestamp: number;
  size: number;
}

export class DocumentProcessor {
  private summarizer: any = null;
  private nerModel: any = null;
  private ocrWorker: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('📄 Initializing Document Processor...');
    
    try {
      // Initialize NLP models
      this.summarizer = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { device: 'webgpu' }
      );

      this.nerModel = await pipeline(
        'token-classification',
        'Xenova/bert-base-NER',
        { device: 'webgpu' }
      );

      // Initialize OCR worker
      this.ocrWorker = await createWorker();
      await this.ocrWorker.loadLanguage('eng');
      await this.ocrWorker.initialize('eng');

      this.initialized = true;
      console.log('✅ Document Processor initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Document Processor:', error);
      throw error;
    }
  }

  async processDocument(file: File): Promise<ProcessedDocument> {
    await this.initialize();
    
    console.log(`📄 Processing document: ${file.name}`);
    
    let content = '';
    const type = this.getDocumentType(file);

    switch (type) {
      case 'pdf':
        content = await this.processPDF(file);
        break;
      case 'image':
        content = await this.processImage(file);
        break;
      case 'text':
        content = await this.processText(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }

    const summary = await this.generateSummary(content);
    const keywords = this.extractKeywords(content);
    const entities = await this.extractEntities(content);

    const processed: ProcessedDocument = {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      content,
      summary,
      keywords,
      entities,
      timestamp: Date.now(),
      size: file.size
    };

    console.log(`✅ Document processed: ${file.name}`);
    return processed;
  }

  private getDocumentType(file: File): 'pdf' | 'text' | 'image' {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('text/')) return 'text';
    
    // Check by extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) return 'image';
    
    return 'text'; // Default to text
  }

  private async processPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Failed to process PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async processImage(file: File): Promise<string> {
    try {
      const { data: { text } } = await this.ocrWorker.recognize(file);
      return text.trim();
    } catch (error) {
      console.error('Failed to process image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  private async processText(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      console.error('Failed to process text file:', error);
      throw new Error('Failed to read text file');
    }
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      if (content.length < 100) return content;
      
      // Split long content into chunks
      const maxLength = 1000;
      const chunks = this.splitIntoChunks(content, maxLength);
      const summaries = [];

      for (const chunk of chunks.slice(0, 3)) { // Process max 3 chunks
        const result = await this.summarizer(chunk, {
          max_length: 100,
          min_length: 30,
          do_sample: false
        });
        summaries.push(result[0].summary_text);
      }

      return summaries.join(' ');
    } catch (error) {
      console.warn('Failed to generate summary:', error);
      return content.substring(0, 200) + '...';
    }
  }

  private async extractEntities(content: string): Promise<string[]> {
    try {
      const maxLength = 500; // Limit content length for NER
      const truncatedContent = content.substring(0, maxLength);
      
      const result = await this.nerModel(truncatedContent);
      const entities = result
        .filter((entity: any) => entity.entity !== 'O')
        .map((entity: any) => String(entity.word))
        .filter((word: string) => word.length > 2);

      return [...new Set(entities as string[])]; // Remove duplicates
    } catch (error) {
      console.warn('Failed to extract entities:', error);
      return [];
    }
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
      .slice(0, 15)
      .map(([word]) => word);
  }

  private splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async destroy() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
    }
  }
}