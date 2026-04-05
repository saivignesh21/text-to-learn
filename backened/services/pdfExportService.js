// backend/services/pdfExportService.js - LIGHTWEIGHT (NO DEPENDENCIES)

/**
 * Create styled HTML from lesson data
 * @param {Object} lesson - Lesson object with title, objectives, content
 * @param {Object} courseInfo - Course information (title, module)
 * @returns {string} HTML string
 */
function createLessonHTML(lesson, courseInfo = {}) {
  const { title = "Lesson", objectives = [], content = [] } = lesson;
  const { courseName = "Course", moduleName = "Module" } = courseInfo;

  // Render content blocks
  const contentHTML = content
    .map((block) => {
      switch (block.type) {
        case "heading":
          const level = block.level || 2;
          const headingSize =
            {
              1: "32px",
              2: "24px",
              3: "20px",
            }[level] || "18px";
          return `<h${level} style="font-size: ${headingSize}; color: #1a1a1a; margin: 20px 0 10px 0; font-weight: 600;">
            ${block.text || block.title || ""}
          </h${level}>`;

        case "paragraph":
          return `<p style="font-size: 14px; line-height: 1.8; color: #333; margin: 10px 0; text-align: justify;">
            ${(block.text || "").replace(/\n/g, "<br>")}
          </p>`;

        case "code":
          return `<div style="background: #f5f5f5; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; font-family: 'Courier New', monospace; overflow-x: auto;">
            <strong style="color: #007bff;">${block.language || "Code"}</strong>
            <pre style="margin: 10px 0 0 0; color: #333; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;">
${(block.code || block.text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </pre>
          </div>`;

        case "video":
          return `<div style="background: #f9f9f9; border: 2px dashed #ccc; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <p style="color: #666; margin: 0;">📹 <strong>Video Resource:</strong> ${
              block.query || "Video content"
            }</p>
          </div>`;

        case "mcq":
          const answerLetter = String.fromCharCode(65 + (block.answer || 0));
          const options = (block.options || [])
            .map(
              (opt, idx) =>
                `<p style="margin: 8px 0; padding: 8px; background: ${
                  idx === block.answer ? "#e8f5e9" : "#fff"
                }; border-radius: 4px;">
              ${String.fromCharCode(65 + idx)}) ${opt} ${
                  idx === block.answer ? "✓" : ""
                }
            </p>`
            )
            .join("");

          return `<div style="background: #fff3e0; border: 2px solid #ff9800; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <strong style="color: #ff9800;">❓ ${
              block.question || "Question"
            }</strong>
            ${options}
            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ff9800; color: #333; font-size: 12px;">
              <strong>Correct Answer: ${answerLetter}</strong>
            </p>
            ${
              block.explanation
                ? `<p style="margin-top: 8px; color: #555; font-size: 12px; font-style: italic;">
                <strong>Explanation:</strong> ${block.explanation}
              </p>`
                : ""
            }
          </div>`;

        default:
          return "";
      }
    })
    .join("");

  // Create objectives list
  const objectivesHTML =
    objectives.length > 0
      ? `<div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #1565c0; margin-top: 0;">📚 Learning Objectives</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${objectives
            .map((obj) => `<li style="margin: 5px 0; color: #333;">${obj}</li>`)
            .join("")}
        </ul>
      </div>`
      : "";

  // Create complete HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a1a1a;
          background-color: #fff;
          line-height: 1.6;
          padding: 20px;
        }
        
        .page-break {
          page-break-after: always;
          margin-top: 30px;
        }
        
        @page {
          size: A4;
          margin: 20mm;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #007bff; font-size: 28px; margin-bottom: 10px;">${title}</h1>
        <div style="color: #666; font-size: 12px; line-height: 1.8;">
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Module:</strong> ${moduleName}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}</p>
        </div>
      </div>

      <!-- Objectives Section -->
      ${objectivesHTML}

      <!-- Content Section -->
      <div style="color: #1a1a1a;">
        ${contentHTML}
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 11px;">
        <p>Generated by Text-to-Learn | AI-Powered Course Generator</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Export lesson as HTML/PDF data
 * @param {Object} lesson - Lesson object
 * @param {Object} courseInfo - Course info { courseName, moduleName }
 * @returns {Promise<Object>} Object with HTML content and filename
 */
async function exportLessonAsPDF(lesson, courseInfo = {}) {
  try {
    console.log(`📄 Generating lesson HTML for export...`);

    const html = createLessonHTML(lesson, courseInfo);
    const filename = `${
      lesson.title || "lesson".toLowerCase().replace(/\s+/g, "-")
    }.html`;

    return {
      success: true,
      html: html,
      filename: filename,
      title: lesson.title,
    };
  } catch (error) {
    console.error("🔥 Error exporting lesson as PDF:", error.message);
    throw error;
  }
}

/**
 * Export multiple lessons as single HTML
 * @param {Array} lessons - Array of lesson objects
 * @param {Object} courseInfo - Course info
 * @returns {Promise<Object>} Object with combined HTML
 */
async function exportModuleAsPDF(lessons, courseInfo = {}) {
  try {
    console.log(
      `📄 Generating module HTML for export (${lessons.length} lessons)...`
    );

    // Combine all lessons into single HTML
    const contentHTML = lessons
      .map((lesson, idx) => {
        const html = createLessonHTML(lesson, courseInfo);
        // Extract body content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        const bodyContent = bodyMatch ? bodyMatch[1] : "";
        return (
          bodyContent +
          (idx < lessons.length - 1 ? '<div class="page-break"></div>' : "")
        );
      })
      .join("");

    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${courseInfo.moduleName || "Module"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; padding: 20px; }
          .page-break { page-break-after: always; margin-top: 30px; }
          @page { size: A4; margin: 20mm; }
        </style>
      </head>
      <body>${contentHTML}</body>
      </html>
    `;

    return {
      success: true,
      html: fullHTML,
      filename: `${courseInfo.moduleName || "module"}.html`,
      title: courseInfo.moduleName,
    };
  } catch (error) {
    console.error("🔥 Error exporting module as PDF:", error.message);
    throw error;
  }
}

module.exports = {
  createLessonHTML,
  exportLessonAsPDF,
  exportModuleAsPDF,
};
