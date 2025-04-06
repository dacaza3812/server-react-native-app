const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  link: {
    type: String,
  },
  targetCity: [{
    type: String,
    required: true,
  }],
}, {
  timestamps: true,
});

const Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;
