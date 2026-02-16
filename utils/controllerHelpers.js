/**
 * Controller utilities for common CRUD operations
 */
const { StatusCodes } = require("http-status-codes");

/**
 * Build pagination parameters from query
 */
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Build pagination response object
 */
const buildPaginationResponse = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit)
});

/**
 * Standard success response
 */
const successResponse = (res, message, data, statusCode = StatusCodes.OK) => {
  return res.status(statusCode).json({
    message,
    ...data
  });
};

/**
 * Handle common MongoDB errors
 */
const handleDBError = (error, customMessage = "Operation failed") => {
  console.error(error);
  
  if (error.name === 'CastError') {
    return { status: StatusCodes.NOT_FOUND, message: "Resource not found" };
  }
  if (error.name === 'ValidationError') {
    return { status: StatusCodes.BAD_REQUEST, message: error.message };
  }
  if (error.code === 11000) {
    return { status: StatusCodes.BAD_REQUEST, message: "Duplicate entry" };
  }
  
  return { status: StatusCodes.INTERNAL_SERVER_ERROR, message: customMessage };
};

/**
 * Check if user owns resource
 */
const checkOwnership = (resourceOwnerId, userId, userRole, allowedRoles = []) => {
  if (resourceOwnerId.toString() === userId) return true;
  if (allowedRoles.includes(userRole)) return true;
  return false;
};

/**
 * Validate required fields
 */
const validateRequired = (body, fields) => {
  const missing = fields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }
  
  return { valid: true };
};

module.exports = {
  getPaginationParams,
  buildPaginationResponse,
  successResponse,
  handleDBError,
  checkOwnership,
  validateRequired,
};
