const Reconnaissance =
  require("../models/Reconnaissance");

const createReconnaissance = async (req, res) => {
  try {
    const reconnaissance =
      await Reconnaissance.create(req.body);

    res.status(201).json(reconnaissance);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const getReconnaissances = async (req, res) => {
  try {
    const reconnaissances =
      await Reconnaissance.find()
        .populate("certification");

    res.json(reconnaissances);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getReconnaissance = async (req, res) => {
  try {
    const reconnaissance =
      await Reconnaissance.findById(req.params.id)
        .populate("certification");

    if (!reconnaissance) {
      return res.status(404).json({
        message: "Reconnaissance introuvable"
      });
    }

    res.json(reconnaissance);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateReconnaissance = async (req, res) => {
  try {
    const reconnaissance =
      await Reconnaissance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!reconnaissance) {
      return res.status(404).json({
        message: "Reconnaissance introuvable"
      });
    }

    res.json(reconnaissance);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const deleteReconnaissance = async (req, res) => {
  try {
    const reconnaissance =
      await Reconnaissance.findByIdAndDelete(
        req.params.id
      );

    if (!reconnaissance) {
      return res.status(404).json({
        message: "Reconnaissance introuvable"
      });
    }

    res.json({
      message: "Reconnaissance supprimée"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createReconnaissance,
  getReconnaissances,
  getReconnaissance,
  updateReconnaissance,
  deleteReconnaissance
};