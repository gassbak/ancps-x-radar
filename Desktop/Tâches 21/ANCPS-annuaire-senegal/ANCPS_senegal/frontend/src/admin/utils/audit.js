/**
 * Construit une entrée d'historique/audit, au format attendu par
 * store.audit (voir admin/pages/AuditPage.jsx).
 */
export function makeAuditEntry({ user, action, entity, oldValue = "—", newValue = "—" }) {
  return {
    id: "a_" + Date.now(),
    user,
    action,
    entity,
    oldValue,
    newValue,
    date: new Date().toLocaleString("fr-FR"),
  };
}

/**
 * Ajoute une entrée d'audit en tête de l'historique existant.
 */
export function withAuditEntry(existingAudit = [], entry) {
  return [entry, ...existingAudit];
}

/**
 * Génère un identifiant unique pour une nouvelle notification.
 */
export function makeNotificationId() {
  return "n_" + Date.now();
}
