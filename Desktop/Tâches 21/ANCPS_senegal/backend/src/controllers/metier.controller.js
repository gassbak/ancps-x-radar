const Metier = require("../models/Metier");

const createMetier = async (req, res) => {
  try {
    const metier = await Metier.create(req.body);

    res.status(201).json({
      message: "Métier créé",
      metier
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getMetiers = async (req, res) => {
  try {
    const metiers = await Metier.find()
      .populate("domaine")
      .populate("sousDomaine");

    res.json(metiers);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getMetier = async (req, res) => {
  try {
    const metier = await Metier.findById(
      req.params.id
    )
      .populate("domaine")
      .populate("sousDomaine");

    if (!metier) {
      return res.status(404).json({
        message: "Métier introuvable"
      });
    }

    res.json(metier);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const updateMetier = async (req, res) => {
  try {
    const metier =
      await Metier.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!metier) {
      return res.status(404).json({
        message: "Métier introuvable"
      });
    }

    res.json({
      message: "Métier modifié",
      metier
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const deleteMetier = async (req, res) => {
  try {
    const metier =
      await Metier.findByIdAndDelete(
        req.params.id
      );

    if (!metier) {
      return res.status(404).json({
        message: "Métier introuvable"
      });
    }

    res.json({
      message: "Métier supprimé"
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


module.exports = {
  createMetier,
  getMetiers,
  getMetier,
  updateMetier,
  deleteMetier
};