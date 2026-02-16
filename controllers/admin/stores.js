const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../../errors");
const Store = require("../../models/Store");
const ProductV1 = require("../../models/ProductV1");

const buildStoreQuery = (req) => {
  const { isActive, category, search } = req.query;
  const query = {};
  
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (category) query.categories = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }
  
  return query;
};

const getStores = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = buildStoreQuery(req);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [stores, total] = await Promise.all([
    Store.find(query)
      .populate("owner", "profile phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Store.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    stores,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getStoreById = async (req, res) => {
  const store = await Store.findById(req.params.id)
    .populate("owner", "profile phone");
  if (!store) {
    throw new NotFoundError("Store not found");
  }
  res.status(StatusCodes.OK).json({ store });
};

const createStore = async (req, res) => {
  const store = new Store(req.body);
  await store.save();
  res.status(StatusCodes.CREATED).json({
    message: "Store created successfully",
    store
  });
};

const updateStore = async (req, res) => {
  const store = await Store.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!store) {
    throw new NotFoundError("Store not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Store updated successfully",
    store
  });
};

const deleteStore = async (req, res) => {
  const store = await Store.findByIdAndDelete(req.params.id);
  if (!store) {
    throw new NotFoundError("Store not found");
  }
  await ProductV1.deleteMany({ store: req.params.id });
  res.status(StatusCodes.OK).json({
    message: "Store and associated products deleted successfully"
  });
};

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
};
