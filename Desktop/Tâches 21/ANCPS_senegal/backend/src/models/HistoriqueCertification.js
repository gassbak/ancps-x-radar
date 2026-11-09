const mongoose =
  require("mongoose");

const historiqueSchema =
  new mongoose.Schema(
    {
      certification: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Certification",
        required: true
      },

      action: {
        type: String,
        required: true,
        enum: [
          "CREATION",
          "MODIFICATION",
          "PUBLICATION",
          "DEPUBLICATION",
          "RENOUVELLEMENT",
          "SUSPENSION",
          "EXPIRATION",
          "ARCHIVAGE"
        ]
      },

      ancienneValeur: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      nouvelleValeur: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      commentaire: {
        type: String,
        default: ""
      },

      utilisateur: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "HistoriqueCertification",
    historiqueSchema
  );