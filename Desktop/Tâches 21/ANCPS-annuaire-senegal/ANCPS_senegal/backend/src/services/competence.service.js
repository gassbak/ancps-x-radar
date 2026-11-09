const Competence =
  require(
    "../models/Competence"
  );

const createCompetence =
  async (data) => {
    return Competence.create(
      data
    );
  };

const getCompetences =
  async () => {
    return Competence.find()
      .populate("domaine")
      .populate(
        "sousDomaine"
      );
  };

const getCompetenceById =
  async (id) => {
    return Competence.findById(
      id
    )
      .populate("domaine")
      .populate(
        "sousDomaine"
      );
  };

const updateCompetence =
  async (id, data) => {
    return Competence
      .findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true
        }
      );
  };

const deleteCompetence =
  async (id) => {
    return Competence
      .findByIdAndDelete(id);
  };

module.exports = {
  createCompetence,
  getCompetences,
  getCompetenceById,
  updateCompetence,
  deleteCompetence
};