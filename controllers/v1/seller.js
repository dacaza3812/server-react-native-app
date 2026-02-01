const UserV1 = require("../../models/UserV1");
const Store = require("../../models/Store");
const { NotFoundError, BadRequestError } = require("../../errors");
const { StatusCodes } = require("http-status-codes");

const getSellerProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const seller = await UserV1.findById(userId);

    if (!seller) {
      throw new NotFoundError("Seller not found");
    }

    if (seller.role !== "store_owner") {
      throw new BadRequestError("User is not a seller");
    }

    res.status(StatusCodes.OK).json({
      message: "Seller profile retrieved successfully",
      seller: {
        id: seller._id,
        phone: seller.phone,
        profile: seller.profile,
        seller: seller.seller,
        stores: seller.stores,
      },
    });
  } catch (error) {
    console.error("Error retrieving seller profile:", error);
    throw error;
  }
};

const getSellerById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError("Seller ID is required");
  }

  try {
    const seller = await UserV1.findById(id);

    if (!seller) {
      throw new NotFoundError("Seller not found");
    }

    if (seller.role !== "store_owner") {
      throw new BadRequestError("User is not a seller");
    }

    const stores = await Store.find({ owner: id })
      .select("name description logo banner address isActive categories rating totalOrders");

    res.status(StatusCodes.OK).json({
      message: "Seller retrieved successfully",
      seller: {
        id: seller._id,
        profile: seller.profile,
        seller: seller.seller,
        stores,
      },
    });
  } catch (error) {
    console.error("Error retrieving seller:", error);
    throw error;
  }
};

const updateSellerProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, lastName, email, avatarUrl, businessName, taxId } = req.body;

  try {
    const seller = await UserV1.findById(userId);

    if (!seller) {
      throw new NotFoundError("Seller not found");
    }

    if (seller.role !== "store_owner") {
      throw new BadRequestError("User is not a seller");
    }

    if (name !== undefined) seller.profile.name = name;
    if (lastName !== undefined) seller.profile.lastName = lastName;
    if (email !== undefined) seller.profile.email = email;
    if (avatarUrl !== undefined) seller.profile.avatarUrl = avatarUrl;
    if (businessName !== undefined) seller.seller.businessName = businessName;
    if (taxId !== undefined) seller.seller.taxId = taxId;

    await seller.save();

    res.status(StatusCodes.OK).json({
      message: "Seller profile updated successfully",
      seller: {
        id: seller._id,
        profile: seller.profile,
        seller: seller.seller,
      },
    });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    throw new BadRequestError("Failed to update seller profile");
  }
};

const getSellerStores = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError("Seller ID is required");
  }

  try {
    const seller = await UserV1.findById(id);

    if (!seller) {
      throw new NotFoundError("Seller not found");
    }

    if (seller.role !== "store_owner") {
      throw new BadRequestError("User is not a seller");
    }

    const stores = await Store.find({ owner: id })
      .select("name description logo banner address isActive categories rating totalOrders deliveryFee minimumOrderAmount averageDeliveryTime")
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      message: "Seller stores retrieved successfully",
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Error retrieving seller stores:", error);
    throw new BadRequestError("Failed to retrieve seller stores");
  }
};

module.exports = {
  getSellerProfile,
  getSellerById,
  updateSellerProfile,
  getSellerStores,
};
