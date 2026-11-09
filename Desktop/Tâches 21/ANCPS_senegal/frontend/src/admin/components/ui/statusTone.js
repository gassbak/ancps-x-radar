/**
 * Détermine la couleur (tone) d'un badge à partir d'un libellé de statut.
 */
export function statusTone(status = "") {
  const value = status.toLowerCase();

  if (value.includes("vérifi")) return "green";
  if (value.includes("publi")) return "green";
  if (value.includes("attente") || value.includes("cours") || value.includes("déclar")) return "yellow";
  if (value.includes("expir") || value.includes("rejet")) return "red";
  if (value.includes("archiv")) return "gray";

  return "blue";
}
