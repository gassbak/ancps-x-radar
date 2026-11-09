// Valeurs par défaut d'une fiche certification vierge et d'une décision vierge.
export const EMPTY_CERTIFICATION = {
  title: "",
  acronym: "",
  code: "",
  type: "Certification professionnelle",
  domain: "Numérique et informatique",
  subdomain: "",
  level: "Certification Professionnelle",
  entryLevel: "",
  exitLevel: "",
  duration: "",
  hours: "",
  format: "Présentiel",
  nature: "Certification professionnelle",
  description: "",
  objectives: "",
  skills: "",
  organizationId: "",
  organizationName: "",
  verificationStatus: "En cours de vérification",
  status: "En cours de vérification",
  decisions: [],
  establishmentIds: [],
  jobIds: [],
  skillIds: [],
  published: false,
  archived: false,
};

export const EMPTY_DECISION = {
  status: "Vérifiée",
  authority: "",
  decisionRef: "",
  decisionDate: "",
  validFrom: "",
  validTo: "",
  sourceId: "",
};

export const VERIFICATION_STATUSES = [
  "Vérifiée",
  "Déclarée par l'organisme",
  "En cours de vérification",
  "Expirée",
  "Archivée",
];

export function latestDecision(certification) {
  return (certification.decisions && certification.decisions[0]) || null;
}
