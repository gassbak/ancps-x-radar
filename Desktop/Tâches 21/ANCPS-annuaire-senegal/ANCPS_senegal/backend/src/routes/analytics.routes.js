
const express = require("express");

const {
  createAnalytics,
  getAnalytics
} = require("../controllers/analytics.controller");

const router = express.Router();

// Enregistrer une action
router.post(
  "/",
  createAnalytics
);

// Récupérer les statistiques
router.get(
  "/",
  getAnalytics
);

module.exports = router;
