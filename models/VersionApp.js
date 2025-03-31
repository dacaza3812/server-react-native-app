const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const versionSchema = new Schema({
    version: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
  })


const Ride = mongoose.model("Version", versionSchema);
module.exports = Ride;