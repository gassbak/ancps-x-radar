
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    // 1. Vérifier la connexion
    if (!req.user) {
      return res.status(401).json({
        message: "Authentification requise"
      });
    }

    // 2. Super administrateur : accès complet
    if (
      req.user.role === "superadmin" ||
      req.user.role === "admin"
    ) {
      return next();
    }

    // 3. Récupérer les permissions de l'utilisateur
    const userPermissions = Array.isArray(
      req.user.permissions
    )
      ? req.user.permissions
      : [];

    // 4. Vérifier les droits nécessaires
    const hasPermission = permissions.some(
      (permission) =>
        userPermissions.includes(permission)
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