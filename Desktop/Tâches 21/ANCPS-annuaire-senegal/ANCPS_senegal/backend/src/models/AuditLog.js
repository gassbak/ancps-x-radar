const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true,
      trim: true
    },

    entite: {
      type: String,
      required: true,
      trim: true
    },

    entiteId: {
      type: mongoose.Schema.Types.ObjectId
    },

    details: {
      type: String,
      trim: true
    },

    ancienneValeur: {
      type: mongoose.Schema.Types.Mixed
    },

    nouvelleValeur: {
      type: mongoose.Schema.Types.Mixed
    },

    ip: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
); 