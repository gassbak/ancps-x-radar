const Source =
  require("../models/Source");

const createSource =
  async (data) => {
    return Source.create(data);
  };

const getSources =
  async () => {
    return Source.find();
  };

const getSourceById =
  async (id) => {
    return Source.findById(id);
  };

const updateSource =
  async (id, data) => {
    return Source.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    );
  };

const deleteSource =
  async (id) => {
    return Source.findByIdAndDelete(id);
  };

module.exports = {
  createSource,
  getSources,
  getSourceById,
  updateSource,
  deleteSource
};