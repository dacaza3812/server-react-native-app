const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../../errors");
const ProductV1 = require("../../models/ProductV1");

const buildProductQuery = (req) => {
  const { store, isActive, isAvailable, search } = req.query;
  const query = {};
  
  if (store) query.store = store;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }
  
  return query;
};

const getProducts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = buildProductQuery(req);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [products, total] = await Promise.all([
    ProductV1.find(query)
      .populate("store", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    ProductV1.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getProductById = async (req, res) => {
  const product = await ProductV1.findById(req.params.id)
    .populate("store", "name");
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  res.status(StatusCodes.OK).json({ product });
};

const createProduct = async (req, res) => {
  const product = new ProductV1(req.body);
  await product.save();
  res.status(StatusCodes.CREATED).json({
    message: "Product created successfully",
    product
  });
};

const updateProduct = async (req, res) => {
  const product = await ProductV1.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Product updated successfully",
    product
  });
};

const deleteProduct = async (req, res) => {
  const product = await ProductV1.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Product deleted successfully"
  });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
