import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Globe, Brain } from 'lucide-react';
import { WebResearcher, ResearchResult } from '@/lib/ai/WebResearcher';

interface ResearchPanelProps {
  onResearchComplete: (results: ResearchResult[]) => void;
}

export function ResearchPanel({ onResearchComplete }: ResearchPanelProps) {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [researcher] = useState(() => new WebResearcher());

  const handleResearch = async () => {
    if (!query.trim() || isResearching) return;

    setIsResearching(true);
    try {
      const searchResults = await researcher.research({
        query: query.trim(),
        maxResults: 5
      });
      
      setResults(searchResults);
      onResearchComplete(searchResults);
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleResearch();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="neural-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Globe className="w-5 h-5 neural-pulse" />
            Web Research Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter research query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-background/50 border-primary/30 focus:border-primary"
            />
            <Button
              onClick={handleResearch}
              disabled={isResearching || !query.trim()}
              className="neural-button"
            >
              {isResearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Research
            </Button>
          </div>

          {isResearching && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Brain className="w-4 h-4 animate-pulse" />
                <span>AI analyzing web sources...</span>
              </div>
              <div className="data-stream mt-2"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-primary">Research Results</h3>
          {results.map((result) => (
            <Card key={result.id} className="neural-card hover:border-primary/50 transition-all">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground">{result.title}</h4>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {Math.round(result.relevanceScore * 100)}% relevance
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {result.summary}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {result.keywords.slice(0, 5).map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Source: {result.url} • {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}