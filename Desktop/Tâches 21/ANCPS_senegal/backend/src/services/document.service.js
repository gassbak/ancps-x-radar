const Document =
  require("../models/Document");

const createDocument =
  async (data) => {
    return Document.create(data);
  };

const getDocuments =
  async () => {
    return Document.find()
      .populate("source")
      .populate("certification");
  };

const getDocumentById =
  async (id) => {
    return Document.findById(id)
      .populate("source")
      .populate("certification");
  };

const updateDocument =
  async (id, data) => {
    return Document.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    );
  };

const deleteDocument =
  async (id) => {
    return Document.findByIdAndDelete(id);
  };

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
};