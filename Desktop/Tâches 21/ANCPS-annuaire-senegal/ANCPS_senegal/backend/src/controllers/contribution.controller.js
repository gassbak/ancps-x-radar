const Contribution =
  require("../models/Contribution");

const {
  createContribution,
  updateContributionStatus
} = require("../services/contribution.service");
const {
  createNotification
} = require(
  "../services/notification.service"
);
const {
  createAuditLog
} = require("../services/audit.service");

const create = async (req, res) => {
  try {
    const contribution =
      await createContribution(
        req.body,
        req.userId
      );

    await createAuditLog({
      utilisateur: req.userId,
      action: "CREATION",
      entite: "Contribution",
      entiteId: contribution._id,
      details: "Nouvelle contribution"
    });
    await createNotification(
  req.userId,
  "contribution",
  "Votre contribution a été créée"
);

    res.status(201).json(
      contribution
    );
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const getAll = async (req, res) => {
  try {
    const contributions =
      await Contribution.find()
        .populate(
          "auteur",
          "-password"
        )
        .populate(
          "verificateur",
          "-password"
        )
        .populate("certification");

    res.json(contributions);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getOne = async (req, res) => {
  try {
    const contribution =
      await Contribution.findById(
        req.params.id
      )
        .populate(
          "auteur",
          "-password"
        )
        .populate(
          "verificateur",
          "-password"
        )
        .populate("certification");

    if (!contribution) {
      return res.status(404).json({
        message: "Contribution introuvable"
      });
    }

    res.json(contribution);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const {
      statut,
      commentaire
    } = req.body;

    const contribution =
      await updateContributionStatus(
        req.params.id,
        statut,
        commentaire,
        req.userId
      );

    if (!contribution) {
      return res.status(404).json({
        message: "Contribution introuvable"
      });
      
    }
    await createNotification(
  contribution.auteur,
  "contribution",
  `Votre contribution a été ${statut}`
);

    await createAuditLog({
      utilisateur: req.userId,
      action: statut.toUpperCase(),
      entite: "Contribution",
      entiteId: contribution._id,
      details:
        commentaire ||
        "Changement de statut"
    });

    res.json(contribution);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  updateStatus
};