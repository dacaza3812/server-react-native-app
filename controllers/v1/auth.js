const UserV1 = require("../../models/UserV1");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError, NotFoundError } = require("../../errors");
const jwt = require("jsonwebtoken");

// Validar campos según el rol
const validateRegistrationFields = (role, body) => {
  const { phone, password, name, lastName, dni, vehicle, businessName, taxId } = body;
  
  // Campos base requeridos para todos
  if (!phone || !password || !role || !name || !lastName) {
    return { valid: false, message: "Teléfono, contraseña, nombre y apellido son requeridos" };
  }
  
  // Validar longitud de contraseña
  if (password.length < 6) {
    return { valid: false, message: "La contraseña debe tener al menos 6 caracteres" };
  }
  
  // Validar según rol
  if (role === "captain") {
    if (!dni) {
      return { valid: false, message: "El DNI es requerido para choferes" };
    }
    if (!vehicle || !vehicle.type || !vehicle.licensePlate) {
      return { valid: false, message: "Tipo de vehículo y placa son requeridos para choferes" };
    }
  }
  
  if (role === "store_owner") {
    if (!businessName || !taxId) {
      return { valid: false, message: "Nombre del negocio y RUC/tax ID son requeridos para tiendas" };
    }
  }
  
  return { valid: true };
};

// REGISTRO - Solo crea usuarios nuevos
const register = async (req, res) => {
  const {
    phone,
    password,
    role,
    firebasePushToken,
    name,
    lastName,
    email,
    avatarUrl,
    dateOfBirth,
    gender,
    dni,
    vehicle,
    businessName,
    taxId,
  } = req.body;

  // Validar campos según rol
  const validation = validateRegistrationFields(role, req.body);
  if (!validation.valid) {
    throw new BadRequestError(validation.message);
  }

  // Verificar si el teléfono ya existe
  const existingUser = await UserV1.findOne({ phone });
  if (existingUser) {
    throw new BadRequestError("Este número de teléfono ya está registrado");
  }

  try {
    // Crear nuevo usuario
    const userData = {
      phone,
      password,
      role,
      firebasePushToken,
      profile: {
        name,
        lastName,
        email,
        avatarUrl,
        dateOfBirth,
        gender,
        dni: role === "captain" ? dni : undefined,
      },
    };

    // Agregar campos específicos por rol
    if (role === "captain") {
      userData.vehicle = {
        type: vehicle.type,
        licensePlate: vehicle.licensePlate,
        color: vehicle.color,
        model: vehicle.model,
      };
    }

    if (role === "store_owner") {
      userData.seller = {
        businessName,
        taxId,
      };
    }

    const user = new UserV1(userData);
    await user.save();

    // Generar tokens
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    // No devolver la contraseña
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.CREATED).json({
      message: "Usuario registrado exitosamente",
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

// LOGIN - Solo autentica usuarios existentes
const login = async (req, res) => {
  const { phone, password, role, firebasePushToken } = req.body;

  if (!phone || !password || !role) {
    throw new BadRequestError("Teléfono, contraseña y rol son requeridos");
  }

  try {
    // Buscar usuario
    const user = await UserV1.findOne({ phone });
    if (!user) {
      throw new UnauthenticatedError("Credenciales inválidas");
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new UnauthenticatedError("Cuenta desactivada");
    }

    // Verificar rol
    if (user.role !== role) {
      throw new BadRequestError(`Este número está registrado como ${user.role}, no como ${role}`);
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthenticatedError("Credenciales inválidas");
    }

    // Actualizar firebasePushToken si cambió
    if (firebasePushToken && firebasePushToken !== user.firebasePushToken) {
      user.firebasePushToken = firebasePushToken;
      await user.save();
    }

    // Generar tokens
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    // No devolver la contraseña
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.OK).json({
      message: "Login exitoso",
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
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

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.OK).json({
      message: "Profile updated successfully",
      user: userResponse,
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

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(StatusCodes.OK).json({
      message: "Captain profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update captain profile error:", error);
    throw new BadRequestError("Failed to update captain profile");
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError("Contraseña actual y nueva son requeridas");
  }

  if (newPassword.length < 6) {
    throw new BadRequestError("La nueva contraseña debe tener al menos 6 caracteres");
  }

  try {
    const user = await UserV1.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestError("Contraseña actual incorrecta");
    }

    // Actualizar contraseña (se hashea automáticamente en el pre-save)
    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Change password error:", error);
    throw new BadRequestError("Failed to change password");
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  updateProfile,
  updateCaptainProfile,
  changePassword,
};
