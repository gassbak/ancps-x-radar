const AuditLog = require("../models/AuditLog");


// LISTE DES AUDITS
const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      entite,
      utilisateur,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Filtre par action
    if (action) {
      filter.action = action;
    }

    // Filtre par entité
    if (entite) {
      filter.entite = entite;
    }

    // Filtre par utilisateur
    if (utilisateur) {
      filter.utilisateur = utilisateur;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip =
      (pageNumber - 1) * limitNumber;

    const logs =
      await AuditLog.find(filter)
        .populate(
          "utilisateur",
          "name email role"
        )
        .sort({
          createdAt: -1
        })
        .skip(skip)
        .limit(limitNumber);

    const total =
      await AuditLog.countDocuments(filter);

    const totalPages =
      Math.ceil(total / limitNumber);

    res.json({
      data: logs,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error(
      "Erreur récupération audit :",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


// DÉTAIL D'UN AUDIT
const getAuditLog = async (req, res) => {
  try {
    const log =
      await AuditLog.findById(
        req.params.id
      ).populate(
        "utilisateur",
        "name email role"
      );

    if (!log) {
      return res.status(404).json({
        message: "Historique introuvable"
      });
    }

    res.json(log);

  } catch (error) {
    console.error(
      "Erreur détail audit :",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};


module.exports = {
  getAuditLogs,
  getAuditLog
};