import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Zap, TrendingUp } from 'lucide-react';
import { KnowledgeNode, KnowledgeEdge } from '@/lib/ai/KnowledgeGraph';

interface KnowledgeGraphVisualizationProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export function KnowledgeGraphVisualization({ nodes, edges }: KnowledgeGraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const margin = 40;

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', 'hsl(195, 100%, 50%)')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight * 5));

    // Create node groups
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles to nodes
    nodeGroup
      .append('circle')
      .attr('r', (d: any) => 5 + d.weight * 10)
      .attr('fill', (d: any) => {
        const colors = {
          concept: 'hsl(195, 100%, 50%)',
          entity: 'hsl(280, 100%, 60%)',
          document: 'hsl(120, 100%, 50%)',
          query: 'hsl(45, 100%, 55%)'
        };
        return colors[d.type as keyof typeof colors] || 'hsl(195, 100%, 50%)';
      })
      .attr('stroke', 'hsl(195, 100%, 70%)')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 10px hsl(195, 100%, 50% / 0.5))')
      .on('click', (event, d: any) => {
        setSelectedNode(d);
      });

    // Add labels
    nodeGroup
      .append('text')
      .text((d: any) => d.label.substring(0, 15) + (d.label.length > 15 ? '...' : ''))
      .attr('font-size', '10px')
      .attr('fill', 'hsl(190, 100%, 95%)')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup
        .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  const getNodeTypeColor = (type: string) => {
    const colors = {
      concept: 'bg-primary',
      entity: 'bg-neural-secondary',
      document: 'bg-neural-success',
      query: 'bg-neural-warning'
    };
    return colors[type as keyof typeof colors] || 'bg-primary';
  };

  return (
    <div className="space-y-4">
      <Card className="neural-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Network className="w-5 h-5 neural-pulse" />
            Knowledge Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <svg
              ref={svgRef}
              width="100%"
              height="400"
              viewBox="0 0 600 400"
              className="border border-primary/20 rounded-lg bg-background/30"
            />
            
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No knowledge data yet</p>
                  <p className="text-sm">Upload documents or research topics to build the graph</p>
                </div>
              </div>
            )}
          </div>

          {nodes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs">Concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neural-secondary"></div>
                <span className="text-xs">Entities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neural-success"></div>
                <span className="text-xs">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neural-warning"></div>
                <span className="text-xs">Queries</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNode && (
        <Card className="neural-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4" />
              Selected Node: {selectedNode.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={getNodeTypeColor(selectedNode.type)}>
                {selectedNode.type}
              </Badge>
              <Badge variant="outline">
                Weight: {selectedNode.weight.toFixed(2)}
              </Badge>
              <Badge variant="outline">
                Connections: {selectedNode.connections.length}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedNode.content.substring(0, 200)}
              {selectedNode.content.length > 200 && '...'}
            </p>

            {selectedNode.metadata.domain && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm">Domain: {selectedNode.metadata.domain}</span>
              </div>
            )}

            {selectedNode.metadata.confidence && (
              <div className="text-sm text-muted-foreground">
                Confidence: {Math.round(selectedNode.metadata.confidence * 100)}%
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}