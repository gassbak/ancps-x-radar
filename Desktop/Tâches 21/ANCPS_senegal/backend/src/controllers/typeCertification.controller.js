const TypeCertification =
  require("../models/TypeCertification");

const getAll = async (req, res) => {
  const types =
    await TypeCertification.find();

  res.json(types);
};

const create = async (req, res) => {
  try {
    const type =
      await TypeCertification.create(
        req.body
      );

    res.status(201).json(type);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const update = async (req, res) => {
  const type =
    await TypeCertification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

  res.json(type);
};

const remove = async (req, res) => {
  await TypeCertification.findByIdAndDelete(
    req.params.id
  );

  res.json({
    message: "Type supprimé"
  });
};

module.exports = {
  getAll,
  create,
  update,
  remove
};