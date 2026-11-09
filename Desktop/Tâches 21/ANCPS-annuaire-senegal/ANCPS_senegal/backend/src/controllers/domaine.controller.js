const Domaine = require("../models/Domaine");

const createDomaine = async (req, res) => {
  try {
    const domaine = await Domaine.create(req.body);

    res.status(201).json({
      message: "Domaine créé",
      domaine
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getDomaines = async (req, res) => {
  try {
    const domaines = await Domaine.find();

    res.json(domaines);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getDomaine = async (req, res) => {
  try {
    const domaine = await Domaine.findById(
      req.params.id
    );

    if (!domaine) {
      return res.status(404).json({
        message: "Domaine introuvable"
      });
    }

    res.json(domaine);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const updateDomaine = async (req, res) => {
  try {
    const domaine =
      await Domaine.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!domaine) {
      return res.status(404).json({
        message: "Domaine introuvable"
      });
    }

    res.json({
      message: "Domaine modifié",
      domaine
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const deleteDomaine = async (req, res) => {
  try {
    const domaine =
      await Domaine.findByIdAndDelete(
        req.params.id
      );

    if (!domaine) {
      return res.status(404).json({
        message: "Domaine introuvable"
      });
    }

    res.json({
      message: "Domaine supprimé"
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


module.exports = {
  createDomaine,
  getDomaines,
  getDomaine,
  updateDomaine,
  deleteDomaine
};