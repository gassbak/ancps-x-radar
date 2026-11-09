const requireRole = (...roles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Authentification requise"
      });
    }

    // Le superadmin a tous les accès
    if (req.user.role === "superadmin") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès interdit"
      });
    }

    next();
  };
};

module.exports = requireRole;