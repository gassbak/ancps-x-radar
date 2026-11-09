 const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  utilisateur,
  action,
  entite,
  entiteId,
  details,
  ancienneValeur,
  nouvelleValeur,
  ip
}) => {
  return AuditLog.create({
    utilisateur,
    action,
    entite,
    entiteId,
    details,
    ancienneValeur,
    nouvelleValeur,
    ip
  });
};

module.exports = {
  createAuditLog
};