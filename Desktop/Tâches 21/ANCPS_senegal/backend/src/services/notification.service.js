
const Notification = require("../models/Notification");
const User = require("../models/User");

// CRÉER UNE NOTIFICATION
const createNotification = async ({
  utilisateur,
  type,
  message
}) => {
  try {
    // Vérification avant MongoDB
    if (!utilisateur) {
      throw new Error(
        "Utilisateur manquant pour la notification"
      );
    }

    if (!type) {
      throw new Error(
        "Type manquant pour la notification"
      );
    }

    if (!message) {
      throw new Error(
        "Message manquant pour la notification"
      );
    }

    const notification =
      await Notification.create({
        utilisateur,
        type,
        message
      });

    return notification;

  } catch (error) {
    console.error(
      "Erreur création notification :",
      error
    );

    throw error;
  }
};

// NOTIFIER PLUSIEURS UTILISATEURS
const createNotificationForUsers = async ({
  utilisateurs,
  type,
  message
}) => {
  try {
    if (
      !utilisateurs ||
      utilisateurs.length === 0
    ) {
      return [];
    }

    const notifications =
      utilisateurs.map((utilisateur) => ({
        utilisateur,
        type,
        message
      }));

    return await Notification.insertMany(
      notifications
    );

  } catch (error) {
    console.error(
      "Erreur création notifications utilisateurs :",
      error
    );

    throw error;
  }
};

// NOTIFIER TOUS LES UTILISATEURS
const notifyAllUsers = async ({
  type,
  message,
  excludeUserId = null
}) => {
  try {
    const filter = {};

    if (excludeUserId) {
      filter._id = {
        $ne: excludeUserId
      };
    }

    const users = await User.find(filter)
      .select("_id")
      .lean();

    const userIds = users.map(
      (user) => user._id
    );

    return await createNotificationForUsers({
      utilisateurs: userIds,
      type,
      message
    });

  } catch (error) {
    console.error(
      "Erreur notification tous les utilisateurs :",
      error
    );

    throw error;
  }
};

// RÉCUPÉRER LES NOTIFICATIONS
const getNotifications = async (
  utilisateur
) => {
  try {
    return await Notification.find({
      utilisateur
    })
      .sort({
        createdAt: -1
      })
      .lean();

  } catch (error) {
    console.error(
      "Erreur récupération notifications :",
      error
    );

    throw error;
  }
};

// MARQUER COMME LUE
const markAsRead = async (
  notificationId,
  utilisateur
) => {
  try {
    return await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        utilisateur
      },
      {
        lu: true
      },
      {
        new: true
      }
    );

  } catch (error) {
    console.error(
      "Erreur lecture notification :",
      error
    );

    throw error;
  }
};

module.exports = {
  createNotification,
  createNotificationForUsers,
  notifyAllUsers,
  getNotifications,
  markAsRead
};
