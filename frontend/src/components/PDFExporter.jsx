import React, { useState } from "react";
import { Download, Loader, CheckCircle, AlertCircle } from "lucide-react";
import "./PDFExporter.css";

const PDFExporter = ({ lesson, courseInfo = {}, lessonId = null }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Get API URL from environment
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      console.log("📄 Starting PDF export...");
      console.log(`📍 Using API URL: ${API_URL}`);

      let response;

      if (lessonId) {
        console.log(`📄 Exporting lesson ${lessonId} from database...`);
        response = await fetch(`${API_URL}/enrichment/export-lesson/${lessonId}`);
      } else {
        console.log("📄 Exporting lesson from frontend data...");
        response = await fetch(`${API_URL}/enrichment/export-lesson-data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lesson,
            courseInfo,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data.html) {
        throw new Error("Failed to generate PDF HTML");
      }

      const { html, filename } = data.data;

      // Download as HTML (user can print to PDF)
      downloadAsHTML(html, filename);

      console.log("✅ PDF exported successfully");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("❌ Error exporting PDF:", err);
      setError(err.message || "Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download as HTML file with improved print styling
   */
  const downloadAsHTML = (htmlContent, filename) => {
    // Add improved print meta tags and styles
    const enhancedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="Text-to-Learn">
  <meta name="description" content="Generated course lesson">
  <title>${filename.replace(".html", "")}</title>
  <style>
    :root {
      --primary-color: #007bff;
      --secondary-color: #1565c0;
      --accent-color: #ff9800;
      --success-color: #4caf50;
      --text-dark: #1a1a1a;
      --text-light: #666;
      --bg-light: #f9f9f9;
      --bg-code: #f5f5f5;
      --border-color: #ddd;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      color: var(--text-dark);
      background: white;
      line-height: 1.8;
      width: 100%;
      height: auto;
    }

    /* ========== PRINT STYLES - CRITICAL FOR PDF ========== */
    @media print {
      @page {
        size: A4;
        margin: 20mm;
        orphans: 3;
        widows: 3;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: white !important;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
      }

      .pdf-header,
      .pdf-objectives,
      .pdf-content,
      .pdf-footer {
        page-break-inside: avoid;
      }

      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        page-break-inside: avoid;
      }

      .pdf-code-block,
      .pdf-mcq-block,
      .pdf-video-block {
        page-break-inside: avoid;
      }

      img {
        page-break-inside: avoid;
        max-width: 100%;
      }

      a {
        text-decoration: none;
        color: var(--primary-color);
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }

    /* ========== HEADER ========== */
    .pdf-header {
      border-bottom: 3px solid var(--primary-color);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .pdf-header h1 {
      color: var(--primary-color);
      font-size: 28px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    .pdf-header-meta {
      color: var(--text-light);
      font-size: 12px;
      line-height: 1.8;
    }

    .pdf-header-meta p {
      margin: 4px 0;
    }

    /* ========== OBJECTIVES ========== */
    .pdf-objectives {
      background: #f5f7fa;
      border-left: 4px solid var(--primary-color);
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }

    .pdf-objectives h3 {
      color: var(--secondary-color);
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .pdf-objectives ul {
      margin: 0;
      padding-left: 24px;
    }

    .pdf-objectives li {
      margin: 8px 0;
      color: var(--text-dark);
      font-size: 13px;
      line-height: 1.6;
    }

    /* ========== CONTENT ========== */
    .pdf-content {
      line-height: 1.8;
    }

    .pdf-content h1 {
      font-size: 28px;
      color: var(--primary-color);
      margin: 28px 0 14px 0;
      font-weight: 700;
      line-height: 1.3;
    }

    .pdf-content h2 {
      font-size: 22px;
      color: var(--secondary-color);
      margin: 22px 0 12px 0;
      font-weight: 600;
      line-height: 1.3;
    }

    .pdf-content h3 {
      font-size: 18px;
      color: var(--primary-color);
      margin: 18px 0 10px 0;
      font-weight: 600;
    }

    .pdf-content p {
      font-size: 13px;
      line-height: 1.8;
      color: var(--text-dark);
      margin: 12px 0;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }

    /* ========== CODE BLOCKS ========== */
    .pdf-code-block {
      background: var(--bg-code) !important;
      border-left: 4px solid var(--primary-color) !important;
      padding: 16px !important;
      margin: 16px 0 !important;
      font-family: 'Courier New', 'Courier', monospace !important;
      border-radius: 4px;
      overflow-x: auto;
    }

    .pdf-code-block strong {
      color: var(--primary-color);
      display: block;
      margin-bottom: 10px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pdf-code-block pre {
      margin: 0 !important;
      color: var(--text-dark) !important;
      font-size: 11px !important;
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
      line-height: 1.5 !important;
      overflow: visible !important;
    }

    /* ========== VIDEO BLOCKS ========== */
    .pdf-video-block {
      background: var(--bg-light) !important;
      border: 2px dashed var(--border-color) !important;
      padding: 16px !important;
      margin: 16px 0 !important;
      border-radius: 6px;
    }

    .pdf-video-block p {
      color: var(--text-light) !important;
      margin: 0 !important;
      font-size: 13px !important;
      font-weight: 500;
    }

    /* ========== MCQ BLOCKS ========== */
    .pdf-mcq-block {
      background: #fff3e0 !important;
      border: 2px solid var(--accent-color) !important;
      padding: 16px !important;
      margin: 16px 0 !important;
      border-radius: 6px;
    }

    .pdf-mcq-block strong {
      color: var(--accent-color);
      display: block;
      margin-bottom: 12px;
      font-size: 13px;
      font-weight: 600;
    }

    .pdf-mcq-option {
      margin: 10px 0;
      padding: 10px 12px;
      background: white !important;
      border-radius: 4px;
      color: var(--text-dark);
      font-size: 12px;
      line-height: 1.6;
      border-left: 3px solid transparent;
    }

    .pdf-mcq-option.correct {
      background: #e8f5e9 !important;
      border-left-color: var(--success-color) !important;
      font-weight: 500;
    }

    .pdf-mcq-correct-answer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--accent-color);
      color: var(--text-dark);
      font-size: 11px;
      font-weight: 600;
    }

    .pdf-mcq-explanation {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed var(--accent-color);
      color: var(--text-light);
      font-size: 11px;
      font-style: italic;
      line-height: 1.6;
    }

    /* ========== FOOTER ========== */
    .pdf-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-light);
      font-size: 10px;
    }

    .pdf-footer p {
      margin: 4px 0;
    }

    /* ========== SCREEN VIEW (Before printing) ========== */
    @media screen {
      body {
        padding: 20px;
        background: #f5f5f5;
        margin: 0;
      }

      .pdf-content-wrapper {
        background: white;
        padding: 40px;
        margin: 0 auto 20px;
        max-width: 900px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }

      .print-instruction {
        background: #e3f2fd;
        border-left: 4px solid var(--primary-color);
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 4px;
        text-align: center;
        font-size: 14px;
        color: var(--secondary-color);
      }

      .print-instruction strong {
        display: block;
        margin-bottom: 8px;
      }
    }

    /* ========== RESPONSIVE ========== */
    @media screen and (max-width: 768px) {
      .pdf-content-wrapper {
        padding: 20px;
      }

      .pdf-header h1 {
        font-size: 24px;
      }

      .pdf-content h2 {
        font-size: 18px;
      }

      .pdf-content p {
        font-size: 12px;
      }
    }

    @media screen and (max-width: 480px) {
      body {
        padding: 12px;
      }

      .pdf-content-wrapper {
        padding: 16px;
        margin-bottom: 16px;
      }

      .pdf-header h1 {
        font-size: 20px;
      }

      .pdf-content h2 {
        font-size: 16px;
      }

      .pdf-code-block {
        padding: 12px !important;
      }

      .pdf-mcq-block {
        padding: 12px !important;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-content-wrapper">
    <div class="print-instruction">
      <strong>📄 Ready to Print!</strong>
      <span>Press Ctrl+P (Windows) or Cmd+P (Mac) to print as PDF</span>
    </div>
${htmlContent}
  </div>
  <div class="pdf-footer">
    <p>Generated by Text-to-Learn | AI-Powered Course Generator</p>
    <p>Downloaded on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</p>
  </div>
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([enhancedHTML], { type: "text/html;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename.replace(".html", ".html");
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);

    console.log("✅ HTML downloaded. Print to PDF using Ctrl+P or Cmd+P");
  };

  return (
    <div className="pdf-exporter-container">
      <button
        onClick={handleExportPDF}
        disabled={loading || !lesson}
        className={`pdf-export-button ${loading ? "loading" : ""} ${
          success ? "success" : ""
        } ${error ? "error" : ""}`}
        title="Download lesson as PDF/HTML"
      >
        {loading ? (
          <>
            <Loader size={18} className="icon-spin" />
            <span>Generating PDF...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle size={18} className="icon-check" />
            <span>PDF Ready!</span>
          </>
        ) : error ? (
          <>
            <AlertCircle size={18} />
            <span>Export Failed</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>Export as PDF</span>
          </>
        )}
      </button>

      {error && (
        <div className="pdf-export-error">
          <strong>❌ Export Error</strong>
          <p>{error}</p>
          <p>
            💡 <strong>Tip:</strong> Use Ctrl+P (Windows) or Cmd+P (Mac) to print the HTML file as PDF
          </p>
        </div>
      )}

      {success && (
        <div className="pdf-export-success">
          <strong>✅ Success!</strong>
          <p>Your HTML file has been downloaded. Use your browser's print function (Ctrl+P / Cmd+P) to convert to PDF with A4 formatting.</p>
        </div>
      )}
    </div>
  );
};

export default PDFExporter;