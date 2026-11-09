const axios = require("axios");
const cheerio = require("cheerio");
const {
  SOURCE_IDS,
  collectCertifications,
  importCertificationCandidates
} = require("../services/scraper.service");

exports.collectCertifications = async (req, res) => {
  try {
    const sourceIds = req.body?.sourceIds || SOURCE_IDS;
    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({ message: "Sélectionnez au moins une source" });
    }

    const result = await collectCertifications(sourceIds);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.importCertifications = async (req, res) => {
  try {
    const result = await importCertificationCandidates(req.body?.candidats);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.scrapeAmieFpt = async (req, res) => {
  try {
    const url =
      "https://amiefpt.sec.gouv.sn/front/programmes";

    const response = await axios.get(url, {
      timeout: 30000
    });

    const $ = cheerio.load(response.data);

    const title = $("title").text().trim();

    const headings = $("h1, h2, h3, h4")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    return res.json({
      success: true,
      source: url,
      pageTitle: title,
      totalHeadings: headings.length,
      headings: headings.slice(0, 20)
    });

  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};