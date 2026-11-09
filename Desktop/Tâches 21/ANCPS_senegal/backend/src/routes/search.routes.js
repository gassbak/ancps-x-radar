const express = require("express");

const {
  search
} = require("../controllers/search.controller");

const router = express.Router();

router.get(
  "/certifications",
  search
);

module.exports = router;