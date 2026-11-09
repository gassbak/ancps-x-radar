const axios = require("axios");
const cheerio = require("cheerio");

const Certification = require("../models/Certification");
const Source = require("../models/Source");

const MAX_IMPORT_BATCH = 100;
const SOURCE_DEFINITIONS = {
  "force-n": {
    nom: "FORCE-N",
    urls: [
      "https://force-n.sn/index.php/en/node/149",
      "https://force-n.sn/formations"
    ]
  },
  cdp: {
    nom: "Commission de Protection des Données",
    urls: ["https://www.cdp.sn/publications/public"]
  },
  "senegal-commerce": {
    nom: "Portail d'informations commerciales du Sénégal",
    urls: ["https://senegalcommerce.sec.gouv.sn/"]
  },
  "vie-publique": {
    nom: "Vie Publique Sénégal",
    urls: ["https://www.vie-publique.sn/annuaire-sites-publics-senegal"]
  }
};

const allowedHosts = new Set(
  Object.values(SOURCE_DEFINITIONS)
    .flatMap((source) => source.urls)
    .map((url) => new URL(url).hostname)
);

const cleanText = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const normalizeTitle = (value) =>
  cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAllowedSourceUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
};

const makeCandidate = (title, source, sourceUrl, description) => {
  const cleanedTitle = cleanText(title);
  if (!cleanedTitle || cleanedTitle.length > 300) {
    return null;
  }

  return {
    title: cleanedTitle,
    description: cleanText(description).slice(0, 5000) || undefined,
    sourceName: source.nom,
    sourceUrl
  };
};

const splitCertificationTitles = (value) => {
  const entries = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") {
      depth += 1;
    } else if (value[index] === ")") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && (value[index] === "," || value[index] === ";")) {
      entries.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  entries.push(value.slice(start).trim());

  return entries.flatMap((entry) => {
    const parts = entry.split(/\)\s+et\s+/);
    return parts.map((part, index) =>
      index < parts.length - 1 ? `${part})`.trim() : part.trim()
    );
  }).filter(Boolean);
};

const collectStructuredCandidates = ($, source, pageUrl) => {
  const candidates = [];

  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const types = Array.isArray(value["@type"])
      ? value["@type"]
      : [value["@type"]];
    const isEducationRecord = types.some((type) =>
      /^(course|certification|educationaloccupationalprogram)$/i.test(type || "")
    );

    if (isEducationRecord) {
      const sourceUrl = value.url
        ? new URL(value.url, pageUrl).toString()
        : pageUrl;
      const candidate = makeCandidate(
        value.name || value.title,
        source,
        sourceUrl,
        value.description
      );
      if (candidate) {
        candidates.push(candidate);
      }
    }

    if (value["@graph"]) {
      visit(value["@graph"]);
    }
  };

  $("script[type='application/ld+json']").each((_, element) => {
    try {
      visit(JSON.parse($(element).contents().text()));
    } catch {
      // Ignore malformed structured data and continue with other page content.
    }
  });

  return candidates;
};

const collectForceNCandidates = ($, source, pageUrl) => {
  const candidates = [];
  const familyPattern = /^(ing[eé]nierie logicielle|intelligence artificielle et donn[eé]es|e-business et comp[eé]tences num[eé]riques essentielles|technologies [eé]mergentes et cybers[eé]curit[eé]|cr[eé]ation de contenus audiovisuels et anim[eé]s|acculturation au num[eé]rique)\s*:\s*(.+)$/i;

  $("li").each((_, element) => {
    const text = cleanText($(element).text());
    const match = text.match(familyPattern);
    if (!match) {
      return;
    }

    splitCertificationTitles(match[2])
      .map((title) => title.replace(/[.]$/, "").trim())
      .filter(Boolean)
      .forEach((title) => {
        const candidate = makeCandidate(title, source, pageUrl);
        if (candidate) {
          candidates.push(candidate);
        }
      });
  });

  return candidates;
};

const collectDirectorySites = ($, pageUrl) => {
  const sites = new Map();

  $("a[href]").each((_, element) => {
    const label = cleanText($(element).text());
    try {
      const url = new URL($(element).attr("href"), pageUrl);
      if (
        !/^https?:$/.test(url.protocol) ||
        !url.hostname.endsWith(".sn") ||
        url.hostname === "www.vie-publique.sn"
      ) {
        return;
      }

      url.hash = "";
      sites.set(url.origin, { nom: label || url.hostname, url: url.origin });
    } catch {
      return;
    }
  });

  return [...sites.values()].slice(0, 500);
};

const fetchHtml = async (url) => {
  const response = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 0,
    maxContentLength: 2 * 1024 * 1024,
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "ANCPS-Certification-Research/1.0"
    }
  });

  return response.data;
};

const collectCertifications = async (sourceIds) => {
  const unknownSources = sourceIds.filter((sourceId) => !SOURCE_DEFINITIONS[sourceId]);
  if (unknownSources.length) {
    throw new Error(`Sources inconnues : ${unknownSources.join(", ")}`);
  }

  const candidates = new Map();
  const errors = [];
  let discoveredSites = [];
  let pagesAnalyzed = 0;

  for (const sourceId of sourceIds) {
    const source = SOURCE_DEFINITIONS[sourceId];
    for (const url of source.urls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);
        pagesAnalyzed += 1;

        const pageCandidates = collectStructuredCandidates($, source, url);
        if (sourceId === "force-n") {
          pageCandidates.push(...collectForceNCandidates($, source, url));
        }
        pageCandidates.forEach((candidate) => {
          const key = normalizeTitle(candidate.title);
          if (key && !candidates.has(key)) {
            candidates.set(key, candidate);
          }
        });

        if (sourceId === "vie-publique") {
          discoveredSites = collectDirectorySites($, url);
        }
      } catch (error) {
        errors.push({ source: source.nom, url, erreur: error.message });
      }
    }
  }

  return {
    pagesAnalysees: pagesAnalyzed,
    candidats: [...candidates.values()],
    sitesDecouverts: discoveredSites,
    erreurs: errors
  };
};

const importCertificationCandidates = async (candidates) => {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("La liste des candidats est obligatoire");
  }
  if (candidates.length > MAX_IMPORT_BATCH) {
    throw new Error(`Maximum ${MAX_IMPORT_BATCH} candidats par import`);
  }

  const imported = [];
  const duplicates = [];
  const errors = [];
  const seenTitles = new Set();

  for (const [index, candidate] of candidates.entries()) {
    const title = cleanText(candidate?.title);
    const sourceUrl = cleanText(candidate?.sourceUrl);
    const normalizedTitle = normalizeTitle(title);

    if (!title || title.length > 300 || !isAllowedSourceUrl(sourceUrl)) {
      errors.push({ index, title, erreur: "Titre ou URL source invalide" });
      continue;
    }
    if (seenTitles.has(normalizedTitle)) {
      duplicates.push({ index, title, raison: "Doublon dans la requête" });
      continue;
    }
    seenTitles.add(normalizedTitle);

    const existing = await Certification.findOne({
      title: { $regex: `^${escapeRegex(title)}$`, $options: "i" }
    });
    if (existing) {
      duplicates.push({ index, title, raison: "Certification déjà présente" });
      continue;
    }

    let certification;
    try {
      certification = await Certification.create({
        title,
        description: cleanText(candidate.description).slice(0, 5000) || undefined,
        sigle: cleanText(candidate.sigle).slice(0, 100) || undefined,
        code: cleanText(candidate.code).slice(0, 100) || undefined,
        published: false,
        archived: false
      });

      await Source.create({
        nom: cleanText(candidate.sourceName).slice(0, 200) || new URL(sourceUrl).hostname,
        type: "Site web",
        url: sourceUrl,
        reference: sourceUrl,
        certification: certification._id
      });
      imported.push({ id: certification._id, title });
    } catch (error) {
      if (certification) {
        await Certification.findByIdAndDelete(certification._id);
      }
      errors.push({ index, title, erreur: error.message });
    }
  }

  return { importees: imported, doublons: duplicates, erreurs: errors };
};

module.exports = {
  SOURCE_IDS: Object.keys(SOURCE_DEFINITIONS),
  collectCertifications,
  importCertificationCandidates
};