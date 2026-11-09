const Certification =
  require("../models/Certification");

const Reconnaissance =
  require("../models/Reconnaissance");

const normalizeModalite = (value) => {
  if (!value) {
    return value;
  }

  const text =
    value.toLowerCase();

  if (
    text === "présentiel" ||
    text === "presentiel"
  ) {
    return "presentiel";
  }

  if (text === "distance") {
    return "distance";
  }

  if (text === "hybride") {
    return "hybride";
  }

  return value;
};

const searchCertifications =
  async (filters) => {

    const query = {};

    if (filters.q) {
      query.$or = [
        {
          title: {
            $regex: filters.q,
            $options: "i"
          }
        },
        {
          sigle: {
            $regex: filters.q,
            $options: "i"
          }
        }
      ];
    }

    if (filters.niveauEntree) {
      query.niveauEntree =
        filters.niveauEntree;
    }

    if (filters.niveauSortie) {
      query.niveauSortie =
        filters.niveauSortie;
    }

    if (filters.duree) {
      query.duree = filters.duree;
    }

    if (filters.modalite) {
      query.modalite =
        normalizeModalite(
          filters.modalite
        );
    }

    if (filters.domaine) {
      query.domaine =
        filters.domaine;
    }

    if (filters.sousDomaine) {
      query.sousDomaine =
        filters.sousDomaine;
    }

    if (filters.organisme) {
      query.organisme =
        filters.organisme;
    }

    if (filters.etablissement) {
      query.etablissements =
        filters.etablissement;
    }

    if (filters.metier) {
      query.metiers =
        filters.metier;
    }

    if (filters.competence) {
      query.competences =
        filters.competence;
    }

    const results =
      await Certification.find(
        query
      )
        .populate("niveauEntree")
        .populate("niveauSortie")
        .populate("type")
        .populate("nature")
        .populate(
          "statutVerification"
        )
        .populate("domaine")
        .populate("sousDomaine")
        .populate("metiers")
        .populate("competences")
        .populate("organisme")
        .populate({
          path: "etablissements"
        });

    let filtered =
      results;

    if (
      filters.region ||
      filters.ville
    ) {
      filtered =
        filtered.filter(
          (certification) => {

            return certification
              .etablissements
              .some(
                (etablissement) => {

                  const regionOk =
                    !filters.region ||
                    new RegExp(
                      filters.region,
                      "i"
                    ).test(
                      etablissement.region
                    );

                  const villeOk =
                    !filters.ville ||
                    new RegExp(
                      filters.ville,
                      "i"
                    ).test(
                      etablissement.ville
                    );

                  return (
                    regionOk &&
                    villeOk
                  );
                }
              );
          }
        );
    }

    if (filters.statut) {

      const reconnaissances =
        await Reconnaissance.find({
          statut: {
            $regex: filters.statut,
            $options: "i"
          }
        });

      const ids =
        reconnaissances.map(
          (item) =>
            item.certification.toString()
        );

      filtered =
        filtered.filter(
          (certification) =>
            ids.includes(
              certification._id.toString()
            )
        );
    }

    return filtered;
  };

module.exports = {
  searchCertifications
};