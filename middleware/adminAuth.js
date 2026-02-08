const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const adminAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Verificar que sea un token de admin
    if (payload.role !== "admin") {
      throw new UnauthenticatedError("Not authorized as admin");
    }

    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthenticatedError("Invalid token");
  }
};

module.exports = adminAuthMiddleware;
