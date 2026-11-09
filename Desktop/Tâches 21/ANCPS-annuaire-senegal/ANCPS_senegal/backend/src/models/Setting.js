const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "platform",
      unique: true,
      required: true,
    },

    general: {
      platformName: {
        type: String,
        default: "Plateforme de certification",
      },
      description: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    security: {
      roles: {
        type: [String],
        default: [
          "Administrateur éditorial",
          "Vérificateur",
          "Établissement",
        ],
      },
      accessPolicy: { type: String, default: "" },
    },

    notifications: {
      newRequest: { type: Boolean, default: true },
      validation: { type: Boolean, default: true },
      modification: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
      notificationEmail: { type: String, default: "" },
    },

    maintenance: {
      backupFrequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      auditLog: { type: Boolean, default: true },
      maintenanceNotes: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);