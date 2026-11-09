const mongoose = require("mongoose");

const sousDomaineSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String
    },

    domaine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domaine",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "SousDomaine",
  sousDomaineSchema
);