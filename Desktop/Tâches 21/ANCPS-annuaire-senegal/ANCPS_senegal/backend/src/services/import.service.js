const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");

const Certification =
  require("../models/Certification");

const Niveau =
  require("../models/Niveau");


const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {

    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", reject);
  });
};


const readExcel = (filePath) => {

  const workbook =
    XLSX.readFile(filePath);

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  return XLSX.utils.sheet_to_json(sheet);
};


const readFile = async (filePath) => {

  const extension =
    path.extname(filePath)
      .toLowerCase();

  if (extension === ".csv") {
    return readCSV(filePath);
  }

  if (
    extension === ".xlsx" ||
    extension === ".xls"
  ) {
    return readExcel(filePath);
  }

  throw new Error(
    "Format non supporté"
  );
};


const normaliserModalite = (
  modalite
) => {

  if (!modalite) {
    return undefined;
  }

  const valeur =
    modalite
      .toString()
      .toLowerCase()
      .trim();

  if (
    valeur === "présentiel" ||
    valeur === "presentiel"
  ) {
    return "presentiel";
  }

  if (valeur === "distance") {
    return "distance";
  }

  if (valeur === "hybride") {
    return "hybride";
  }

  return null;
};


const trouverNiveau = async (
  nom
) => {

  if (!nom) {
    return null;
  }

  return Niveau.findOne({
    nom: {
      $regex:
        `^${nom.trim()}$`,
      $options: "i"
    }
  });
};


const validateData = async (
  data
) => {

  const valid = [];
  const errors = [];

  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    const row = data[i];

    if (!row.title) {

      errors.push({
        ligne: i + 2,
        erreur:
          "title obligatoire"
      });

      continue;
    }

    const existing =
      await Certification.findOne({
        title: {
          $regex:
            `^${row.title.trim()}$`,
          $options: "i"
        }
      });

    if (existing) {

      errors.push({
        ligne: i + 2,
        erreur:
          "Certification déjà existante",
        title: row.title
      });

      continue;
    }

    const modalite =
      normaliserModalite(
        row.modalite
      );

    if (
      row.modalite &&
      !modalite
    ) {

      errors.push({
        ligne: i + 2,
        erreur:
          "Modalité invalide",
        modalite:
          row.modalite
      });

      continue;
    }

    let niveauSortie = null;

    if (
      row.niveauSortie
    ) {

      niveauSortie =
        await trouverNiveau(
          row.niveauSortie
        );

      if (!niveauSortie) {

        errors.push({
          ligne: i + 2,
          erreur:
            "Niveau de sortie introuvable",
          niveau:
            row.niveauSortie
        });

        continue;
      }
    }

    /*
      Ancien fichier CSV :
      niveau

      Nouveau modèle :
      niveauSortie

      On garde donc
      niveau comme ancien format.
    */

    if (
      !niveauSortie &&
      row.niveau
    ) {

      niveauSortie =
        await trouverNiveau(
          row.niveau
        );

      if (!niveauSortie) {

        errors.push({
          ligne: i + 2,
          erreur:
            "Niveau introuvable",
          niveau:
            row.niveau
        });

        continue;
      }
    }

    valid.push({

      title:
        row.title.trim(),

      sigle:
        row.sigle || undefined,

      description:
        row.description ||
        undefined,

      niveauSortie:
        niveauSortie
          ? niveauSortie._id
          : undefined,

      duree:
        row.duree || undefined,

      modalite:
        modalite
    });
  }

  return {
    valid,
    errors
  };
};


const importCertifications =
  async (data) => {

    if (data.length === 0) {
      return [];
    }

    return Certification.insertMany(
      data
    );
  };


module.exports = {
  readFile,
  validateData,
  importCertifications
};