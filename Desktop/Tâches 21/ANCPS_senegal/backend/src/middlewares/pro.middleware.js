
const requirePermission = (...permissions) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Authentification requise"
      });
    }

    // Le superadmin a toutes les permissions
    if (req.user.role === "superadmin") {
      return next();
    }

    const hasPermission = permissions.some(
      permission =>
        req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: "Permission insuffisante"
      });
    }

    next();
  };
};

module.exports = requirePermission;