const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../../errors");
const Delivery = require("../../models/Delivery");

const buildDeliveryQuery = (req) => {
  const { status, store, customer, captain } = req.query;
  const query = {};
  
  if (status) query.status = status;
  if (store) query.store = store;
  if (customer) query.customer = customer;
  if (captain) query.captain = captain;
  
  return query;
};

const getDeliveries = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = buildDeliveryQuery(req);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [deliveries, total] = await Promise.all([
    Delivery.find(query)
      .populate("store customer captain", "name profile phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Delivery.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    deliveries,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getDeliveryById = async (req, res) => {
  const delivery = await Delivery.findById(req.params.id)
    .populate("store customer captain", "name profile phone");
  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }
  res.status(StatusCodes.OK).json({ delivery });
};

const createDelivery = async (req, res) => {
  const delivery = new Delivery(req.body);
  delivery.generateTrackingCode();
  delivery.generateOTP();
  await delivery.save();
  res.status(StatusCodes.CREATED).json({
    message: "Delivery created successfully",
    delivery
  });
};

const updateDelivery = async (req, res) => {
  const delivery = await Delivery.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Delivery updated successfully",
    delivery
  });
};

const deleteDelivery = async (req, res) => {
  const delivery = await Delivery.findByIdAndDelete(req.params.id);
  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Delivery deleted successfully"
  });
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
};
