const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../../errors");
const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    throw new BadRequestError("Invalid credentials");
  }

  const token = jwt.sign(
    { 
      id: "admin",
      email: ADMIN_EMAIL,
      role: "admin"
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "24h" }
  );

  res.status(StatusCodes.OK).json({
    message: "Admin login successful",
    token,
    user: {
      email: ADMIN_EMAIL,
      role: "admin"
    }
  });
};

module.exports = {
  adminLogin,
};
