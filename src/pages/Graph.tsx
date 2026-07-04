import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { getNotes } from '../services/filesystem';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { ImpactStyle } from '@capacitor/haptics';
import './Graph.css';

interface GraphData {
  nodes: { id: string, name: string, val: number }[];
  links: { source: string, target: string }[];
}

export const Graph: React.FC = () => {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const buildGraph = async () => {
      const notes = await getNotes();
      const nodes = notes.map(n => ({ id: n.title, name: n.title, val: 2 }));
      const links: { source: string, target: string }[] = [];
      
      const nodeIds = new Set(nodes.map(n => n.id));

      notes.forEach(note => {
        // Find wiki-links [[Link]] or markdown links [Link](Link.md)
        const content = note.content;
        const linkRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
          const target = match[1];
          if (nodeIds.has(target)) {
            links.push({ source: note.title, target });
          }
        }
      });

      setData({ nodes, links });
      
      // Add slight delay to zoom to fit
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 50);
        }
      }, 500);
    };
    buildGraph();
  }, []);

  const handleNodeClick = (node: any) => {
    triggerHaptic(ImpactStyle.Light);
    playSound('pop');
    navigate(`/note/${encodeURIComponent(node.id + '.md')}`);
  };

  return (
    <div className="graph-page">
      <header className="graph-header glass">
        <h1>Knowledge Graph</h1>
        <p>Your connections</p>
      </header>
      <div className="graph-container">
        <ForceGraph2D
          ref={fgRef}
          width={width}
          height={height}
          graphData={data}
          nodeLabel="name"
          nodeColor={() => '#B85025'}
          linkColor={() => 'rgba(122, 105, 91, 0.4)'}
          backgroundColor="transparent"
          onNodeClick={handleNodeClick}
          nodeRelSize={6}
          linkWidth={2}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>
    </div>
  );
};
