// backend/middlewares/errorMiddleware.js

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses
 */
const logger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`📨 [${req.method}] ${req.path}`);
  if (req.user) {
    console.log(`   User: ${req.user.sub}`);
  }

  // Capture response finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode < 400 ? "✅" : "❌";
    console.log(
      `${statusEmoji} [${res.statusCode}] ${req.path} (${duration}ms)`
    );
  });

  next();
};

/**
 * 404 Not Found middleware
 * Should be placed before error handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handling middleware
 * Should be added at the END of all other middleware/routes
 *
 * Handles:
 * - JWT validation errors (Auth0)
 * - MongoDB validation errors
 * - MongoDB cast errors (invalid ObjectId)
 * - MongoDB duplicate key errors
 * - Generic server errors
 */
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error occurred:", {
    message: err.message,
    status: err.status,
    code: err.code,
    path: req.path,
    method: req.method,
    name: err.name,
  });

  // Auth0 JWT errors (from express-oauth2-jwt-bearer)
  if (err.name === "UnauthorizedError" || err.status === 401) {
    return res.status(401).json({
      error: "Unauthorized",
      message: err.message || "Invalid or missing authentication token",
    });
  }

  // MongoDB validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Error",
      messages: messages,
    });
  }

  // MongoDB cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
      message: `Invalid ${err.kind}: ${err.value}`,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: "Duplicate Entry",
      message: `${field} already exists`,
    });
  }

  // Generic server error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { logger, notFound, errorHandler };
