const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      trim: true
    },

    url: {
      type: String
    },

    description: {
      type: String
    },

    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certification",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Document",
  documentSchema
);