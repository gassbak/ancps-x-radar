const mongoose = require("mongoose");

const competenceSchema = new mongoose.Schema(
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Competence",
  competenceSchema
);