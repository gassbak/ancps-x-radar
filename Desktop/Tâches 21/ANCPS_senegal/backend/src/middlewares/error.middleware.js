const errorMiddleware =
  (err, req, res, next) => {

    console.error(
      err.message
    );

    const status =
      err.status || 500;

    res.status(status).json({
      message:
        err.message ||
        "Erreur serveur"
    });
  };

module.exports =
  errorMiddleware;