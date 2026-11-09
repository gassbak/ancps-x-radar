const validationMiddleware =
  (req, res, next) => {

    if (!req.body) {
      return res.status(400).json({
        message:
          "Données invalides"
      });
    }

    next();
  };

module.exports =
  validationMiddleware;