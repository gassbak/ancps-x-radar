
const {
  getNotifications,
  markAsRead
} = require("../services/notification.service");

// ==========================================
// RÉCUPÉRER LES NOTIFICATIONS
// ==========================================
const getAll = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Utilisateur non identifié"
      });
    }

    const utilisateur = req.user._id;

    const notifications =
      await getNotifications(utilisateur);

    res.json(notifications);

  } catch (error) {
    console.error(
      "Erreur récupération notifications :",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

// ==========================================
// MARQUER UNE NOTIFICATION COMME LUE
// ==========================================
const read = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Utilisateur non identifié"
      });
    }

    const utilisateur = req.user._id;

    const notification =
      await markAsRead(
        req.params.id,
        utilisateur
      );

    if (!notification) {
      return res.status(404).json({
        message: "Notification introuvable"
      });
    }

    res.json(notification);

  } catch (error) {
    console.error(
      "Erreur lecture notification :",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getAll,
  read
};
