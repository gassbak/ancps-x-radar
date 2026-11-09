const Contribution =
  require("../models/Contribution");

const createContribution = async (
  data,
  userId
) => {

  return Contribution.create({
    ...data,
    auteur: userId
  });
};

const updateContributionStatus =
  async (
    id,
    statut,
    commentaire,
    userId
  ) => {

    return Contribution.findByIdAndUpdate(
      id,
      {
        statut,
        commentaire,
        verificateur: userId
      },
      { new: true }
    );
  };

module.exports = {
  createContribution,
  updateContributionStatus
};