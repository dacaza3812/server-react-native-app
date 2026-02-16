const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../../errors");
const RideV1 = require("../../models/RideV1");

const buildRideQuery = (req) => {
  const { status, customer, captain } = req.query;
  const query = {};
  
  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (captain) query.captain = captain;
  
  return query;
};

const getRides = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = buildRideQuery(req);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [rides, total] = await Promise.all([
    RideV1.find(query)
      .populate("customer captain", "profile phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    RideV1.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    rides,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getRideById = async (req, res) => {
  const ride = await RideV1.findById(req.params.id)
    .populate("customer captain", "profile phone");
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }
  res.status(StatusCodes.OK).json({ ride });
};

const createRide = async (req, res) => {
  const ride = new RideV1(req.body);
  await ride.save();
  res.status(StatusCodes.CREATED).json({
    message: "Ride created successfully",
    ride
  });
};

const updateRide = async (req, res) => {
  const ride = await RideV1.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Ride updated successfully",
    ride
  });
};

const deleteRide = async (req, res) => {
  const ride = await RideV1.findByIdAndDelete(req.params.id);
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Ride deleted successfully"
  });
};

module.exports = {
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
};
