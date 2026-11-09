const Metier =
  require("../models/Metier");

const createMetier =
  async (data) => {
    return Metier.create(data);
  };

const getMetiers =
  async () => {
    return Metier.find()
      .populate("domaine")
      .populate("competences");
  };

const getMetierById =
  async (id) => {
    return Metier.findById(id)
      .populate("domaine")
      .populate("competences");
  };

const updateMetier =
  async (id, data) => {
    return Metier.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    );
  };

const deleteMetier =
  async (id) => {
    return Metier.findByIdAndDelete(id);
  };

module.exports = {
  createMetier,
  getMetiers,
  getMetierById,
  updateMetier,
  deleteMetier
};