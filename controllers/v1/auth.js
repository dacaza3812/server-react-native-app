const UserV1 = require("../../models/UserV1");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError, NotFoundError } = require("../../errors");
const jwt = require("jsonwebtoken");

const auth = async (req, res) => {
  const {
    phone,
    role,
    firebasePushToken,
    forceSwitch = false,
    name,
    lastName,
    email,
    avatarUrl,
    dateOfBirth,
    gender,
    dni,
    vehicle,
  } = req.body;

  if (!phone) {
    throw new BadRequestError("Phone number is required");
  }

  if (!role || !["customer", "captain", "store_owner"].includes(role)) {
    throw new BadRequestError("Valid role is required (customer, captain, or store_owner)");
  }

  try {
    if (firebasePushToken) {
      const userWithToken = await UserV1.findOne({
        firebasePushToken,
        phone: { $ne: phone },
      });
      if (userWithToken) {
        await UserV1.findByIdAndUpdate(
          userWithToken._id,
          { firebasePushToken: "" },
          { runValidators: false }
        );
      }
    }

    let user = await UserV1.findOne({ phone });

    if (user) {
      if (user.role !== role) {
        if (forceSwitch) {
          user.role = role;
          await user.save();
        } else {
          throw new BadRequestError(
            "Usuario ya existe con diferente rol. Use forceSwitch=true para confirmar."
          );
        }
      }

      const profileFields = { name, lastName, email, avatarUrl, dateOfBirth, gender, dni };
      Object.keys(profileFields).forEach((key) => {
        if (profileFields[key] !== undefined) {
          user.profile[key] = profileFields[key];
        }
      });

      // Update vehicle if provided
      if (vehicle) {
        if (vehicle.type !== undefined) user.vehicle.type = vehicle.type;
        if (vehicle.licensePlate !== undefined) user.vehicle.licensePlate = vehicle.licensePlate;
        if (vehicle.color !== undefined) user.vehicle.color = vehicle.color;
        if (vehicle.model !== undefined) user.vehicle.model = vehicle.model;
      }

      if (firebasePushToken && firebasePushToken !== user.firebasePushToken) {
        user.firebasePushToken = firebasePushToken;
      }

      await user.save();

      const accessToken = user.createAccessToken();
      const refreshToken = user.createRefreshToken();

      return res.status(StatusCodes.OK).json({
        message: "User logged in successfully",
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    user = new UserV1({
      phone,
      role,
      firebasePushToken,
      profile: {
        name,
        lastName,
        email,
        avatarUrl,
        dateOfBirth,
        gender,
        dni,
      },
      vehicle: vehicle || {},
    });

    await user.save();

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await UserV1.findById(payload.id);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, lastName, email, avatarUrl, dateOfBirth, gender } = req.body;

  try {
    const user = await UserV1.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (name !== undefined) user.profile.name = name;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (email !== undefined) user.profile.email = email;
    if (avatarUrl !== undefined) user.profile.avatarUrl = avatarUrl;
    if (dateOfBirth !== undefined) user.profile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.profile.gender = gender;

    await user.save();

    res.status(StatusCodes.OK).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    throw new BadRequestError("Failed to update profile");
  }
};

const updateCaptainProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, lastName, email, avatarUrl, dni, vehicle } = req.body;

  try {
    const user = await UserV1.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role !== "captain") {
      throw new BadRequestError("User is not a captain");
    }

    if (name !== undefined) user.profile.name = name;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (email !== undefined) user.profile.email = email;
    if (avatarUrl !== undefined) user.profile.avatarUrl = avatarUrl;
    if (dni !== undefined) user.profile.dni = dni;

    if (vehicle) {
      if (vehicle.type !== undefined) user.vehicle.type = vehicle.type;
      if (vehicle.licensePlate !== undefined) user.vehicle.licensePlate = vehicle.licensePlate;
      if (vehicle.color !== undefined) user.vehicle.color = vehicle.color;
      if (vehicle.model !== undefined) user.vehicle.model = vehicle.model;
    }

    await user.save();

    res.status(StatusCodes.OK).json({
      message: "Captain profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update captain profile error:", error);
    throw new BadRequestError("Failed to update captain profile");
  }
};

module.exports = {
  auth,
  refreshToken,
  updateProfile,
  updateCaptainProfile,
};
