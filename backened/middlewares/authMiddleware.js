// ==================== FILE 1: backend/middlewares/authMiddleware.js ====================

require("dotenv").config();
const { auth } = require("express-oauth2-jwt-bearer");

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw new Error("❌ Missing AUTH0_DOMAIN or AUTH0_AUDIENCE in backend .env");
}

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
  attachPayload: true,
});

module.exports = checkJwt;
