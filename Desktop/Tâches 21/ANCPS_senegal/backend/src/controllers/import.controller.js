const fs = require("fs");

const {
  readFile,
  validateData,
  importCertifications
} = require("../services/import.service");

const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Fichier obligatoire"
      });
    }

    const data =
      await readFile(req.file.path);

    const result =
      await validateData(data);

    fs.unlinkSync(req.file.path);

    res.json({
      total: data.length,
      valides: result.valid.length,
      erreurs: result.errors.length,
      apercu: result.valid.slice(0, 5),
      erreursDetails: result.errors
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

const importData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Fichier obligatoire"
      });
    }

    const data =
      await readFile(req.file.path);

    const result =
      await validateData(data);

    const imported =
      await importCertifications(
        result.valid
      );

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: "Import terminé",
      total: data.length,
      importees: imported.length,
      erreurs: result.errors.length,
      erreursDetails: result.errors
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

module.exports = {
  previewImport,
  importData
};