import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import './CourseMindMap.css';

const CourseMindMap = ({ course }) => {
  const containerRef = useRef(null);
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    // Calculate the width of the horizontal line connecting modules
    const calculateLine = () => {
      if (containerRef.current && course?.modules?.length > 1) {
        const branches = containerRef.current.querySelectorAll('.module-branch');
        if (branches.length > 1) {
          const first = branches[0];
          const last = branches[branches.length - 1];
          // Distance between the centers of the first and last module branch
          const width = last.offsetLeft - first.offsetLeft;
          setLineWidth(width);
        }
      }
    };

    calculateLine();
    window.addEventListener('resize', calculateLine);
    return () => window.removeEventListener('resize', calculateLine);
  }, [course]);

  if (!course || !course.modules || course.modules.length === 0) return null;

  return (
    <div className="mindmap-container">
      <div className="mindmap-header">
        <h3 className="mindmap-title">
          <Network size={20} className="text-indigo-400" />
          Course Mind Map
        </h3>
      </div>

      <div className="mindmap-tree" ref={containerRef}>
        {/* Root Node: Course */}
        <div className="node node-course">
          <div className="node-title">{course.title}</div>
          <div className="node-subtitle">{course.modules.length} Modules</div>
        </div>

        {/* Modules Row */}
        <div className="modules-container">
          {course.modules.length > 1 && (
            <div 
              className="modules-line" 
              style={{ width: `${lineWidth}px` }}
            ></div>
          )}
          
          {course.modules.map((module, mIdx) => (
            <div key={mIdx} className="module-branch">
              <div className="node node-module">
                <div className="node-title">{module.title}</div>
                <div className="node-subtitle">{module.lessons?.length || 0} Lessons</div>
              </div>

              {/* Lessons Column */}
              {module.lessons && module.lessons.length > 0 && (
                <div className="lessons-container">
                  {module.lessons.map((lesson, lIdx) => (
                    <div key={lIdx} className="node node-lesson">
                      {typeof lesson === 'string' ? lesson : lesson.title || `Lesson ${lIdx + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseMindMap;
