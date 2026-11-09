const Organisme = require("../models/Organisme");

const createOrganisme = async (req, res) => {
  try {
    const organisme = await Organisme.create(req.body);

    res.status(201).json(organisme);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getOrganismes = async (req, res) => {
  try {
    const organismes = await Organisme.find();

    res.json(organismes);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getOrganisme = async (req, res) => {
  try {
    const organisme =
      await Organisme.findById(req.params.id);

    if (!organisme) {
      return res.status(404).json({
        message: "Organisme introuvable"
      });
    }

    res.json(organisme);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateOrganisme = async (req, res) => {
  try {
    const organisme =
      await Organisme.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(organisme);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteOrganisme = async (req, res) => {
  try {
    await Organisme.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Organisme supprimé"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createOrganisme,
  getOrganismes,
  getOrganisme,
  updateOrganisme,
  deleteOrganisme
};