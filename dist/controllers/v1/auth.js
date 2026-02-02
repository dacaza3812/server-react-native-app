"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateCaptainProfile = exports.updateProfile = exports.refreshToken = exports.login = exports.register = void 0;
const http_status_codes_1 = require("http-status-codes");
const UserV1_1 = __importDefault(require("../../models/UserV1"));
const errors_1 = require("../../errors");
const validateRegistrationFields = (role, body) => {
    const { phone, password, name, lastName, dni, vehicle, businessName, taxId } = body;
    if (!phone || !password || !role || !name || !lastName) {
        return { valid: false, message: "Teléfono, contraseña, nombre y apellido son requeridos" };
    }
    if (password.length < 6) {
        return { valid: false, message: "La contraseña debe tener al menos 6 caracteres" };
    }
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
const register = async (req, res) => {
    const body = req.body;
    const { phone, password, role, firebasePushToken, name, lastName, email, avatarUrl, dateOfBirth, gender, dni, vehicle, businessName, taxId, } = body;
    const validation = validateRegistrationFields(role, body);
    if (!validation.valid) {
        throw new errors_1.BadRequestError(validation.message || "Validación fallida");
    }
    const existingUser = await UserV1_1.default.findOne({ phone });
    if (existingUser) {
        throw new errors_1.BadRequestError("Este número de teléfono ya está registrado");
    }
    try {
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
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                dni: role === "captain" ? dni : undefined,
            },
        };
        if (role === "captain" && vehicle) {
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
        const user = new UserV1_1.default(userData);
        await user.save();
        const accessToken = user.createAccessToken();
        const refreshToken = user.createRefreshToken();
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "Usuario registrado exitosamente",
            user: userResponse,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }
    catch (error) {
        console.error("Register error:", error);
        throw error;
    }
};
exports.register = register;
const login = async (req, res) => {
    const { phone, password, role, firebasePushToken } = req.body;
    if (!phone || !password || !role) {
        throw new errors_1.BadRequestError("Teléfono, contraseña y rol son requeridos");
    }
    try {
        const user = await UserV1_1.default.findOne({ phone });
        if (!user) {
            throw new errors_1.UnauthenticatedError("Credenciales inválidas");
        }
        if (!user.isActive) {
            throw new errors_1.UnauthenticatedError("Cuenta desactivada");
        }
        if (user.role !== role) {
            throw new errors_1.BadRequestError(`Este número está registrado como ${user.role}, no como ${role}`);
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthenticatedError("Credenciales inválidas");
        }
        if (firebasePushToken && firebasePushToken !== user.firebasePushToken) {
            user.firebasePushToken = firebasePushToken;
            await user.save();
        }
        const accessToken = user.createAccessToken();
        const refreshToken = user.createRefreshToken();
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Login exitoso",
            user: userResponse,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        throw new errors_1.BadRequestError("Refresh token is required");
    }
    try {
        const jwt = require("jsonwebtoken");
        const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        const user = await UserV1_1.default.findById(payload.id);
        if (!user) {
            throw new errors_1.UnauthenticatedError("Invalid refresh token");
        }
        const newAccessToken = user.createAccessToken();
        const newRefreshToken = user.createRefreshToken();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        throw new errors_1.UnauthenticatedError("Invalid refresh token");
    }
};
exports.refreshToken = refreshToken;
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, lastName, email, avatarUrl, dateOfBirth, gender } = req.body;
    try {
        const user = await UserV1_1.default.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        if (name !== undefined)
            user.profile.name = name;
        if (lastName !== undefined)
            user.profile.lastName = lastName;
        if (email !== undefined)
            user.profile.email = email;
        if (avatarUrl !== undefined)
            user.profile.avatarUrl = avatarUrl;
        if (dateOfBirth !== undefined)
            user.profile.dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined)
            user.profile.gender = gender;
        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Profile updated successfully",
            user: userResponse,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        throw new errors_1.BadRequestError("Failed to update profile");
    }
};
exports.updateProfile = updateProfile;
const updateCaptainProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, lastName, email, avatarUrl, dni, vehicle } = req.body;
    try {
        const user = await UserV1_1.default.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        if (user.role !== "captain") {
            throw new errors_1.BadRequestError("User is not a captain");
        }
        if (name !== undefined)
            user.profile.name = name;
        if (lastName !== undefined)
            user.profile.lastName = lastName;
        if (email !== undefined)
            user.profile.email = email;
        if (avatarUrl !== undefined)
            user.profile.avatarUrl = avatarUrl;
        if (dni !== undefined)
            user.profile.dni = dni;
        if (vehicle) {
            if (vehicle.type !== undefined)
                user.vehicle.type = vehicle.type;
            if (vehicle.licensePlate !== undefined)
                user.vehicle.licensePlate = vehicle.licensePlate;
            if (vehicle.color !== undefined)
                user.vehicle.color = vehicle.color;
            if (vehicle.model !== undefined)
                user.vehicle.model = vehicle.model;
        }
        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Captain profile updated successfully",
            user: userResponse,
        });
    }
    catch (error) {
        console.error("Update captain profile error:", error);
        throw new errors_1.BadRequestError("Failed to update captain profile");
    }
};
exports.updateCaptainProfile = updateCaptainProfile;
const changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new errors_1.BadRequestError("Contraseña actual y nueva son requeridas");
    }
    if (newPassword.length < 6) {
        throw new errors_1.BadRequestError("La nueva contraseña debe tener al menos 6 caracteres");
    }
    try {
        const user = await UserV1_1.default.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new errors_1.BadRequestError("Contraseña actual incorrecta");
        }
        user.password = newPassword;
        await user.save();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Contraseña actualizada exitosamente",
        });
    }
    catch (error) {
        console.error("Change password error:", error);
        throw new errors_1.BadRequestError("Failed to change password");
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.js.map