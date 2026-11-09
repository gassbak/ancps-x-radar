const mongoose = require("mongoose");

const etablissementSchema = new mongoose.Schema(
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

    region: {
      type: String
    },

    ville: {
      type: String
    },

    adresse: {
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
  "Etablissement",
  etablissementSchema
);