const Competence = require("../models/Competence");

const createCompetence = async (req, res) => {
  try {
    const competence =
      await Competence.create(req.body);

    res.status(201).json({
      message: "Compétence créée",
      competence
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getCompetences = async (req, res) => {
  try {
    const competences =
      await Competence.find()
        .populate("domaine");

    res.json(competences);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const getCompetence = async (req, res) => {
  try {
    const competence =
      await Competence.findById(
        req.params.id
      ).populate("domaine");

    if (!competence) {
      return res.status(404).json({
        message: "Compétence introuvable"
      });
    }

    res.json(competence);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const updateCompetence = async (req, res) => {
  try {
    const competence =
      await Competence.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!competence) {
      return res.status(404).json({
        message: "Compétence introuvable"
      });
    }

    res.json({
      message: "Compétence modifiée",
      competence
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


const deleteCompetence = async (req, res) => {
  try {
    const competence =
      await Competence.findByIdAndDelete(
        req.params.id
      );

    if (!competence) {
      return res.status(404).json({
        message: "Compétence introuvable"
      });
    }

    res.json({
      message: "Compétence supprimée"
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


module.exports = {
  createCompetence,
  getCompetences,
  getCompetence,
  updateCompetence,
  deleteCompetence
};