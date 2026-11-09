const mongoose = require("mongoose");

const certificationSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true
      },

      sigle: {
        type: String,
        trim: true
      },

      code: {
        type: String,
        trim: true
      },

      description: {
        type: String
      },

      objectifs: {
        type: String
      },

      publicCible: {
        type: String
      },

      conditionsAcces: {
        type: String
      },

      niveauEntree: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Niveau"
      },

      niveauSortie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Niveau"
      },

      type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TypeCertification"
      },

      nature: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NatureCertification"
      },

      statutVerification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StatutVerification"
      },

      duree: {
        type: String
      },

      volumeHoraire: {
        type: String
      },

      modalite: {
        type: String,
        enum: [
          "presentiel",
          "distance",
          "hybride"
        ]
      },

      domaine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Domaine"
      },

      sousDomaine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SousDomaine"
      },

      metiers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Metier"
        }
      ],

      competences: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Competence"
        }
      ],

      organisme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organisme"
      },

      etablissements: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Etablissement"
        }
      ],

      published: { type: Boolean, default: false },
      archived: { type: Boolean, default: false },
      competencesLibres: [{ type: String }]
    },
    

    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "Certification",
    certificationSchema
  );