const Document = require("../models/Document");

const createDocument = async (req, res) => {
  try {
    const document =
      await Document.create(req.body);

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents =
      await Document.find()
        .populate("certification");

    res.json(documents);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getDocument = async (req, res) => {
  try {
    const document =
      await Document.findById(
        req.params.id
      ).populate("certification");

    if (!document) {
      return res.status(404).json({
        message: "Document introuvable"
      });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const document =
      await Document.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(document);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await Document.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Document supprimé"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument
};