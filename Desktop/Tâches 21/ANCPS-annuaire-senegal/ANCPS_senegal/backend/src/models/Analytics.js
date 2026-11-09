
const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "search",
        "visit",
        "view",
        "no_result"
      ]
    },

    query: {
      type: String,
      default: ""
    },

    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certification",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Analytics",
  analyticsSchema
);
