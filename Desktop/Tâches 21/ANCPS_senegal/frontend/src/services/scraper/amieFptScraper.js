
const axios = require("axios");
const cheerio = require("cheerio");
const crypto = require("crypto");

const Certification = require("../../models/Certification");

const BASE_URL =
  "https://amiefpt.sec.gouv.sn/front/programmes";

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const clean = (value) =>
  (value || "").replace(/\s+/g, " ").trim();

function hash(value) {
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase())
    .digest("hex");
}

function extractPrograms(html, page) {
  const $ = cheerio.load(html);
  const programs = [];

  // Les sélecteurs seront affinés si le HTML réel
  // du catalogue utilise une autre structure.
  const containers = $(
    ".card, .programme-card, .program-card, article"
  );

  containers.each((_, element) => {
    const card = $(element);
    const title = clean(
      card.find("h1, h2, h3, h4").first().text()
    );

    if (!title) return;

    const text = clean(card.text());

    const secteur =
      clean(text.match(/Secteur\s*:\s*([^:]+?)(?=Fili[eè]re|Dipl[oô]me|$)/i)?.[1]);

    const filiere =
      clean(text.match(/Fili[eè]re\s*:\s*([^:]+?)(?=Secteur|Dipl[oô]me|$)/i)?.[1]);

    const diplome =
      clean(text.match(/Dipl[oô]me\s*:\s*(.+)$/i)?.[1]);

    const key = hash(
      `${title}|${secteur}|${filiere}`
    );

    programs.push({
      title,
      secteur,
      filiere,
      diplome,
      key,
      page
    });
  });

  return [
    ...new Map(
      programs.map((item) => [item.key, item])
    ).values()
  ];
}

async function fetchPage(page) {
  const response = await axios.get(BASE_URL, {
    params: { page },
    timeout: 30000,
    headers: {
      "User-Agent": "ANCPS-CatalogueBot/1.0"
    }
  });

  return extractPrograms(response.data, page);
}

async function savePrograms(programs) {
  let inserted = 0;
  let updated = 0;

  for (const program of programs) {
    const now = new Date();

    const result = await Certification.updateOne(
      {
        "source.cle": program.key
      },
      {
        $set: {
          title: program.title,

          description: [
            program.diplome
              ? `Diplôme : ${program.diplome}`
              : null,
            program.secteur
              ? `Secteur : ${program.secteur}`
              : null,
            program.filiere
              ? `Filière : ${program.filiere}`
              : null
          ].filter(Boolean).join("\n"),

          secteurSource: program.secteur,
          filiereSource: program.filiere,

          source: {
            nom: "AMIE-FPT Sénégal",
            url: `${BASE_URL}?page=${program.page}`,
            cle: program.key
          },

          derniereVerification: now,
          statutCollecte: "a_verifier",
          published: false,
          archived: false
        }
      },
      {
        upsert: true,
        runValidators: true
      }
    );

    if (result.upsertedCount > 0) inserted++;
    else if (result.modifiedCount > 0) updated++;
  }

  return { inserted, updated };
}

async function startScraping() {
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFound = 0;

  console.log("Début collecte AMIE-FPT");

  // Pagination limitée pour respecter le serveur source.
  for (let page = 1; page <= 30; page++) {
    try {
      console.log(`Page ${page}`);

      const programs = await fetchPage(page);

      if (!programs.length) {
        console.log("Aucun programme sur cette page.");
        break;
      }

      const result = await savePrograms(programs);

      totalFound += programs.length;
      totalInserted += result.inserted;
      totalUpdated += result.updated;

      console.log(result);

      await delay(1200);

    } catch (error) {
      console.error(
        `Erreur page ${page}:`,
        error.message
      );

      break;
    }
  }

  return {
    source: "AMIE-FPT",
    totalFound,
    totalInserted,
    totalUpdated
  };
}

module.exports = { startScraping };
