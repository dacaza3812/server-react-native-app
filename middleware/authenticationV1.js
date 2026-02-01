const jwt = require("jsonwebtoken");
const { UnauthenticatedError, NotFoundError } = require("../errors");
const UserV1 = require("../models/UserV1");

const authV1 = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { id: payload.id, phone: payload.phone };
    req.socket = req.io;

    const user = await UserV1.findById(payload.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};

module.exports = authV1;
