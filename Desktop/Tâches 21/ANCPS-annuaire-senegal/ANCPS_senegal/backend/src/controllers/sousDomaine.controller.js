const SousDomaine = require("../models/SousDomaine");

const createSousDomaine = async (req, res) => {
  try {
    const sousDomaine =
      await SousDomaine.create(req.body);

    res.status(201).json({
      message: "Sous-domaine créé",
      sousDomaine
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getSousDomaines = async (req, res) => {
  try {
    const sousDomaines =
      await SousDomaine.find()
        .populate("domaine");

    res.json(sousDomaines);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getSousDomaine = async (req, res) => {
  try {
    const sousDomaine =
      await SousDomaine.findById(
        req.params.id
      ).populate("domaine");

    if (!sousDomaine) {
      return res.status(404).json({
        message: "Sous-domaine introuvable"
      });
    }

    res.json(sousDomaine);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const updateSousDomaine = async (req, res) => {
  try {
    const sousDomaine =
      await SousDomaine.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!sousDomaine) {
      return res.status(404).json({
        message: "Sous-domaine introuvable"
      });
    }

    res.json({
      message: "Sous-domaine modifié",
      sousDomaine
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const deleteSousDomaine = async (req, res) => {
  try {
    const sousDomaine =
      await SousDomaine.findByIdAndDelete(
        req.params.id
      );

    if (!sousDomaine) {
      return res.status(404).json({
        message: "Sous-domaine introuvable"
      });
    }

    res.json({
      message: "Sous-domaine supprimé"
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


module.exports = {
  createSousDomaine,
  getSousDomaines,
  getSousDomaine,
  updateSousDomaine,
  deleteSousDomaine
};