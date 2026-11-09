const Certification =
  require(
    "../models/Certification"
  );

const createCertification =
  async (data) => {
    return Certification.create(
      data
    );
  };

const getAllCertifications =
  async () => {
    return Certification.find()
      .populate(
        "niveauEntree"
      )
      .populate(
        "niveauSortie"
      )
      .populate("domaine")
      .populate("organisme");
  };

const getCertificationById =
  async (id) => {
    return Certification.findById(
      id
    )
      .populate(
        "niveauEntree"
      )
      .populate(
        "niveauSortie"
      )
      .populate("domaine")
      .populate("organisme");
  };

const updateCertification =
  async (id, data) => {
    return Certification
      .findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true
        }
      );
  };

const deleteCertification =
  async (id) => {
    return Certification
      .findByIdAndDelete(id);
  };

module.exports = {
  createCertification,
  getAllCertifications,
  getCertificationById,
  updateCertification,
  deleteCertification
};