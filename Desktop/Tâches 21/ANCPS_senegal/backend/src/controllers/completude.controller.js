const Certification =
  require("../models/Certification");

const calculerCompletude =
  async (req, res) => {
    try {
      const certification =
        await Certification.findById(
          req.params.certificationId
        );

      if (!certification) {
        return res.status(404).json({
          message:
            "Certification introuvable"
        });
      }

      const champs = [
        "title",
        "sigle",
        "code",
        "description",
        "objectifs",
        "publicCible",
        "conditionsAcces",
        "niveauEntree",
        "niveauSortie",
        "type",
        "nature",
        "statutVerification",
        "duree",
        "volumeHoraire",
        "modalite",
        "domaine",
        "sousDomaine",
        "organisme"
      ];

      let complets = 0;

      for (const champ of champs) {
        const valeur =
          certification[champ];

        if (
          valeur !== undefined &&
          valeur !== null &&
          valeur !== ""
        ) {
          complets++;
        }
      }

      const total = champs.length;

      const score = Math.round(
        (complets / total) * 100
      );

      res.json({
        certification:
          certification._id,
        score,
        champsComplets:
          complets,
        champsTotal:
          total
      });

    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };

module.exports = {
  calculerCompletude
};