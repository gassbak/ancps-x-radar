const Niveau =
  require("../models/Niveau");

const getAll = async (req, res) => {
  const niveaux =
    await Niveau.find();

  res.json(niveaux);
};

const create = async (req, res) => {
  try {
    const niveau =
      await Niveau.create(req.body);

    res.status(201).json(niveau);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const update = async (req, res) => {
  try {
    const niveau =
      await Niveau.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    res.json(niveau);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const remove = async (req, res) => {
  await Niveau.findByIdAndDelete(
    req.params.id
  );

  res.json({
    message: "Niveau supprimé"
  });
};

module.exports = {
  getAll,
  create,
  update,
  remove
};