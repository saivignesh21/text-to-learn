// src/components/blocks/CodeBlock.jsx - WITH SYNTAX HIGHLIGHTING

import React, { useState, useEffect } from "react";
import { Copy, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "./CodeBlock.css";

const CodeBlock = ({ 
  language = "javascript", 
  code = "", 
  text = "",
  heading = "",
  explanation = ""
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [highlightedCode, setHighlightedCode] = useState("");

  // Use 'code' field first, fallback to 'text' field
  let codeContent = code || text || "";

  // Fix escaped newlines from backend
  if (typeof codeContent === "string") {
    codeContent = codeContent
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .trim();
  }

  // If code is a JSON string, parse it
  if (typeof codeContent === "string" && codeContent.startsWith('"')) {
    try {
      codeContent = JSON.parse(codeContent);
    } catch (e) {
      // Not JSON, keep as is
    }
  }

  // Syntax highlighting with Prism.js
  useEffect(() => {
    if (!codeContent) {
      setHighlightedCode("");
      return;
    }

    try {
      // Map language aliases
      const languageMap = {
        js: "javascript",
        ts: "typescript",
        jsx: "jsx",
        tsx: "typescript",
        py: "python",
        java: "java",
        c: "clike",
        cpp: "cpp",
        cs: "csharp",
        php: "php",
        rb: "ruby",
        go: "go",
        rs: "rust",
        kt: "kotlin",
        swift: "swift",
        sql: "sql",
        html: "markup",
        xml: "markup",
        css: "css",
        bash: "bash",
        sh: "bash",
      };

      const lang = languageMap[language.toLowerCase()] || language.toLowerCase();
      
      // Highlight the code
      const highlighted = Prism.highlight(
        codeContent,
        Prism.languages[lang] || Prism.languages.markup,
        lang
      );

      setHighlightedCode(highlighted);
    } catch (err) {
      console.error("Error highlighting code:", err);
      setHighlightedCode(codeContent);
    }
  }, [codeContent, language]);

  useEffect(() => {
    console.group("📝 CodeBlock Info");
    console.log("Language:", language);
    console.log("Has Code:", !!code);
    console.log("Code Length:", codeContent.length);
    console.log("Has Explanation:", !!explanation);
    console.log("Has Heading:", !!heading);
    console.groupEnd();
  }, [code, language, explanation, heading]);

  const isEmpty = !codeContent || codeContent === "";

  const handleCopy = async () => {
    if (isEmpty) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeContent);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = codeContent;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("❌ Failed to copy:", err);
    }
  };

  // Empty state
  if (isEmpty) {
    return (
      <div className="code-block-container code-block-empty">
        <div className="code-block-header">
          <span className="code-language">{language.toUpperCase()}</span>
          <span className="code-status-badge">No Code Available</span>
        </div>
        <div className="code-block-empty-state">
          <AlertCircle size={20} />
          <p>No code content available for this section</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-block-container">
      {/* Heading and Explanation */}
      {(heading || explanation) && (
        <div className="code-block-info">
          {heading && <h3 className="code-block-heading">{heading}</h3>}
          {explanation && (
            <p className="code-block-explanation">{explanation}</p>
          )}
        </div>
      )}

      {/* Header with Language and Copy Button */}
      <div className="code-block-header">
        <div className="code-block-left">
          <span className="code-language-badge">{language.toUpperCase()}</span>
          <span className="code-lines">
            {codeContent.split('\n').length} lines
          </span>
        </div>

        <div className="code-block-actions">
          <button
            onClick={handleCopy}
            className="code-copy-btn"
            title="Copy code"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={16} className="icon" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="icon" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="code-expand-btn"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Code Block with Syntax Highlighting */}
      {isExpanded && (
        <div className="code-block-wrapper">
          <pre className="code-block-pre">
            <code
              className={`code-block-code language-${language.toLowerCase()}`}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
