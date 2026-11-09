const Historique =
  require(
    "../models/HistoriqueCertification"
  );


const enregistrerHistorique =
  async (data) => {

    return Historique.create(
      data
    );

  };


const getHistorique =
  async (certificationId) => {

    return Historique.find({

      certification:
        certificationId

    })

      .populate(
        "utilisateur",
        "nom email role"
      )

      .sort({
        createdAt: -1
      });

  };


module.exports = {

  enregistrerHistorique,

  getHistorique

};