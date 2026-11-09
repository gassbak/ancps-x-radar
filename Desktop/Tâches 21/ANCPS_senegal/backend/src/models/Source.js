const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    nom: {
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

    reference: {
      type: String
    },

    datePublication: {
      type: Date
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
  "Source",
  sourceSchema
);