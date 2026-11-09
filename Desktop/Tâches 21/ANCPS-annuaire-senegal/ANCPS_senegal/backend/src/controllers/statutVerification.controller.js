const StatutVerification =
  require("../models/StatutVerification");

const getAll = async (req, res) => {
  const statuts =
    await StatutVerification.find();

  res.json(statuts);
};

const create = async (req, res) => {
  try {
    const statut =
      await StatutVerification.create(
        req.body
      );

    res.status(201).json(statut);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const update = async (req, res) => {
  const statut =
    await StatutVerification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

  res.json(statut);
};

const remove = async (req, res) => {
  await StatutVerification.findByIdAndDelete(
    req.params.id
  );

  res.json({
    message: "Statut supprimé"
  });
};

module.exports = {
  getAll,
  create,
  update,
  remove
};