// Couche d'accès aux données de démonstration du back-office.
// Les données sont conservées dans localStorage (voir admin/data/seed.js
// pour l'amorçage initial). Cette couche ne parle pas au backend :
// elle conserve exactement le même contrat que l'ancien
// backoffice/admin/services/adminData.js.

export const STORAGE_KEY = "ancps_admin_data";

export const roles = [
  "Super administrateur",
  "Administrateur éditorial",
  "Vérificateur",
  "Établissement / institution",
];

const ROLE_PERMISSIONS = {
  "Super administrateur": [
    "dashboard.read",
    "content.read",
    "content.write",
    "content.delete",
    "publish",
    "verify",
    "requests.read",
    "requests.create",
    "requests.validate",
    "sources.read",
    "sources.write",
    "documents.read",
    "documents.write",
    "imports",
    "audit.read",
    "notifications.read",
    "admin.users",
    "admin.settings",
  ],

  "Administrateur éditorial": [
    "dashboard.read",
    "content.read",
    "content.write",
    "publish",
    "requests.read",
    "sources.read",
    "sources.write",
    "documents.read",
    "documents.write",
    "imports",
    "audit.read",
    "notifications.read",
  ],

  "Vérificateur": [
    "dashboard.read",
    "content.read",
    "verify",
    "requests.read",
    "requests.validate",
    "sources.read",
    "sources.write",
    "documents.read",
    "documents.write",
    "audit.read",
    "notifications.read",
  ],

  "Établissement / institution": [
    "dashboard.read",
    "content.read",
    "requests.read",
    "requests.create",
    "notifications.read",
  ],
};

/**
 * Vérifie si un rôle possède une permission.
 */
export const can = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

/**
 * Retourne toutes les permissions d'un rôle.
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Charge les données administrateur depuis localStorage.
 */
export const loadStore = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {};
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Erreur lors du chargement des données admin :", error);
    return {};
  }
};

/**
 * Sauvegarde les données administrateur dans localStorage.
 */
export const saveStore = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des données admin :", error);
    return false;
  }
};

/**
 * Supprime les données administrateur de localStorage.
 */
export const clearStore = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression des données admin :", error);
    return false;
  }
};
