const Source = require("../models/Source");

const createSource = async (req, res) => {
  try {
    const source = await Source.create(req.body);

    res.status(201).json(source);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getSources = async (req, res) => {
  try {
    const sources = await Source.find()
      .populate("certification");

    res.json(sources);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getSource = async (req, res) => {
  try {
    const source = await Source.findById(
      req.params.id
    ).populate("certification");

    if (!source) {
      return res.status(404).json({
        message: "Source introuvable"
      });
    }

    res.json(source);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateSource = async (req, res) => {
  try {
    const source =
      await Source.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(source);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteSource = async (req, res) => {
  try {
    await Source.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Source supprimée"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createSource,
  getSources,
  getSource,
  updateSource,
  deleteSource
};