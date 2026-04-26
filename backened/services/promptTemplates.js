// backend/services/promptTemplates.js - UPDATED WITH CONTEXT-AWARE CODE

/**
 * Determine the most appropriate programming language for the course/lesson
 */
function determineLanguage(courseTitle, moduleTitle, lessonTitle) {
  const fullContext =
    `${courseTitle} ${moduleTitle} ${lessonTitle}`.toLowerCase();

  // Web Development
  if (
    fullContext.includes("react") ||
    fullContext.includes("vue") ||
    fullContext.includes("angular")
  ) {
    return "jsx";
  }
  if (
    fullContext.includes("node") ||
    fullContext.includes("express") ||
    fullContext.includes("backend")
  ) {
    return "javascript";
  }
  if (fullContext.includes("html") || fullContext.includes("css")) {
    return "html";
  }

  // Mobile Development
  if (fullContext.includes("swift") || fullContext.includes("ios")) {
    return "swift";
  }
  if (fullContext.includes("kotlin") || fullContext.includes("android")) {
    return "kotlin";
  }

  // Data & AI
  if (
    fullContext.includes("machine learning") ||
    fullContext.includes("tensorflow") ||
    fullContext.includes("pytorch") ||
    fullContext.includes("data") ||
    fullContext.includes("ai") ||
    fullContext.includes("analysis")
  ) {
    return "python";
  }

  // Backend & Systems
  if (fullContext.includes("java") || fullContext.includes("spring")) {
    return "java";
  }
  if (fullContext.includes("go") || fullContext.includes("golang")) {
    return "go";
  }
  if (fullContext.includes("rust")) {
    return "rust";
  }
  if (
    fullContext.includes("c#") ||
    fullContext.includes("csharp") ||
    fullContext.includes(".net")
  ) {
    return "csharp";
  }
  if (fullContext.includes("sql") || fullContext.includes("database")) {
    return "sql";
  }

  // Default
  return "python";
}

/**
 * Generate language-specific code example
 */
function generateCodeForLanguage(
  language,
  courseTitle,
  moduleTitle,
  lessonTitle
) {
  const sanitize = (text) => text.replace(/[^a-zA-Z0-9]/g, "").substring(0, 30);
  const className = sanitize(lessonTitle);

  const templates = {
    jsx: `import React, { useState, useCallback } from 'react';

/**
 * ${lessonTitle} Component
 * Demonstrates: ${moduleTitle}
 */
export const ${className}Component = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle execution of ${lessonTitle}
  const handle${className} = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Execute ${lessonTitle} logic
      const response = await fetch('/api/${lessonTitle
        .toLowerCase()
        .replace(/\\s/g, "-")}');
      const result = await response.json();
      setData(result);
      console.log('✅ ${lessonTitle} completed');
    } catch (err) {
      setError(err.message);
      console.error('❌ ${lessonTitle} error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="component">
      <h3>${lessonTitle}</h3>
      <button onClick={handle${className}} disabled={loading}>
        {loading ? 'Processing...' : 'Execute ${lessonTitle}'}
      </button>
      {error && <div className="error">{error}</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default ${className}Component;`,

    javascript: `/**
 * ${lessonTitle}
 * Module: ${moduleTitle} | Course: ${courseTitle}
 */

class ${className} {
  constructor(options = {}) {
    this.options = options;
    console.log('🚀 ${lessonTitle} initialized');
  }

  /**
   * Execute ${lessonTitle} operation
   * @param {Object} input - Input data
   * @returns {Object} Results of ${lessonTitle}
   */
  async execute(input) {
    try {
      console.log('⚙️  Processing ${lessonTitle}...');
      
      // Validate input
      this.validate(input);
      
      // Process data
      const processed = await this.process(input);
      
      // Generate output
      const output = this.generate(processed);
      
      console.log('✅ ${lessonTitle} completed successfully');
      return output;
    } catch (error) {
      console.error('❌ ${lessonTitle} error:', error);
      throw error;
    }
  }

  validate(input) {
    if (!input) throw new Error('Input required for ${lessonTitle}');
    return true;
  }

  async process(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...data,
          processed: true,
          processedAt: new Date().toISOString()
        });
      }, 100);
    });
  }

  generate(data) {
    return {
      success: true,
      data: data,
      message: '${lessonTitle} operation completed'
    };
  }
}

// Usage
const handler = new ${className}();
handler.execute({ sample: 'data' }).then(result => {
  console.log('Result:', result);
}).catch(err => console.error(err));`,

    python: `"""
${lessonTitle}
Module: ${moduleTitle}
Course: ${courseTitle}
"""

import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ${className}:
    """
    Handler for ${lessonTitle}
    
    This class demonstrates best practices for implementing
    ${lessonTitle} in Python.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """Initialize ${lessonTitle} handler"""
        self.config = config or {}
        logger.info(f'${lessonTitle} handler initialized')
    
    def validate(self, data: Dict) -> bool:
        """Validate input for ${lessonTitle}"""
        if not data:
            raise ValueError('Data required for ${lessonTitle}')
        return True
    
    def process(self, data: Dict) -> Dict:
        """Process data for ${lessonTitle}"""
        logger.info(f'Processing ${lessonTitle}...')
        
        processed = {
            **data,
            'processed': True,
            'status': 'completed'
        }
        
        return processed
    
    def generate(self, data: Dict) -> Dict:
        """Generate results for ${lessonTitle}"""
        return {
            'success': True,
            'data': data,
            'message': '${lessonTitle} operation completed'
        }
    
    def execute(self, input_data: Dict) -> Dict:
        """
        Execute complete ${lessonTitle} pipeline
        
        Args:
            input_data: Input data for ${lessonTitle}
            
        Returns:
            Results of ${lessonTitle} execution
        """
        try:
            logger.info(f'Starting ${lessonTitle} execution')
            
            # Step 1: Validate
            self.validate(input_data)
            
            # Step 2: Process
            processed = self.process(input_data)
            
            # Step 3: Generate
            result = self.generate(processed)
            
            logger.info(f'✅ ${lessonTitle} completed successfully')
            return result
            
        except Exception as error:
            logger.error(f'❌ ${lessonTitle} error: {error}')
            raise

# Example usage
if __name__ == '__main__':
    handler = ${className}({'debug': True})
    
    sample_data = {'input': 'sample'}
    result = handler.execute(sample_data)
    print('Result:', result)`,

    java: `/**
 * ${lessonTitle}
 * Module: ${moduleTitle}
 */

import java.util.*;
import java.util.logging.*;

public class ${className} {
    private static final Logger logger = Logger.getLogger(${className}.class.getName());
    private Map<String, Object> config;

    /**
     * Initialize ${lessonTitle} handler
     */
    public ${className}(Map<String, Object> config) {
        this.config = config != null ? config : new HashMap<>();
        logger.info("${lessonTitle} handler initialized");
    }

    /**
     * Validate input for ${lessonTitle}
     */
    private void validate(Map<String, Object> input) throws IllegalArgumentException {
        if (input == null || input.isEmpty()) {
            throw new IllegalArgumentException("Input required for ${lessonTitle}");
        }
    }

    /**
     * Process data for ${lessonTitle}
     */
    private Map<String, Object> process(Map<String, Object> data) {
        logger.info("Processing ${lessonTitle}...");
        
        Map<String, Object> result = new HashMap<>(data);
        result.put("processed", true);
        result.put("status", "completed");
        
        return result;
    }

    /**
     * Generate results for ${lessonTitle}
     */
    private Map<String, Object> generate(Map<String, Object> data) {
        Map<String, Object> output = new HashMap<>();
        output.put("success", true);
        output.put("data", data);
        output.put("message", "${lessonTitle} operation completed");
        
        return output;
    }

    /**
     * Execute complete ${lessonTitle} pipeline
     */
    public Map<String, Object> execute(Map<String, Object> inputData) {
        try {
            logger.info("Starting ${lessonTitle} execution");
            
            validate(inputData);
            Map<String, Object> processed = process(inputData);
            Map<String, Object> result = generate(processed);
            
            logger.info("✅ ${lessonTitle} completed successfully");
            return result;
            
        } catch (Exception error) {
            logger.severe("❌ ${lessonTitle} error: " + error.getMessage());
            throw new RuntimeException(error);
        }
    }

    // Example usage
    public static void main(String[] args) {
        Map<String, Object> config = new HashMap<>();
        config.put("debug", true);
        
        ${className} handler = new ${className}(config);
        
        Map<String, Object> input = new HashMap<>();
        input.put("input", "sample");
        
        Map<String, Object> result = handler.execute(input);
        System.out.println("Result: " + result);
    }
}`,

    sql: `-- ${lessonTitle}
-- Module: ${moduleTitle}
-- Course: ${courseTitle}

/**
 * This SQL example demonstrates ${lessonTitle}
 * Best practices for ${moduleTitle}
 */

-- Create table for ${lessonTitle}
CREATE TABLE IF NOT EXISTS \`${className.toLowerCase()}\` (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Insert sample data for ${lessonTitle}
INSERT INTO \`${className.toLowerCase()}\` (name, description, status) VALUES
    ('Sample 1', 'First example of ${lessonTitle}', 'active'),
    ('Sample 2', 'Second example of ${lessonTitle}', 'active'),
    ('Sample 3', 'Third example of ${lessonTitle}', 'inactive');

-- Query to demonstrate ${lessonTitle}
SELECT 
    id,
    name,
    description,
    status,
    created_at,
    COUNT(*) OVER () as total_count
FROM \`${className.toLowerCase()}\`
WHERE status = 'active'
ORDER BY created_at DESC;

-- Update example for ${lessonTitle}
UPDATE \`${className.toLowerCase()}\`
SET 
    description = CONCAT(description, ' - Updated'),
    status = 'updated'
WHERE id = 1;

-- Delete example for ${lessonTitle}
DELETE FROM \`${className.toLowerCase()}\`
WHERE status = 'inactive'
LIMIT 10;

-- Aggregation example for ${lessonTitle}
SELECT 
    status,
    COUNT(*) as count,
    MAX(created_at) as latest,
    MIN(created_at) as oldest
FROM \`${className.toLowerCase()}\`
GROUP BY status
HAVING count > 0;`,

    go: `package main

import (
	"fmt"
	"log"
)

/**
 * ${lessonTitle}
 * Module: ${moduleTitle}
 * Course: ${courseTitle}
 */

type ${className} struct {
	Config map[string]interface{}
}

// New${className} creates a new instance of ${lessonTitle}
func New${className}(config map[string]interface{}) *${className} {
	if config == nil {
		config = make(map[string]interface{})
	}
	log.Println("🚀 ${lessonTitle} initialized")
	return &${className}{Config: config}
}

// Validate checks input for ${lessonTitle}
func (h *${className}) Validate(input map[string]interface{}) error {
	if input == nil || len(input) == 0 {
		return fmt.Errorf("input required for ${lessonTitle}")
	}
	return nil
}

// Process handles data processing for ${lessonTitle}
func (h *${className}) Process(data map[string]interface{}) map[string]interface{} {
	log.Println("⚙️  Processing ${lessonTitle}...")
	
	result := make(map[string]interface{})
	for k, v := range data {
		result[k] = v
	}
	result["processed"] = true
	result["status"] = "completed"
	
	return result
}

// Generate creates output for ${lessonTitle}
func (h *${className}) Generate(data map[string]interface{}) map[string]interface{} {
	output := map[string]interface{}{
		"success": true,
		"data": data,
		"message": "${lessonTitle} operation completed",
	}
	return output
}

// Execute runs the complete ${lessonTitle} pipeline
func (h *${className}) Execute(input map[string]interface{}) (map[string]interface{}, error) {
	log.Println("Starting ${lessonTitle} execution")
	
	if err := h.Validate(input); err != nil {
		log.Printf("❌ Validation error: %v", err)
		return nil, err
	}
	
	processed := h.Process(input)
	result := h.Generate(processed)
	
	log.Println("✅ ${lessonTitle} completed successfully")
	return result, nil
}

// Main function demonstrates usage
func main() {
	handler := New${className}(map[string]interface{}{"debug": true})
	
	input := map[string]interface{}{"input": "sample"}
	result, err := handler.Execute(input)
	
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	
	fmt.Println("Result:", result)
}`,
  };

  return templates[language] || templates.python;
}

/**
 * Generate a comprehensive prompt for course creation
 */
exports.generateCoursePrompt = (
  topic,
  difficulty = "intermediate"
) => `You are a professional curriculum designer. Generate a comprehensive course outline for: "${topic}"

TARGET AUDIENCE DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
Tailor the course title, modules, and progression specifically for a ${difficulty} level learner.

RESPOND WITH ONLY A VALID JSON OBJECT. NO OTHER TEXT.

{
  "title": "Clear Course Title",
  "description": "2-3 sentence description",
  "tags": ["tag1", "tag2", "tag3"],
  "modules": [
    {
      "title": "Module Title",
      "lessons": ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4"]
    }
  ]
}

STRICT REQUIREMENTS:
- 4-6 modules total
- 4-5 lessons per module
- Progression from basics to advanced
- Concise titles (under 10 words each)
- 3-5 relevant tags

OUTPUT ONLY THE JSON OBJECT. START WITH { END WITH }`;

/**
 * IMPROVED: Generate TRULY UNIQUE, CONTEXTUAL lesson content with LANGUAGE-SPECIFIC CODE
 */
exports.generateLessonPrompt = (
  courseTitle,
  moduleTitle,
  lessonTitle,
  moduleIndex = 0,
  lessonIndex = 0,
  totalModules = 4,
  totalLessons = 16,
  difficulty = "intermediate"
) => {
  // Determine appropriate language for this course
  const language = determineLanguage(courseTitle, moduleTitle, lessonTitle);

  // Generate language-specific code example
  const codeExample = generateCodeForLanguage(
    language,
    courseTitle,
    moduleTitle,
    lessonTitle
  );

  const context = getLessonContext(
    courseTitle,
    moduleTitle,
    lessonTitle,
    moduleIndex,
    lessonIndex,
    totalModules,
    totalLessons
  );

  const contentStrategy = getContentStrategy(context, lessonTitle);

  let depthGuidance = "";
  if (difficulty === "beginner") {
    depthGuidance = `DIFFICULTY: BEGINNER (Explain Like I'm 5)
    - Use extremely simple, beginner-friendly language
    - Explain every basic concept thoroughly
    - Avoid jargon or define it immediately
    - Use relatable, real-world analogies`;
  } else if (difficulty === "expert") {
    depthGuidance = `DIFFICULTY: EXPERT
    - Assume strong prior domain knowledge
    - Focus on advanced concepts, nuances, and edge cases
    - Discuss performance, architecture, and professional standards
    - Skip basic definitions`;
  } else {
    depthGuidance = `DIFFICULTY: INTERMEDIATE
    - Assume learners have a basic foundation
    - Introduce practical applications
    - Show real-world usage patterns
    - Discuss trade-offs`;
  }

  let contentStructure = "";
  if (contentStrategy.type === "synthesis") {
    contentStructure = `CONTENT STRUCTURE (Synthesis Lesson):
    1. Key Concepts Summary - Recap main ideas
    2. Relationships Between Topics - Show how concepts connect
    3. Common Patterns - Identify recurring themes
    4. Integration Points - Show connections to other modules`;
  } else if (contentStrategy.type === "practical") {
    contentStructure = `CONTENT STRUCTURE (Practical Lesson):
    1. Getting Started - Quick setup
    2. Step-by-Step Implementation - Concrete walkthrough
    3. Debugging and Common Issues - Real problems and solutions
    4. Optimization Tips - Best practices`;
  } else if (contentStrategy.type === "conceptual") {
    contentStructure = `CONTENT STRUCTURE (Conceptual Lesson):
    1. Core Concept Explained - What and why
    2. Why This Matters - Context
    3. Key Terminology - Essential terms
    4. Context - How this fits into "${courseTitle}"`;
  } else {
    contentStructure = `CONTENT STRUCTURE (Technical Lesson):
    1. What You Need to Know - Core concepts
    2. How It Works - Mechanics
    3. When to Use It - Applications
    4. Common Patterns - Best practices`;
  }

  const prompt = `You are an expert educator creating a UNIQUE lesson: "${lessonTitle}"

LESSON METADATA:
- Course: "${courseTitle}"
- Module: "${moduleTitle}"
- Lesson: "${lessonTitle}"
- Type: ${contentStrategy.type}
- Depth Level: ${context.depth}
- Programming Language: ${language.toUpperCase()}

${depthGuidance}

${contentStructure}

CRITICAL INSTRUCTIONS:
1. Generate REAL, SPECIFIC content - NOT generic templates
2. Content MUST be unique to "${lessonTitle}" - different from other lessons
3. All paragraphs must contain ACTUAL educational content
4. MCQ questions must be SPECIFIC to content taught in THIS lesson

RESPOND WITH ONLY VALID JSON. NO MARKDOWN, NO CODE FENCES, NO EXPLANATIONS.

{
  "title": "${lessonTitle}",
  "depth": "${context.depth}",
  "type": "${contentStrategy.type}",
  "language": "${language}",
  "objectives": [
    "Objective 1: A specific, measurable learning goal for ${lessonTitle}",
    "Objective 2: A practical skill related to ${lessonTitle}",
    "Objective 3: A critical thinking goal for ${lessonTitle}"
  ],
  "content": [
    {
      "type": "heading",
      "text": "${buildHeading1(contentStrategy, lessonTitle)}",
      "level": 1
    },
    {
      "type": "paragraph",
      "text": "Write a comprehensive introduction (250+ words) SPECIFIC to ${lessonTitle}. Explain what ${lessonTitle} is, why it matters, and what makes it unique. This is NOT generic - contain specific details relevant only to this lesson."
    },
    {
      "type": "heading",
      "text": "${buildHeading2(contentStrategy, lessonTitle)}",
      "level": 2
    },
    {
      "type": "paragraph",
      "text": "Write a detailed explanation (250+ words) SPECIFIC to ${lessonTitle}. Provide concrete details and mechanisms. This must be substantially different from the first paragraph."
    },
    {
      "type": "heading",
      "text": "${buildHeading3(contentStrategy, lessonTitle)}",
      "level": 2
    },
    {
      "type": "paragraph",
      "text": "Write practical content (250+ words) SPECIFIC to ${lessonTitle}. Include specific examples and scenarios. This should differ in focus from previous paragraphs."
    },
    {
      "type": "heading",
      "text": "${buildHeading4(contentStrategy, lessonTitle)}",
      "level": 2
    },
    {
      "type": "paragraph",
      "text": "Write the final section (250+ words) SPECIFIC to ${lessonTitle}. Provide actionable insights specific to this lesson. Conclude with unique perspectives."
    },
    {
      "type": "heading",
      "text": "Practical Example: ${lessonTitle}",
      "level": 2
    },
    {
      "type": "code",
      "language": "${language}",
      "code": ${JSON.stringify(codeExample)},
      "heading": "How to Implement ${lessonTitle}",
      "explanation": "This example demonstrates best practices for ${lessonTitle}. It shows how to structure code, handle errors, and follow ${language.toUpperCase()} conventions."
    },
    {
      "type": "video",
      "query": "${lessonTitle} tutorial with practical examples and detailed explanation"
    },
    {
      "type": "heading",
      "text": "Key Terms (Flashcards)",
      "level": 2
    },
    {
      "type": "flashcards",
      "cards": [
        {"front": "Key Term 1", "back": "Clear, concise definition of Key Term 1"},
        {"front": "Key Term 2", "back": "Clear, concise definition of Key Term 2"},
        {"front": "Key Term 3", "back": "Clear, concise definition of Key Term 3"},
        {"front": "Key Term 4", "back": "Clear, concise definition of Key Term 4"}
      ]
    },
    {
      "type": "heading",
      "text": "Check Your Understanding",
      "level": 2
    },
    {
      "type": "mcq",
      "question": "What is a key aspect of ${lessonTitle}?",
      "options": ["Correct answer about ${lessonTitle}", "Plausible distractor", "Plausible distractor", "Plausible distractor"],
      "answer": 0,
      "explanation": "This is correct because it directly relates to ${lessonTitle} as taught in this lesson."
    },
    {
      "type": "mcq",
      "question": "How would you apply ${lessonTitle} in practice?",
      "options": ["Plausible distractor", "Correct practical application", "Plausible distractor", "Plausible distractor"],
      "answer": 1,
      "explanation": "This demonstrates proper application of ${lessonTitle}."
    },
    {
      "type": "mcq",
      "question": "Why is ${lessonTitle} important?",
      "options": ["Plausible distractor", "Plausible distractor", "Correct importance reason", "Plausible distractor"],
      "answer": 2,
      "explanation": "This correctly identifies why ${lessonTitle} matters in this context."
    },
    {
      "type": "mcq",
      "question": "What is a best practice for ${lessonTitle}?",
      "options": ["Plausible distractor", "Plausible distractor", "Plausible distractor", "Correct best practice"],
      "answer": 3,
      "explanation": "This represents professional best practices for ${lessonTitle}."
    }
  ]
}

OUTPUT ONLY RAW JSON. START WITH { END WITH }`;

  return prompt;
};

// Helper functions (KEPT FROM ORIGINAL)
function getLessonContext(
  courseTitle,
  moduleTitle,
  lessonTitle,
  moduleIndex,
  lessonIndex,
  totalModules,
  totalLessons
) {
  const isFoundational = moduleIndex === 0 && lessonIndex === 0;
  const isFirstModule = moduleIndex === 0;
  const isLastModule = moduleIndex >= totalModules - 2;
  const isFirstLesson = lessonIndex === 0;
  const isLastLesson = lessonIndex === totalLessons - 1;
  const isSynthesisLesson =
    lessonTitle.toLowerCase().includes("summary") ||
    lessonTitle.toLowerCase().includes("project");
  const isPracticalLesson =
    lessonTitle.toLowerCase().includes("practice") ||
    lessonTitle.toLowerCase().includes("implementation");
  const isConceptualLesson =
    lessonTitle.toLowerCase().includes("introduction") ||
    lessonTitle.toLowerCase().includes("fundamentals");
  const isAdvancedLesson =
    lessonTitle.toLowerCase().includes("advanced") || isLastModule;

  return {
    isFoundational,
    isFirstModule,
    isLastModule,
    isFirstLesson,
    isLastLesson,
    isSynthesisLesson,
    isPracticalLesson,
    isConceptualLesson,
    isAdvancedLesson,
    position: `lesson ${lessonIndex + 1} of ${totalLessons}`,
    depth: isFoundational
      ? "foundational"
      : isLastModule
      ? "advanced"
      : "intermediate",
  };
}

function getContentStrategy(context, lessonTitle) {
  if (context.isSynthesisLesson) {
    return {
      type: "synthesis",
      sections: ["Summary", "Connections", "Patterns", "Integration"],
    };
  }
  if (context.isPracticalLesson) {
    return {
      type: "practical",
      sections: [
        "Getting Started",
        "Implementation",
        "Debugging",
        "Optimization",
      ],
    };
  }
  if (context.isConceptualLesson) {
    return {
      type: "conceptual",
      sections: ["Concept", "Importance", "Terminology", "Context"],
    };
  }
  return {
    type: "technical",
    sections: ["Fundamentals", "Mechanics", "Application", "Patterns"],
  };
}

function generateMCQStrategy(context, lessonTitle, contentStrategy) {
  return {
    q1Type: "concept",
    q2Type: "application",
    q3Type: "importance",
    q4Type: "best_practice",
  };
}

function buildHeading1(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `Bringing Together: ${lessonTitle}`;
    case "practical":
      return `Getting Started with ${lessonTitle}`;
    case "conceptual":
      return `Understanding ${lessonTitle}`;
    default:
      return `Introduction to ${lessonTitle}`;
  }
}

function buildHeading2(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `How Concepts Connect`;
    case "practical":
      return `Implementation Guide`;
    case "conceptual":
      return `Core Principles`;
    default:
      return `How It Works`;
  }
}

function buildHeading3(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `Recognizing Patterns`;
    case "practical":
      return `Common Issues & Solutions`;
    case "conceptual":
      return `Why It Matters`;
    default:
      return `When & How to Apply`;
  }
}

function buildHeading4(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `Integration & Application`;
    case "practical":
      return `Best Practices`;
    case "conceptual":
      return `In Context`;
    default:
      return `Best Practices`;
  }
}

module.exports.getLessonContext = getLessonContext;

/**
 * Generate a prompt for the Feynman Simulator evaluation
 */
exports.feynmanPrompt = (lessonTitle, lessonContent, userExplanation) => {
  return `You are acting as a curious beginner student trying to understand "${lessonTitle}". 
Your peer (the user) has just explained the concept to you. 

Here is the context of what they were supposed to learn:
---
${JSON.stringify(lessonContent)}
---

Here is their explanation:
---
${userExplanation}
---

Evaluate their explanation. 
If they did a great job and captured the core essence accurately and simply, congratulate them and give them a high grade.
If their explanation is confusing, uses too much jargon without defining it, or has gaps, act slightly confused. Point out exactly what confused you ("Wait, I don't get what X means...") and ask them to clarify.
If they are factually incorrect, gently correct them.

Respond ONLY with a VALID JSON object in the following format:
{
  "isAccurate": boolean, // true if mostly correct, false if significant errors
      "explanation": "This is correct because it directly relates to ${lessonTitle} as taught in this lesson."
    },
    {
      "type": "mcq",
      "question": "How would you apply ${lessonTitle} in practice?",
      "options": ["Plausible distractor", "Correct practical application", "Plausible distractor", "Plausible distractor"],
      "answer": 1,
      "explanation": "This demonstrates proper application of ${lessonTitle}."
    },
    {
      "type": "mcq",
      "question": "Why is ${lessonTitle} important?",
      "options": ["Plausible distractor", "Plausible distractor", "Correct importance reason", "Plausible distractor"],
      "answer": 2,
      "explanation": "This correctly identifies why ${lessonTitle} matters in this context."
    },
    {
      "type": "mcq",
      "question": "What is a best practice for ${lessonTitle}?",
      "options": ["Plausible distractor", "Plausible distractor", "Plausible distractor", "Correct best practice"],
      "answer": 3,
      "explanation": "This represents professional best practices for ${lessonTitle}."
    }
  ]
}

OUTPUT ONLY RAW JSON. START WITH { END WITH }`;

  return prompt;
};

// Helper functions (KEPT FROM ORIGINAL)
function getLessonContext(
  courseTitle,
  moduleTitle,
  lessonTitle,
  moduleIndex,
  lessonIndex,
  totalModules,
  totalLessons
) {
  const isFoundational = moduleIndex === 0 && lessonIndex === 0;
  const isFirstModule = moduleIndex === 0;
  const isLastModule = moduleIndex >= totalModules - 2;
  const isFirstLesson = lessonIndex === 0;
  const isLastLesson = lessonIndex === totalLessons - 1;
  const isSynthesisLesson =
    lessonTitle.toLowerCase().includes("summary") ||
    lessonTitle.toLowerCase().includes("project");
  const isPracticalLesson =
    lessonTitle.toLowerCase().includes("practice") ||
    lessonTitle.toLowerCase().includes("implementation");
  const isConceptualLesson =
    lessonTitle.toLowerCase().includes("introduction") ||
    lessonTitle.toLowerCase().includes("fundamentals");
  const isAdvancedLesson =
    lessonTitle.toLowerCase().includes("advanced") || isLastModule;

  return {
    isFoundational,
    isFirstModule,
    isLastModule,
    isFirstLesson,
    isLastLesson,
    isSynthesisLesson,
    isPracticalLesson,
    isConceptualLesson,
    isAdvancedLesson,
    position: `lesson ${lessonIndex + 1} of ${totalLessons}`,
    depth: isFoundational
      ? "foundational"
      : isLastModule
      ? "advanced"
      : "intermediate",
  };
}

function getContentStrategy(context, lessonTitle) {
  if (context.isSynthesisLesson) {
    return {
      type: "synthesis",
      sections: ["Summary", "Connections", "Patterns", "Integration"],
    };
  }
  if (context.isPracticalLesson) {
    return {
      type: "practical",
      sections: [
        "Getting Started",
        "Implementation",
        "Debugging",
        "Optimization",
      ],
    };
  }
  if (context.isConceptualLesson) {
    return {
      type: "conceptual",
      sections: ["Concept", "Importance", "Terminology", "Context"],
    };
  }
  return {
    type: "technical",
    sections: ["Fundamentals", "Mechanics", "Application", "Patterns"],
  };
}

function generateMCQStrategy(context, lessonTitle, contentStrategy) {
  return {
    q1Type: "concept",
    q2Type: "application",
    q3Type: "importance",
    q4Type: "best_practice",
  };
}

function buildHeading1(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `Bringing Together: ${lessonTitle}`;
    case "practical":
      return `Getting Started with ${lessonTitle}`;
    case "conceptual":
      return `Understanding ${lessonTitle}`;
    default:
      return `Introduction to ${lessonTitle}`;
  }
}

function buildHeading2(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `How Concepts Connect`;
    case "practical":
      return `Implementation Guide`;
    case "conceptual":
      return `Core Principles`;
    default:
      return `How It Works`;
  }
}

function buildHeading3(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `Recognizing Patterns`;
    case "practical":
      return `Common Issues & Solutions`;
    case "conceptual":
      return `Why It Matters`;
    default:
      return `When & How to Apply`;
  }
}

function buildHeading4(strategy, lessonTitle) {
  switch (strategy.type) {
    case "synthesis":
      return `Integration & Application`;
    case "practical":
      return `Best Practices`;
    case "conceptual":
      return `In Context`;
    default:
      return `Best Practices`;
  }
}

module.exports.getLessonContext = getLessonContext;

/**
 * Generate a prompt for the Feynman Simulator evaluation
 */
exports.feynmanPrompt = (lessonTitle, lessonContent, userExplanation) => {
  return `You are acting as a curious beginner student trying to understand "${lessonTitle}". 
Your peer (the user) has just explained the concept to you. 

Here is the context of what they were supposed to learn:
---
${JSON.stringify(lessonContent)}
---

Here is their explanation:
---
${userExplanation}
---

Evaluate their explanation. 
If they did a great job and captured the core essence accurately and simply, congratulate them and give them a high grade.
If their explanation is confusing, uses too much jargon without defining it, or has gaps, act slightly confused. Point out exactly what confused you ("Wait, I don't get what X means...") and ask them to clarify.
If they are factually incorrect, gently correct them.

Respond ONLY with a VALID JSON object in the following format:
{
  "isAccurate": boolean, // true if mostly correct, false if significant errors
  "feedback": "Your response acting as the student. Point out what was good, what was confusing, or what was wrong.",
  "followUpQuestion": "A clarifying question to push their understanding further (or null if perfect)",
  "grade": "A letter grade (A, B, C, D, or F) based on simplicity and accuracy"
}

OUTPUT ONLY RAW JSON. START WITH { END WITH }`;
};

/**
 * Generate a prompt for the Adaptive Curriculum (Choose Your Own Adventure)
 */
exports.adaptivePathsPrompt = (courseTitle, lessonTitle) => {
  return `You are an expert curriculum designer. The student has just finished learning about "${lessonTitle}" in the course "${courseTitle}".

Generate exactly 3 diverging, exciting paths for what they should learn NEXT. 
The paths must be completely different from each other to give the student a real choice.
- Path 1 should be a "Deep Dive" into the underlying theory or mechanics.
- Path 2 should be a "Practical Application" showing how this is used in the real world.
- Path 3 should be a "Lateral Concept" or an advanced edge case related to the topic.

Respond ONLY with a VALID JSON array of objects in the following format:
[
  {
    "type": "Deep Dive",
    "title": "Title of the new lesson",
    "description": "A short, exciting 1-sentence hook of what they will learn."
  },
  {
    "type": "Practical Application",
    "title": "Title of the new lesson",
    "description": "A short, exciting 1-sentence hook of what they will learn."
  },
  {
    "type": "Lateral Concept",
    "title": "Title of the new lesson",
    "description": "A short, exciting 1-sentence hook of what they will learn."
  }
]

OUTPUT ONLY RAW JSON. START WITH [ END WITH ]`;
};
