const NatureCertification =
  require("../models/NatureCertification");

const getAll = async (req, res) => {
  const natures =
    await NatureCertification.find();

  res.json(natures);
};

const create = async (req, res) => {
  try {
    const nature =
      await NatureCertification.create(
        req.body
      );

    res.status(201).json(nature);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const update = async (req, res) => {
  const nature =
    await NatureCertification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

  res.json(nature);
};

const remove = async (req, res) => {
  await NatureCertification.findByIdAndDelete(
    req.params.id
  );

  res.json({
    message: "Nature supprimée"
  });
};

module.exports = {
  getAll,
  create,
  update,
  remove
};