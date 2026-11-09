const {
  searchCertifications
} = require("../services/search.service");

const search = async (req, res) => {

  try {

    const results =
      await searchCertifications(req.query);

    res.json({
      total: results.length,
      results
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  search
};