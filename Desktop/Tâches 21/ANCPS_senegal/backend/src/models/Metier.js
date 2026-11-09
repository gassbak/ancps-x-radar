const mongoose = require("mongoose");

const metierSchema = new mongoose.Schema(
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
      ref: "Domaine"
    },

    sousDomaine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SousDomaine"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Metier",
  metierSchema
);