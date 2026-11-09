const express = require("express");
const Setting = require("../models/Setting");

const router = express.Router();

const allowedSections = [
  "general",
  "security",
  "notifications",
  "maintenance",
];

const allowedFields = {
  general: [
    "platformName",
    "description",
    "email",
    "phone",
    "address",
    "website",
  ],
  security: ["roles", "accessPolicy"],
  notifications: [
    "newRequest",
    "validation",
    "modification",
    "emailEnabled",
    "notificationEmail",
  ],
  maintenance: [
    "backupFrequency",
    "auditLog",
    "maintenanceNotes",
  ],
};

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: "platform" });

    if (!settings) {
      settings = await Setting.create({ key: "platform" });
    }

    res.json(settings);
  } catch (error) {
    console.error("Erreur lecture paramètres :", error.message);
    res.status(500).json({
      message: "Impossible de récupérer les paramètres.",
    });
  }
});

// PUT /api/settings
router.put("/", async (req, res) => {
  try {
    const updates = {};

    for (const section of allowedSections) {
      const values = req.body?.[section];

      if (values === undefined) continue;

      if (
        !values ||
        typeof values !== "object" ||
        Array.isArray(values)
      ) {
        return res.status(400).json({
          message: `La section ${section} est invalide.`,
        });
      }

      for (const [field, value] of Object.entries(values)) {
        if (!allowedFields[section].includes(field)) {
          return res.status(400).json({
            message: `Champ non autorisé : ${section}.${field}`,
          });
        }

        if (section === "security" && field === "roles") {
          if (
            !Array.isArray(value) ||
            !value.every((role) => typeof role === "string")
          ) {
            return res.status(400).json({
              message: "Les rôles doivent être une liste de textes.",
            });
          }
        } else if (
          ["newRequest", "validation", "modification",
            "emailEnabled", "auditLog"].includes(field)
        ) {
          if (typeof value !== "boolean") {
            return res.status(400).json({
              message: `${field} doit être un booléen.`,
            });
          }
        } else if (typeof value !== "string") {
          return res.status(400).json({
            message: `${field} doit être un texte.`,
          });
        }

        updates[`${section}.${field}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Aucun paramètre valide à enregistrer.",
      });
    }

    const settings = await Setting.findOneAndUpdate(
      { key: "platform" },
      {
        $set: updates,
        $setOnInsert: { key: "platform" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      message: "Paramètres enregistrés avec succès.",
      settings,
    });
  } catch (error) {
    console.error("Erreur sauvegarde paramètres :", error.message);
    res.status(500).json({
      message: "Impossible d'enregistrer les paramètres.",
    });
  }
});

module.exports = router;