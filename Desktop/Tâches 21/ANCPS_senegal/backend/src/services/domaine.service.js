const Domaine =
  require("../models/Domaine");

const createDomaine =
  async (data) => {
    return Domaine.create(data);
  };

const getDomaines =
  async () => {
    return Domaine.find();
  };

const getDomaineById =
  async (id) => {
    return Domaine.findById(id);
  };

const updateDomaine =
  async (id, data) => {
    return Domaine.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    );
  };

const deleteDomaine =
  async (id) => {
    return Domaine.findByIdAndDelete(id);
  };

module.exports = {
  createDomaine,
  getDomaines,
  getDomaineById,
  updateDomaine,
  deleteDomaine
};