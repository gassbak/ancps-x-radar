const Analytics = require("../models/Analytics");

// ENREGISTRER UNE ACTION
const createAnalytics = async (req, res) => {
  try {
    const {
      type,
      query,
      certification
    } = req.body;

    // Vérifier le type
    if (!type) {
      return res.status(400).json({
        message: "Le type est obligatoire"
      });
    }

    // Types autorisés
    const allowedTypes = [
      "search",
      "visit",
      "view",
      "no_result"
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Type Analytics invalide"
      });
    }

    // Créer l'événement Analytics
    const analytics = await Analytics.create({
      type,
      query: query || "",
      certification: certification || null
    });

    return res.status(201).json({
      message: "Analytics enregistré",
      analytics
    });
  } catch (error) {
    console.error(
      "Erreur création analytics :",
      error
    );

    return res.status(500).json({
      message: error.message
    });
  }
};

// RÉCUPÉRER LES STATISTIQUES
const getAnalytics = async (req, res) => {
  try {
    const [
      searches,
      visits,
      views,
      noResults
    ] = await Promise.all([
      Analytics.countDocuments({
        type: "search"
      }),

      Analytics.countDocuments({
        type: "visit"
      }),

      Analytics.countDocuments({
        type: "view"
      }),

      Analytics.countDocuments({
        type: "no_result"
      })
    ]);

    return res.json({
      searches,
      visits,
      views,
      noResults
    });
  } catch (error) {
    console.error(
      "Erreur récupération analytics :",
      error
    );

    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createAnalytics,
  getAnalytics
};