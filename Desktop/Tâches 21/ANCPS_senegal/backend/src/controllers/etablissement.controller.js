const Etablissement =
  require("../models/Etablissement");

const createEtablissement = async (req, res) => {
  try {
    const etablissement =
      await Etablissement.create(req.body);

    res.status(201).json(etablissement);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getEtablissements = async (req, res) => {
  try {
    const etablissements =
      await Etablissement.find();

    res.json(etablissements);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getEtablissement = async (req, res) => {
  try {
    const etablissement =
      await Etablissement.findById(
        req.params.id
      );

    if (!etablissement) {
      return res.status(404).json({
        message: "Établissement introuvable"
      });
    }

    res.json(etablissement);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateEtablissement = async (req, res) => {
  try {
    const etablissement =
      await Etablissement.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(etablissement);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteEtablissement = async (req, res) => {
  try {
    await Etablissement.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Établissement supprimé"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createEtablissement,
  getEtablissements,
  getEtablissement,
  updateEtablissement,
  deleteEtablissement
};