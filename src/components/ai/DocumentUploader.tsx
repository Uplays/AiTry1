import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
import { DocumentProcessor, ProcessedDocument } from '@/lib/ai/DocumentProcessor';

interface DocumentUploaderProps {
  onDocumentProcessed: (document: ProcessedDocument) => void;
}

export function DocumentUploader({ onDocumentProcessed }: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [processor] = useState(() => new DocumentProcessor());

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await processFile(file);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setProcessing(file.name);
    try {
      const processed = await processor.processDocument(file);
      setProcessedDocs(prev => [...prev, processed]);
      onDocumentProcessed(processed);
    } catch (error) {
      console.error('Failed to process document:', error);
    } finally {
      setProcessing(null);
    }
  };

  const removeDocument = (id: string) => {
    setProcessedDocs(prev => prev.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card className="neural-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5 neural-pulse" />
            Document Processor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, images (JPG, PNG), and text files
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.bmp"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild className="neural-button">
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>

          {processing && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing {processing}...</span>
              </div>
              <div className="data-stream mt-2"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {processedDocs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-primary">Processed Documents</h3>
          {processedDocs.map((doc) => (
            <Card key={doc.id} className="neural-card">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">{doc.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {doc.type.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDocument(doc.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {doc.summary}
                </p>

                <div className="flex flex-wrap gap-1 mb-2">
                  {doc.keywords.slice(0, 6).map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {doc.entities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.entities.slice(0, 4).map((entity) => (
                      <Badge key={entity} variant="outline" className="text-xs border-accent text-accent">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Size: {formatFileSize(doc.size)} • Processed: {new Date(doc.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}