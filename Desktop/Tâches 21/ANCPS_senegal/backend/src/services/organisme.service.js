const Organisme =
  require("../models/Organisme");

const createOrganisme =
  async (data) => {
    return Organisme.create(data);
  };

const getOrganismes =
  async () => {
    return Organisme.find();
  };

const getOrganismeById =
  async (id) => {
    return Organisme.findById(id);
  };

const updateOrganisme =
  async (id, data) => {
    return Organisme.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    );
  };

const deleteOrganisme =
  async (id) => {
    return Organisme.findByIdAndDelete(id);
  };

module.exports = {
  createOrganisme,
  getOrganismes,
  getOrganismeById,
  updateOrganisme,
  deleteOrganisme
};