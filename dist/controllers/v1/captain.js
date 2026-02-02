const UserV1 = require("../../models/UserV1");
const Ride = require("../../models/Ride");
const Delivery = require("../../models/Delivery");
const { NotFoundError, BadRequestError } = require("../../errors");
const { StatusCodes } = require("http-status-codes");
const getCaptainProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const captain = await UserV1.findById(userId);
        if (!captain) {
            throw new NotFoundError("Captain not found");
        }
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        res.status(StatusCodes.OK).json({
            message: "Captain profile retrieved successfully",
            captain: {
                id: captain._id,
                phone: captain.phone,
                profile: captain.profile,
                vehicle: captain.vehicle,
                captain: captain.captain,
                rating: captain.rating,
                statistics: captain.statistics,
                isVerified: captain.isVerified,
            },
        });
    }
    catch (error) {
        console.error("Error retrieving captain profile:", error);
        throw error;
    }
};
const getCaptainById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Captain ID is required");
    }
    try {
        const captain = await UserV1.findById(id);
        if (!captain) {
            throw new NotFoundError("Captain not found");
        }
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        res.status(StatusCodes.OK).json({
            message: "Captain retrieved successfully",
            captain: {
                id: captain._id,
                profile: captain.profile,
                vehicle: captain.vehicle,
                captain: captain.captain,
                rating: captain.rating,
                statistics: captain.statistics,
                isVerified: captain.isVerified,
            },
        });
    }
    catch (error) {
        console.error("Error retrieving captain:", error);
        throw error;
    }
};
const getCaptainRatings = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Captain ID is required");
    }
    try {
        const captain = await UserV1.findById(id);
        if (!captain) {
            throw new NotFoundError("Captain not found");
        }
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        const completedRides = await Ride.find({
            captain: id,
            status: "COMPLETED",
        }).select("rating fare createdAt");
        const completedDeliveries = await Delivery.find({
            captain: id,
            status: "DELIVERED",
        }).select("rating review pricing.total createdAt");
        const allRatings = [
            ...completedRides.map(ride => ({
                type: "ride",
                rating: ride.rating,
                createdAt: ride.createdAt,
            })),
            ...completedDeliveries.map(delivery => ({
                type: "delivery",
                rating: delivery.rating,
                review: delivery.review,
                createdAt: delivery.createdAt,
            })),
        ].sort((a, b) => b.createdAt - a.createdAt);
        res.status(StatusCodes.OK).json({
            message: "Captain ratings retrieved successfully",
            captain: {
                id: captain._id,
                profile: captain.profile,
                averageRating: captain.rating.average,
                totalRatings: captain.rating.total,
            },
            ratings: allRatings,
        });
    }
    catch (error) {
        console.error("Error retrieving captain ratings:", error);
        throw error;
    }
};
const updateCaptainProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, lastName, email, avatarUrl, dni } = req.body;
    try {
        const captain = await UserV1.findById(userId);
        if (!captain) {
            throw new NotFoundError("Captain not found");
        }
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        if (name !== undefined)
            captain.profile.name = name;
        if (lastName !== undefined)
            captain.profile.lastName = lastName;
        if (email !== undefined)
            captain.profile.email = email;
        if (avatarUrl !== undefined)
            captain.profile.avatarUrl = avatarUrl;
        if (dni !== undefined)
            captain.profile.dni = dni;
        await captain.save();
        res.status(StatusCodes.OK).json({
            message: "Captain profile updated successfully",
            captain: {
                id: captain._id,
                profile: captain.profile,
            },
        });
    }
    catch (error) {
        console.error("Error updating captain profile:", error);
        throw new BadRequestError("Failed to update captain profile");
    }
};
const updateCaptainPricing = async (req, res) => {
    const userId = req.user.id;
    const { pricePerKm } = req.body;
    if (!pricePerKm) {
        throw new BadRequestError("pricePerKm is required");
    }
    try {
        const captain = await UserV1.findById(userId);
        if (!captain) {
            throw new NotFoundError("Captain not found");
        }
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        if (pricePerKm.bike !== undefined) {
            if (pricePerKm.bike < 0) {
                throw new BadRequestError("bike price per km must be positive");
            }
            captain.captain.pricePerKm.bike = pricePerKm.bike;
        }
        if (pricePerKm.auto !== undefined) {
            if (pricePerKm.auto < 0) {
                throw new BadRequestError("auto price per km must be positive");
            }
            captain.captain.pricePerKm.auto = pricePerKm.auto;
        }
        if (pricePerKm.car !== undefined) {
            if (pricePerKm.car < 0) {
                throw new BadRequestError("car price per km must be positive");
            }
            captain.captain.pricePerKm.car = pricePerKm.car;
        }
        await captain.save();
        res.status(StatusCodes.OK).json({
            message: "Captain pricing updated successfully",
            captain: {
                id: captain._id,
                pricePerKm: captain.captain.pricePerKm,
            },
        });
    }
    catch (error) {
        console.error("Error updating captain pricing:", error);
        throw error;
    }
};
const rateCaptain = async (req, res) => {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    if (!id) {
        throw new BadRequestError("Captain ID is required");
    }
    if (!rating || rating < 1 || rating > 5) {
        throw new BadRequestError("Rating must be between 1 and 5");
    }
    try {
        const captain = await UserV1.findById(id);
        if (!captain) {
            throw new NotFoundError("Captain not found");
        }
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        const totalRatings = captain.rating.total + 1;
        const totalScore = captain.rating.average * captain.rating.total + rating;
        const newAverage = totalScore / totalRatings;
        captain.rating.average = newAverage;
        captain.rating.total = totalRatings;
        await captain.save();
        res.status(StatusCodes.OK).json({
            message: "Captain rated successfully",
            captain: {
                id: captain._id,
                profile: captain.profile,
                rating: captain.rating,
            },
        });
    }
    catch (error) {
        console.error("Error rating captain:", error);
        throw error;
    }
};
module.exports = {
    getCaptainProfile,
    getCaptainById,
    getCaptainRatings,
    updateCaptainProfile,
    updateCaptainPricing,
    rateCaptain,
};
//# sourceMappingURL=captain.js.map