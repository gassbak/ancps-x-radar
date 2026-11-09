const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true
    },

    contenu: {
      type: String,
      required: true
    },

    statut: {
      type: String,
      enum: [
        "a_verifier",
        "complement",
        "acceptee",
        "rejetee",
        "publiee"
      ],
      default: "a_verifier"
    },

    commentaire: {
      type: String
    },

    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certification"
    },

    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    verificateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Contribution",
  contributionSchema
);