const Reconnaissance =
  require("../models/Reconnaissance");

const createReconnaissance =
  async (data) => {
    return Reconnaissance.create(data);
  };

const getReconnaissances =
  async () => {
    return Reconnaissance.find()
      .populate("certification")
      .populate("organisme");
  };

const getReconnaissanceById =
  async (id) => {
    return Reconnaissance.findById(id)
      .populate("certification")
      .populate("organisme");
  };

const updateReconnaissance =
  async (id, data) => {
    return Reconnaissance
      .findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true
        }
      );
  };

const deleteReconnaissance =
  async (id) => {
    return Reconnaissance
      .findByIdAndDelete(id);
  };

module.exports = {
  createReconnaissance,
  getReconnaissances,
  getReconnaissanceById,
  updateReconnaissance,
  deleteReconnaissance
};