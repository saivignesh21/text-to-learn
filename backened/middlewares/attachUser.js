/**
 * Attach Auth0 user information to req.user
 * Works with express-oauth2-jwt-bearer
 * Extracts user metadata from JWT and adds to request object
 */
const attachUser = (req, res, next) => {
  try {
    // express-oauth2-jwt-bearer stores decoded token in req.auth
    if (req.auth && req.auth.payload) {
      req.user = {
        sub: req.auth.payload.sub, // Unique user ID from Auth0
        email: req.auth.payload.email,
        name: req.auth.payload.name,
        nickname: req.auth.payload.nickname,
        picture: req.auth.payload.picture,
      };
      console.log(`✅ User attached: ${req.user.sub}`);
    } else {
      console.warn("⚠️ No auth payload found in request");
      req.user = null;
    }
    next();
  } catch (error) {
    console.error("Error attaching user:", error);
    res.status(500).json({ error: "Failed to attach user information" });
  }
};

module.exports = attachUser;
