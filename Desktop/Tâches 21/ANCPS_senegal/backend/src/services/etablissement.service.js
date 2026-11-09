const Etablissement =
  require("../models/Etablissement");

const createEtablissement =
  async (data) => {
    return Etablissement.create(data);
  };

const getEtablissements =
  async () => {
    return Etablissement.find()
      .populate("organisme");
  };

const getEtablissementById =
  async (id) => {
    return Etablissement.findById(id)
      .populate("organisme");
  };

const updateEtablissement =
  async (id, data) => {
    return Etablissement
      .findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true
        }
      );
  };

const deleteEtablissement =
  async (id) => {
    return Etablissement
      .findByIdAndDelete(id);
  };

module.exports = {
  createEtablissement,
  getEtablissements,
  getEtablissementById,
  updateEtablissement,
  deleteEtablissement
};