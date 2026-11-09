const express =
  require("express");

const {
  calculerCompletude
} = require(
  "../controllers/completude.controller"
);

const protect =
  require(
    "../middlewares/auth.middleware"
  );

const router =
  express.Router();

router.get(
  "/:certificationId",
  protect,
  calculerCompletude
);

module.exports = router;