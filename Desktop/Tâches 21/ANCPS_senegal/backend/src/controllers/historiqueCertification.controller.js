const HistoriqueCertification =
  require(
    "../models/HistoriqueCertification"
  );

const getHistorique =
  async (req, res) => {
    try {
      const historique =
        await HistoriqueCertification
          .find({
            certification:
              req.params.certificationId
          })
          .populate(
            "utilisateur",
            "name email role"
          )
          .sort({
            createdAt: -1
          });

      res.json({
        certification:
          req.params.certificationId,

        total:
          historique.length,

        historique
      });

    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };

const createHistorique =
  async (req, res) => {
    try {
      const {
        action,
        ancienneValeur,
        nouvelleValeur,
        commentaire
      } = req.body;

      const historique =
        await HistoriqueCertification
          .create({
            certification:
              req.params.certificationId,

            action,

            ancienneValeur,

            nouvelleValeur,

            commentaire,

            utilisateur:
              req.userId
          });

      res.status(201).json(
        historique
      );

    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  };

module.exports = {
  getHistorique,
  createHistorique
};