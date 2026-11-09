const express = require("express");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateRole,
  updatePermissions
} = require("../controllers/user.controller");

const protect = require("../middlewares/auth.middleware");
const requirePermission = require("../middlewares/permission.middleware");

const router = express.Router();


// ===============================
// VOIR TOUS LES UTILISATEURS
// ===============================
router.get(
  "/",
  protect,
  requirePermission("users.view"),
  getUsers
);


// ===============================
// AJOUTER UN UTILISATEUR
// ===============================
router.post(
  "/",
  protect,
  requirePermission("users.create"),
  createUser
);


// ===============================
// VOIR UN UTILISATEUR
// ===============================
router.get(
  "/:id",
  protect,
  requirePermission("users.view"),
  getUser
);


// ===============================
// MODIFIER UN UTILISATEUR
// ===============================
router.put(
  "/:id",
  protect,
  requirePermission("users.edit"),
  updateUser
);


// ===============================
// SUPPRIMER UN UTILISATEUR
// ===============================
router.delete(
  "/:id",
  protect,
  requirePermission("users.delete"),
  deleteUser
);


// ===============================
// MODIFIER LE RÔLE
// ===============================
router.put(
  "/:id/role",
  protect,
  requirePermission("users.manage_roles"),
  updateRole
);


// ===============================
// MODIFIER LES PERMISSIONS
// ===============================
router.put(
  "/:id/permissions",
  protect,
  requirePermission("users.manage_permissions"),
  updatePermissions
);


module.exports = router;