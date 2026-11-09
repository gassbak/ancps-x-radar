const mongoose = require("mongoose");

const reconnaissanceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true
    },

    statut: {
      type: String,
      required: true,
      trim: true
    },

    autorite: {
      type: String,
      required: true,
      trim: true
    },

    reference: {
      type: String
    },

    dateDebut: {
      type: Date
    },

    dateFin: {
      type: Date
    },

    preuve: {
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
  "Reconnaissance",
  reconnaissanceSchema
);