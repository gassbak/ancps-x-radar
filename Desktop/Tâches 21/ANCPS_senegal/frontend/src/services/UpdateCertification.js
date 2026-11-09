import initialCertifications from "./mock/certifications";
import organizations from "./mock/organizations";

const STORAGE_KEY = "ancps_certifications";

const wait = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getStoredCertifications() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    return JSON.parse(saved);
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialCertifications)
  );

  return initialCertifications;
}

export const api = {
  // =========================
  // RÉCUPÉRER LES CERTIFICATIONS
  // =========================
  async getCertifications() {
    await wait();

    return getStoredCertifications();
  },

  // =========================
  // RÉCUPÉRER UNE CERTIFICATION
  // =========================
  async getCertification(id) {
    await wait();

    const certifications = getStoredCertifications();

    return certifications.find(
      (certification) =>
        String(certification.id) === String(id)
    );
  },

  // =========================
  // CRÉER
  // =========================
  async createCertification(data) {
    await wait();

    const certifications = getStoredCertifications();

    const newCertification = {
      ...data,
      id: Date.now(),
    };

    const updated = [
      newCertification,
      ...certifications,
    ];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return newCertification;
  },

  // =========================
  // MODIFIER
  // =========================
  async updateCertification(id, data) {
    await wait();

    const certifications = getStoredCertifications();

    const updated = certifications.map(
      (certification) => {
        if (
          String(certification.id) === String(id)
        ) {
          return {
            ...certification,
            ...data,
            id: certification.id,
          };
        }

        return certification;
      }
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return updated.find(
      (certification) =>
        String(certification.id) === String(id)
    );
  },

  // =========================
  // SUPPRIMER
  // =========================
  async deleteCertification(id) {
    await wait();

    const certifications = getStoredCertifications();

    const updated = certifications.filter(
      (certification) =>
        String(certification.id) !== String(id)
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    return true;
  },

  // =========================
  // ORGANISATIONS
  // =========================
  async getOrganizations() {
    await wait();

    return organizations;
  },
};