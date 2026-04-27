import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import ForceGraph3D from 'react-force-graph-3d';
import { Network, Sparkles, X, Loader2 } from 'lucide-react';
import { getUserCourses, discoverConnections } from '../utils/api';
import './KnowledgeGraph.css';

const KnowledgeGraph = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [rawCourses, setRawCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  
  const fgRef = useRef();

  // Color palette for different node types
  const COLORS = {
    user: '#ef4444',     // Red
    course: '#3b82f6',   // Blue
    module: '#10b981',   // Green
    lesson: '#8b5cf6',   // Purple
    aiLink: '#f59e0b'    // Amber/Gold
  };

  useEffect(() => {
    const fetchAndBuildGraph = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = await getAccessTokenSilently();
        const coursesData = await getUserCourses(token);
        const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || []);

        const nodes = [];
        const links = [];
        
        // Root Node (The "Second Brain")
        nodes.push({
          id: 'root',
          name: 'My Knowledge Base',
          val: 20,
          color: COLORS.user,
          type: 'user',
          desc: 'Your central hub of all learned concepts.'
        });

        courses.forEach(course => {
          const courseId = `course_${course._id}`;
          nodes.push({
            id: courseId,
            name: course.title,
            val: 15,
            color: COLORS.course,
            type: 'course',
            desc: course.description
          });
          links.push({
            source: 'root',
            target: courseId,
            color: 'rgba(255,255,255,0.2)',
            type: 'standard'
          });

          if (course.modules) {
            course.modules.forEach(module => {
              const moduleId = `module_${module._id}`;
              nodes.push({
                id: moduleId,
                name: module.title,
                val: 10,
                color: COLORS.module,
                type: 'module',
                desc: module.description
              });
              links.push({
                source: courseId,
                target: moduleId,
                color: 'rgba(255,255,255,0.2)',
                type: 'standard'
              });

              // WE INTENTIONALLY OMIT LESSONS TO KEEP THE GRAPH CLEAN 
              // AND RESEMBLING THE "INITIAL" STATE YOU LIKED
            });
          }
        });

        setRawCourses(courses);
        setGraphData({ nodes, links });
      } catch (err) {
        console.error("Error building graph:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndBuildGraph();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleDiscoverConnections = async () => {
    setIsDiscovering(true);
    setSelectedNode(null);
    setSelectedLink(null);

    try {
      const token = await getAccessTokenSilently();
      
      const lessonsForAi = [];
      const lessonToModuleMap = {};

      rawCourses.forEach(course => {
        if (course.modules) {
          course.modules.forEach(module => {
            if (module.lessons) {
              module.lessons.forEach(lesson => {
                lessonsForAi.push({ id: lesson._id, title: lesson.title });
                lessonToModuleMap[lesson._id] = `module_${module._id}`;
              });
            }
          });
        }
      });
      
      if (lessonsForAi.length < 2) {
        alert("You need at least 2 lessons in your knowledge base to discover connections!");
        setIsDiscovering(false);
        return;
      }

      const response = await discoverConnections(lessonsForAi, token);
      
      if (response && response.success && response.data) {
        const newConnections = response.data;
        
        const aiLinks = [];
        const addedPairs = new Set(); 

        newConnections.forEach((conn, idx) => {
          const sourceModule = lessonToModuleMap[conn.sourceId];
          const targetModule = lessonToModuleMap[conn.targetId];

          if (sourceModule && targetModule && sourceModule !== targetModule) {
            const pairKey = [sourceModule, targetModule].sort().join('-');
            if (!addedPairs.has(pairKey)) {
              addedPairs.add(pairKey);
              
              const sourceModName = graphData.nodes.find(n => n.id === sourceModule)?.name || 'Module';
              const targetModName = graphData.nodes.find(n => n.id === targetModule)?.name || 'Module';

              aiLinks.push({
                source: sourceModule,
                target: targetModule,
                color: COLORS.aiLink,
                type: 'ai',
                desc: conn.reason,
                sourceName: sourceModName,
                targetName: targetModName,
                id: `aiLink_${idx}`
              });
            }
          }
        });

        setGraphData(prev => ({
          nodes: prev.nodes,
          links: [...prev.links, ...aiLinks]
        }));
      }
    } catch (err) {
      console.error("Error discovering connections:", err);
      alert("Failed to generate AI connections. Please try again later.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleNodeClick = useCallback(node => {
    // Aim at node from outside it
    const distance = 80;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );

    setSelectedLink(null);
    setSelectedNode(node);
  }, [fgRef]);

  const handleLinkClick = useCallback(link => {
    if (link.type === 'ai') {
      setSelectedNode(null);
      setSelectedLink(link);
    }
  }, []);

  return (
    <div className="knowledge-graph-container">
      {isLoading && (
        <div className="kg-loading">
          <Loader2 size={48} className="kg-loading-spinner text-indigo-500" />
          <h2>Constructing Your Second Brain...</h2>
        </div>
      )}

      {!isLoading && (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeVal="val"
          nodeOpacity={0.9}
          linkWidth={link => link.type === 'ai' ? 2 : 1}
          linkColor="color"
          linkDirectionalParticles={link => link.type === 'ai' ? 4 : 0}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          backgroundColor="#0f172a"
        />
      )}

      <div className="kg-overlay">
        <div className="kg-header">
          <h1><Network size={32} className="text-indigo-400" /> 3D Knowledge Graph</h1>
          <p>Explore how all your learned concepts interconnect in a visual "Second Brain".</p>
          
          <div className="kg-controls">
            <button 
              className="kg-ai-btn" 
              onClick={handleDiscoverConnections}
              disabled={isDiscovering || isLoading}
            >
              {isDiscovering ? (
                <><Loader2 size={18} className="animate-spin" /> Analyzing Cortex...</>
              ) : (
                <><Sparkles size={18} /> Discover AI Connections</>
              )}
            </button>
          </div>
        </div>

        <div className={`kg-panel ${selectedNode || selectedLink ? 'open' : ''}`}>
          {selectedNode && (
            <>
              <h3>
                Node Details
                <button className="kg-panel-close" onClick={() => setSelectedNode(null)}><X size={18} /></button>
              </h3>
              <div className="kg-panel-content">
                <span className={`badge ${selectedNode.type}`}>{selectedNode.type.toUpperCase()}</span>
                <h4 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>{selectedNode.name}</h4>
                <p>{selectedNode.desc || "No description available."}</p>
              </div>
            </>
          )}

          {selectedLink && (
            <>
              <h3>
                AI Connection
                <button className="kg-panel-close" onClick={() => setSelectedLink(null)}><X size={18} /></button>
              </h3>
              <div className="kg-panel-content">
                <span className="badge ai-link">AI DISCOVERED LINK</span>
                <h4 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
                  {selectedLink.sourceName || selectedLink.source.name || 'Module'} ↔ {selectedLink.targetName || selectedLink.target.name || 'Module'}
                </h4>
                <p style={{ fontStyle: 'italic', color: '#fbbf24' }}>
                  "{selectedLink.desc}"
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
