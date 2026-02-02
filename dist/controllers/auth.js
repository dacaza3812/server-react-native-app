const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const jwt = require("jsonwebtoken");
const auth = async (req, res) => {
    const { phone, role, firebasePushToken, forceSwitch = false } = req.body;
    if (!phone) {
        throw new BadRequestError("Phone number is required");
    }
    if (!role || !["customer", "captain"].includes(role)) {
        throw new BadRequestError("Valid role is required (customer or captain)");
    }
    try {
        if (firebasePushToken) {
            const userWithToken = await User.findOne({
                firebasePushToken,
                phone: { $ne: phone },
            });
            if (userWithToken) {
                await User.findByIdAndUpdate(userWithToken._id, { firebasePushToken: "" }, { runValidators: false });
            }
        }
        let user = await User.findOne({ phone });
        if (user) {
            if (user.role !== role) {
                if (forceSwitch) {
                    user.role = role;
                    await user.save();
                }
                else {
                    throw new BadRequestError("Usted no puede ser chofer y cliente con el mismo número. " +
                        "Reenvíe la petición con forceSwitch=true para confirmar cambio de perfil.");
                }
            }
            if (firebasePushToken && firebasePushToken !== user.firebasePushToken) {
                user.firebasePushToken = firebasePushToken;
                await user.save();
            }
            const accessToken = user.createAccessToken();
            const refreshToken = user.createRefreshToken();
            return res.status(StatusCodes.OK).json({
                message: "User logged in successfully",
                user,
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        }
        user = new User({ phone, role, firebasePushToken });
        await user.save();
        const accessToken = user.createAccessToken();
        const refreshToken = user.createRefreshToken();
        res.status(StatusCodes.CREATED).json({
            message: "User created successfully",
            user,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }
    catch (error) {
        console.error(error);
        throw error;
    }
};
const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        throw new BadRequestError("Refresh token is required");
    }
    try {
        const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(payload.id);
        if (!user) {
            throw new UnauthenticatedError("Invalid refresh token");
        }
        const newAccessToken = user.createAccessToken();
        const newRefreshToken = user.createRefreshToken();
        res.status(StatusCodes.OK).json({
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        });
    }
    catch (error) {
        console.error(error);
        throw new UnauthenticatedError("Invalid refresh token");
    }
};
module.exports = {
    auth,
    refreshToken,
};
//# sourceMappingURL=auth.js.map