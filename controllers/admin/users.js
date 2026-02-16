const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");
const UserV1 = require("../../models/UserV1");

const buildUserQuery = (req) => {
  const { role, isActive, search } = req.query;
  const query = {};
  
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { phone: { $regex: search, $options: "i" } },
      { "profile.name": { $regex: search, $options: "i" } },
      { "profile.email": { $regex: search, $options: "i" } }
    ];
  }
  
  return query;
};

const getUsers = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = buildUserQuery(req);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [users, total] = await Promise.all([
    UserV1.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    UserV1.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getUserById = async (req, res) => {
  const user = await UserV1.findById(req.params.id).select("-password");
  if (!user) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({ user });
};

const createUser = async (req, res) => {
  const { phone, password, role, ...otherData } = req.body;
  
  if (!phone || !password || !role) {
    throw new BadRequestError("Phone, password and role are required");
  }

  const existingUser = await UserV1.findOne({ phone });
  if (existingUser) {
    throw new BadRequestError("Phone number already registered");
  }

  const user = new UserV1({
    phone,
    password,
    role,
    ...otherData
  });

  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(StatusCodes.CREATED).json({
    message: "User created successfully",
    user: userResponse
  });
};

const updateUser = async (req, res) => {
  const user = await UserV1.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({
    message: "User updated successfully",
    user
  });
};

const deleteUser = async (req, res) => {
  const user = await UserV1.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({
    message: "User deleted successfully"
  });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
