const mongoose = require("mongoose");

const organismeSchema = new mongoose.Schema(
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

    description: {
      type: String
    },

    pays: {
      type: String
    },

    siteWeb: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Organisme",
  organismeSchema
);