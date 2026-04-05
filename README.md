# 📚 Text-to-Learn: AI-Powered Course Generator

## 🎯 Overview
Text-to-Learn is a full-stack web application that transforms any topic into a structured, multi-module online course using AI. Users can input a topic prompt, and the application automatically generates a complete course with modules, lessons, objectives, code examples, quizzes, and video suggestions.

## 🌐 Live Demo
- **Frontend:** https://text-to-learn-5v9z.vercel.app
- **Backend API:** https://text-to-learn-app.onrender.com/health

## ✨ Key Features
- ✅ **AI-Powered Course Generation** - Generate complete courses from topic prompts
- ✅ **Rich Lesson Content** - Text, code blocks, MCQs, video suggestions
- ✅ **User Authentication** - Secure login via Auth0
- ✅ **Save & Persist Courses** - Save generated courses to your library
- ✅ **PDF Export** - Download lessons as formatted PDFs
- ✅ **Multilingual Support** - Hinglish audio explanations (via Gemini TTS)
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **YouTube Integration** - Dynamic video suggestions for each lesson

## 🛠️ Technology Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool (fast development)
- **React Router** - Navigation
- **Auth0** - Authentication
- **CSS** - Custom styling with animations
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Auth0** - JWT validation
- **Google Gemini API** - AI course generation & Hinglish TTS
- **YouTube Data API** - Video search

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## 📋 Project Structure

## 📁 Project Structure

### Backend

```text
text-to-learn-backend/
├── server.js
│   ├── Initializes Express app
│   ├── Configures middleware (CORS, JSON parsing)
│   ├── Connects to MongoDB
│   ├── Registers routes
│   └── Starts server
│
├── config/
│   └── db.js
│       └── MongoDB connection logic
│
├── middlewares/
│   ├── authMiddleware.js
│   │   └── JWT verification using Auth0
│   ├── attachUser.js
│   │   └── Attaches authenticated user info to request
│   └── errorMiddleware.js
│       ├── Request logging
│       ├── 404 handler
│       └── Global error handler
│
├── models/
│   ├── Course.js
│   │   └── Course schema with modules and metadata
│   ├── Module.js
│   │   └── Module schema linked to courses
│   ├── Lesson.js
│   │   └── Lesson schema supporting content blocks & saves
│   └── User.js
│       └── Optional user model (Auth0 handles authentication)
│
├── routes/
│   ├── aiRoutes.js
│   │   ├── Course generation
│   │   └── Lesson generation
│   ├── courseRoutes.js
│   │   └── CRUD operations for courses
│   ├── moduleRoutes.js
│   │   └── Manage course modules
│   ├── lessonRoutes.js
│   │   └── Lesson CRUD & save operations
│   └── enrichment.js
│       ├── YouTube video search
│       ├── Hinglish translation
│       ├── Audio generation
│       └── PDF export
│
├── controllers/
│   ├── aiController.js
│   │   └── AI-powered generation workflows
│   ├── courseController.js
│   │   └── Course business logic
│   ├── moduleController.js
│   │   └── Module management
│   └── lessonController.js
│       └── Lesson operations
│
├── services/
│   ├── aiService.js
│   │   └── LLM interaction and content generation
│   ├── multilingualService.js
│   │   └── Hinglish translation & TTS helpers
│   ├── youtubeService.js
│   │   └── YouTube Data API integration
│   ├── pdfExportService.js
│   │   └── Lesson & module PDF export
│   ├── promptTemplates.js
│   │   └── Structured AI prompt builders
│   └── validator.js
│       └── Validation & sanitization of AI outputs
│
├── utils/
│   └── Helper utilities
│
├── .env.example
├── .gitignore
├── package.json
└── README.md




text-to-learn-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── index.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ChatPrompt.jsx
│   │   ├── CoursePreview.jsx
│   │   ├── LessonRenderer.jsx
│   │   ├── HinglishTranslator.jsx
│   │   ├── PDFExporter.jsx
│   │   └── blocks/
│   │       ├── HeadingBlock.jsx
│   │       ├── ParagraphBlock.jsx
│   │       ├── CodeBlock.jsx
│   │       ├── VideoBlock.jsx
│   │       └── MCQBlock.jsx
│
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Profile.jsx
│   │   ├── Course.jsx
│   │   └── Lesson.jsx
│
│   ├── hooks/
│   │   ├── useLessonData.js
│   │   ├── useFetch.js
│   │   └── useSpeechSynthesis.js
│
│   ├── utils/
│   │   └── api.js
│
│   ├── context/
│
│   └── assets/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
