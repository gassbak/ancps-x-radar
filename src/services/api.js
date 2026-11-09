const normalizeBaseUrl = (raw, fallback) => {
  const src = (raw || fallback).trim();
  // Enlève les slashes finaux
  const withoutTrailing = src.replace(/\/+$/, "");
  // Si l'URL ne contient pas /api, on ajoute le suffixe attendu
  if (!withoutTrailing.includes("/api/")) {
    return `${withoutTrailing}${fallback.replace(/^https?:\/\/[^/]+/, "")}`;
  }
  return withoutTrailing;
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, "https://api-wagan.bakeli.tech/api/radar_jobs");
const CV_API_URL = normalizeBaseUrl(import.meta.env.VITE_CV_API_URL, "https://api-wagan.bakeli.tech/api/cv-scoring");
const AUTH_API_URL = normalizeBaseUrl(import.meta.env.VITE_AUTH_API_URL, "https://api-wagan.bakeli.tech/api/auth");
const ANCPS_API_URL = (import.meta.env.VITE_ANCPS_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// Fallback data when backend is incomplete / unreachable
const FALLBACK_OPPORTUNITIES = [
  {
    id: 1,
    title: "Développeur Full Stack",
    company: "Bakeli Tech",
    type: "Emploi",
    description: "Nous cherchons un développeur passionné pour rejoindre notre équipe technique.",
    tags: ["#Informatique", "#CDI", "#Senior"],
    location: "Dakar",
    date: "30/12/2023",
    offer_url: "https://www.emploisenegal.com",
    highlighted: false,
  },
  {
    id: 2,
    title: "Stage Assistant Marketing",
    company: "Orange Sénégal",
    type: "Stage",
    description: "Assistez notre équipe marketing dans la gestion des campagnes.",
    tags: ["#Marketing", "#Communication", "#Stage"],
    location: "Dakar",
    date: "15/12/2023",
    offer_url: "https://www.orange.sn",
    highlighted: true,
  },
  {
    id: 9,
    title: "Comptable Senior",
    company: "CBAO",
    type: "Emploi",
    description: "Tenue de la comptabilité générale.",
    tags: ["#Finance", "#Comptabilité"],
    location: "Dakar",
    date: "31/12/2023",
    offer_url: "https://www.cbao.sn",
    highlighted: false,
  },
];

const FALLBACK_MARKET_STATS = {
  typesDistribution: [
    { name: "Emploi", count: 62, color: "#00875A" },
    { name: "Stage", count: 23, color: "#00A86B" },
    { name: "Bourse", count: 7, color: "#00BFA5" },
    { name: "Concours", count: 7, color: "#8BC34A" },
    { name: "Prestation", count: 2, color: "#00897B" },
  ],
  topRegions: [
    { name: "Dakar", value: 56, color: "#00875A" },
    { name: "Sénégal (Multi-régions)", value: 39, color: "#00A86B" },
    { name: "Saint", value: 1, color: "#00BFA5" },
    { name: "Thiès", value: 1, color: "#8BC34A" },
  ],
};

// Utility fetch function with JWT support - robust against HTML responses
const apiFetch = async (baseUrl, endpoint, options = {}) => {
  const token = localStorage.getItem("jwt_token");
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  console.log(`[API Request] Fetching ${url}`);

  const response = await fetch(url, { ...options, headers });

  // Handle HTTP errors
  if (!response.ok) {
    let errorDetail = "";
    const contentType = response.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.error || errJson.message || JSON.stringify(errJson);
      } else {
        const text = await response.text();
        if (text.trim().startsWith("<!doctype") || text.trim().startsWith("<html")) {
          errorDetail = `Endpoint not yet deployed (HTML 404) for ${endpoint}`;
        } else {
          errorDetail = text.slice(0, 500);
        }
      }
    } catch (e) {
      errorDetail = `status ${response.status}`;
    }
    // 429 dédié pour que le front affiche un message clair + Retry-After
    if (response.status === 429) {
      // Retry-After peut être dans header (exposé CORS) ou dans body JSON {retry_after:20}
      let retryAfter = response.headers.get("Retry-After") || response.headers.get("retry-after");
      if (!retryAfter) {
        try { const j = JSON.parse(errorDetail); if (j.retry_after) retryAfter = String(j.retry_after); } catch {}
      }
      retryAfter = retryAfter || "20";
      const err = new Error(`RATE_LIMIT:${retryAfter}:${errorDetail}`);
      err.status = 429;
      err.retryAfter = parseInt(retryAfter, 10) || 20;
      throw err;
    }
    throw new Error(`HTTP error! status: ${response.status} for ${url} - ${errorDetail}`);
  }

  // Check content-type before parsing JSON - backend incomplet may return HTML with 200
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    const text = await response.text();
    throw new Error(`Expected JSON but got HTML for ${url} - backend endpoint may not be deployed yet`);
  }

  // Parse JSON safely
  try {
    const text = await response.text();
    // Detect HTML even if content-type is wrong
    if (text.trim().startsWith("<!doctype") || text.trim().startsWith("<html") || text.trim().startsWith("<!DOCTYPE")) {
      throw new Error(`Endpoint returned HTML instead of JSON for ${url} - endpoint not deployed`);
    }
    return text ? JSON.parse(text) : {};
  } catch (e) {
    if (e.message.includes("HTML")) throw e;
    throw new Error(`Failed to parse JSON for ${url}: ${e.message}`);
  }
};

export const apiService = {
  // Authentication JWT
  async login(username, password) {
    const res = await apiFetch(AUTH_API_URL, "/jwt/create/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res.access) {
      localStorage.setItem("jwt_token", res.access);
      if (res.refresh) localStorage.setItem("jwt_refresh", res.refresh);
    }
    return res;
  },

  logout() {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_refresh");
  },

  isLoggedIn() {
    return !!localStorage.getItem("jwt_token");
  },

  // Fetch single job detail GET /api/radar_jobs/jobs/<id>/
  // jobId peut être id numérique (ex: "0") ou offer_url complète -> encodeURIComponent côté front, <path:job_id> côté Django
  async getJobDetail(jobId) {
    if (!jobId && jobId !== 0) throw new Error("jobId requis");
    const encoded = encodeURIComponent(String(jobId));
    return await apiFetch(API_BASE_URL, `/jobs/${encoded}/`);
  },

  // Fetch all opportunities from backend GET /api/radar_jobs/jobs/
  async getOpportunities(filters = {}) {
    try {
      const params = new URLSearchParams({ page: 1, limit: 1000 });
      if (filters.type && filters.type !== "Tout voir") params.append("type", filters.type);
      if (filters.location && filters.location !== "Toute les régions") params.append("location", filters.location);
      if (filters.search) params.append("search", filters.search);
      if (filters.company) params.append("company", filters.company);

      const res = await apiFetch(API_BASE_URL, `/jobs/?${params.toString()}`);

      const jobsList = res.jobs || res.results || (Array.isArray(res) ? res : []);

      const formattedData = jobsList.map((item) => ({
        id: String(item.id ?? item.offer_url ?? ""),
        title: item.title,
        company: item.company || "Entreprise Partenaire",
        type: item.type || "Emploi",
        description: item.description || "",
        tags: item.key_skills || item.tags || ["#Opportunité", "#Sénégal"],
        location: item.location || "Dakar",
        date: item.publish_date || item.date || "Aujourd'hui",
        offer_url: item.offer_url || item.url || "",
        highlighted: item.highlighted || false,
      }));

      // Client-side filtering fallback if backend doesn't filter
      let data = formattedData;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.company.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      return {
        success: true,
        count: res.total || data.length,
        lastUpdated: res.last_update || new Date().toLocaleDateString("fr-FR"),
        data,
      };
    } catch (err) {
      console.warn("[API] getOpportunities fallback due to:", err.message);
      // Fallback to mock data filtered locally
      let data = [...FALLBACK_OPPORTUNITIES];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.company.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (filters.company) {
        const compQ = filters.company.toLowerCase();
        data = data.filter((item) => (item.company || "").toLowerCase().includes(compQ));
      }
      if (filters.type && filters.type !== "Tout voir") {
        data = data.filter((item) => item.type.toLowerCase() === filters.type.toLowerCase());
      }
      if (filters.location && filters.location !== "Toute les régions") {
        data = data.filter((item) => item.location.toLowerCase() === filters.location.toLowerCase());
      }
      return {
        success: true,
        count: data.length,
        lastUpdated: "Données locales (backend en cours de déploiement)",
        data,
        _fallback: true,
        _error: err.message,
      };
    }
  },

  // Market insights GET /api/radar_jobs/status/
  async getMarketInsights() {
    try {
      const data = await apiFetch(API_BASE_URL, "/status/");
      const typesRaw = data.types_distribution || data.types || data.offer_types || data.distribution || {};
      const locationsRaw = data.locations_distribution || data.locations || data.regions || {};

      const colorsTypes = ["#00875A", "#00A86B", "#00BFA5", "#8BC34A", "#00897B", "#00695C"];
      let typesDistribution = Object.entries(typesRaw).map(([name, count], idx) => ({
        name,
        count: Number(count) || 0,
        color: colorsTypes[idx % colorsTypes.length],
      }));

      const colorsRegions = ["#00875A", "#00A86B", "#00BFA5", "#8BC34A", "#00897B"];
      let topRegions = Object.entries(locationsRaw).map(([name, value], idx) => ({
        name,
        value: Number(value) || 0,
        color: colorsRegions[idx % colorsRegions.length],
      }));

      const toPairs = (obj) => Object.entries(obj || {}).map(([name, value]) => ({ name, value: Number(value) || 0 }));
      const topSkills = toPairs(data.top_skills).map((s, idx) => ({ ...s, color: colorsTypes[idx % colorsTypes.length] }));
      const contracts = toPairs(data.contracts_distribution).map((s, idx) => ({ ...s, color: colorsRegions[idx % colorsRegions.length] }));
      const topCompanies = toPairs(data.top_companies).slice(0, 8);
      const sectorsDist = toPairs(data.sectors_distribution);

      return {
        success: true,
        totalJobs: data.total_jobs || 0,
        lastUpdate: data.last_update || new Date().toLocaleDateString("fr-FR"),
        newJobs: data.new_jobs ?? null,
        sectorsCount: (data.sectors || []).length,
        topSectorShare: data.top_sector_share ?? null,
        shareRealDescriptions: data.share_real_descriptions ?? null,
        sourcesCount: data.sources_count ?? null,
        data: { typesDistribution, topRegions, topSkills, contracts, topCompanies, sectorsDist },
      };
    } catch (err) {
      console.warn("[API] getMarketInsights fallback due to:", err.message);
      return {
        success: true,
        totalJobs: FALLBACK_OPPORTUNITIES.length,
        lastUpdate: "Données locales",
        data: FALLBACK_MARKET_STATS,
        _fallback: true,
      };
    }
  },

  async getPartners() {
    try {
      const res = await apiFetch(API_BASE_URL, "/partners/");
      return { success: true, data: res.partners || res.results || [] };
    } catch (err) {
      console.warn("[API] getPartners fallback (endpoint not deployed):", err.message);
      return { success: true, data: [], _fallback: true };
    }
  },

  async sendAiMessage(message, history = null) {
    try {
      const payload = history && Array.isArray(history) && history.length > 1
        ? { messages: history }
        : { messages: [{ role: "user", content: message }] };
      const res = await apiFetch(API_BASE_URL, "/chat/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { success: true, reply: res.response || res.error || "Réponse reçue." };
    } catch (err) {
      // 429 => on ne fallback pas en mode local, on propage pour afficher le compteur côté UI
      if (err.status === 429 || String(err.message).startsWith("RATE_LIMIT")) {
        const retryAfter = err.retryAfter || parseInt(String(err.message).split(":")[1], 10) || 20;
        console.warn("[API] sendAiMessage rate limited, retryAfter", retryAfter);
        const e = new Error(`RATE_LIMIT:${retryAfter}`);
        e.status = 429;
        e.retryAfter = retryAfter;
        throw e;
      }
      console.warn("[API] sendAiMessage fallback due to:", err.message);
      const msgLower = message.toLowerCase();
      // Fallback esthétique : si l'utilisateur cherche développeur, on renvoie de vraies cartes via le format parsé
      if (msgLower.includes("développeur") || msgLower.includes("developpeur") || msgLower.includes("dev")) {
        const devOffers = FALLBACK_OPPORTUNITIES.filter(o => o.title.toLowerCase().includes("développeur") || o.tags.join(" ").toLowerCase().includes("informatique"));
        const list = (devOffers.length ? devOffers : FALLBACK_OPPORTUNITIES.slice(0,2)).map(o =>
          `📌 **${o.title}**\n🏢 ${o.company} • 📍 ${o.location}\n💰 ${o.type} • ⏳ 2-5 ans\n🎓 Bac+3 et plus\n🔑 Compétences : ${o.tags.join(", ")}\n🔗 ${o.offer_url}`
        ).join("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        return { success: true, reply: `🎯 **${devOffers.length || 2} offres trouvées** pour « développeur »\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${list}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Mode local — IA temporairement indisponible, voici une sélection locale.`, _fallback: true };
      }
      let responseText = "Je peux t'aider à trouver le stage, l'emploi ou la bourse idéal(e) au Sénégal. Que recherches-tu aujourd'hui ?";
      if (msgLower.includes("stage") || msgLower.includes("marketing")) {
        responseText = "J'ai trouvé 3 stages intéressants au Sénégal, notamment chez Orange Sénégal (Assistant Marketing) et Kirilene (Community Manager). Souhaites-tu postuler ?";
      } else if (msgLower.includes("emploi")) {
        responseText = "Plusieurs offres d'emploi tech sont disponibles, notamment Développeur Full Stack chez Bakeli Tech (Dakar) et Technicien Réseaux chez Free Sénégal (Thiès).";
      } else if (msgLower.includes("bourse") || msgLower.includes("étude")) {
        responseText = "La Fondation Sonatel propose actuellement une bourse complète en sciences des données à l'UGB.";
      } else if (msgLower.includes("backend") || msgLower.includes("déploiement")) {
        responseText = "Le backend est en cours de déploiement sur api-wagan.bakeli.tech. Certaines fonctionnalités (chat, partners, health) seront bientôt disponibles.";
      }
      return { success: true, reply: responseText + " (mode local - backend en cours de déploiement)", _fallback: true };
    }
  },

  async getHealth() {
    try {
      return await apiFetch(API_BASE_URL, "/health/");
    } catch (err) {
      console.warn("[API] getHealth fallback:", err.message);
      return {
        status: "partial",
        ready: true,
        message: "Backend partiellement déployé - endpoints /health et /monitoring pas encore disponibles",
        last_update: new Date().toISOString(),
        total_jobs: 101,
        error: err.message,
        _fallback: true,
      };
    }
  },

  async getMonitoring() {
    try {
      return await apiFetch(API_BASE_URL, "/monitoring/");
    } catch (err) {
      console.warn("[API] getMonitoring fallback:", err.message);
      return {
        status: "partial",
        message: "Monitoring endpoint not yet deployed",
        endpoints: {
          "/jobs/": "OK",
          "/status/": "OK",
          "/health/": "Not deployed (404)",
          "/partners/": "Not deployed (404)",
          "/monitoring/": "Not deployed (404)",
          "/chat/": "OK (POST only)",
        },
        error: err.message,
        _fallback: true,
      };
    }
  },

  // CV Scoring Public Endpoints (legacy double-upload)
  async matchCvFile(cvFile, jobFile) {
    const formData = new FormData();
    formData.append("cv", cvFile);
    formData.append("job", jobFile);

    try {
      const response = await fetch(`${CV_API_URL}/match/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    } catch (err) {
      console.warn("[API] matchCvFile error:", err.message);
      throw new Error("Service CV Scoring non disponible (backend en cours de déploiement).");
    }
  },

  async matchCvUrl(cvUrl, jobUrl) {
    return await apiFetch(CV_API_URL, "/match-url/", {
      method: "POST",
      body: JSON.stringify({ cv_url: cvUrl, job_url: jobUrl }),
    });
  },

  // NOUVEAU: Scoring depuis offre scrapée — public (job_id + CV upload)
  // Usage: apiService.analyzeScrapedPublic("0" ou offer_url, File)
  // jobId = offer_url (recommandé, stable) ou id numérique
  async analyzeScrapedPublic(jobId, cvFile) {
    if (!jobId && jobId !== 0) throw new Error("jobId requis");
    if (!cvFile) throw new Error("Fichier CV requis");
    if (cvFile.size && cvFile.size > 5 * 1024 * 1024) throw new Error("CV trop volumineux (max 5 Mo)");
    const formData = new FormData();
    formData.append("job_id", String(jobId));
    formData.append("cv", cvFile);
    const token = localStorage.getItem("jwt_token");
    const cleanBase = CV_API_URL.replace(/\/+$/, "");
    const url = `${cleanBase}/analyze-scraped/`;
    const response = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!response.ok) {
      const ct = response.headers.get("content-type") || "";
      let detail = "";
      try {
        if (ct.includes("application/json")) {
          const j = await response.json();
          detail = j.error || j.detail || JSON.stringify(j);
        } else {
          const text = await response.text();
          const isHtml = text.trim().toLowerCase().startsWith("<!doctype") || text.trim().toLowerCase().startsWith("<html");
          if (response.status === 404 && isHtml) {
            detail = "Endpoint /analyze-scraped/ non déployé sur le backend prod (api-wagan.bakeli.tech). Déployez wagan-api (git push) ou testez en local avec VITE_CV_API_URL=http://127.0.0.1:8000/api/cv-scoring";
          } else if (isHtml) {
            detail = `Erreur serveur (${response.status}) — réponse HTML inattendue. Vérifiez que le backend est à jour.`;
          } else {
            detail = text.slice(0, 500);
          }
        }
      } catch { detail = `status ${response.status}`; }
      throw new Error(detail || `Erreur ${response.status}`);
    }
    return response.json();
  },

  // NOUVEAU: Scoring depuis offre scrapée — avec profil (auth, CV stocké)
  // Usage: apiService.analyzeScrapedProfile("0" ou offer_url)
  async analyzeScrapedProfile(jobId) {
    if (!jobId && jobId !== 0) throw new Error("jobId requis");
    return await apiFetch(CV_API_URL, "/analyze-scraped/profile/", {
      method: "POST",
      body: JSON.stringify({ job_id: String(jobId) }),
    });
  },

  // CV Scoring Authenticated Endpoints
  async getCvProfile() {
    return await apiFetch(CV_API_URL, "/profile/");
  },

  async updateCvProfile(formData) {
    const token = localStorage.getItem("jwt_token");
    const response = await fetch(`${CV_API_URL}/profile/`, {
      method: "PUT",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async deleteCv() {
    return await apiFetch(CV_API_URL, "/profile/delete-cv/", { method: "DELETE" });
  },

  async analyzeStoredCv(jobUrl) {
    return await apiFetch(CV_API_URL, "/analyze/", {
      method: "POST",
      body: JSON.stringify({ job_url: jobUrl }),
    });
  },

  async getCvHistory() {
    return await apiFetch(CV_API_URL, "/history/");
  },

  async getCvStats() {
    return await apiFetch(CV_API_URL, "/stats/");
  },

  // Job Alerts (candidats) — backend radar_jobs + envoi Brevo
  async createAlert({ email, keywords = "", sector = "", location = "", job_type = "", frequency = "daily" }) {
    return await apiFetch(API_BASE_URL, "/alerts/", {
      method: "POST",
      body: JSON.stringify({ email, keywords, sector, location, job_type, frequency }),
    });
  },

  async getAlerts(email) {
    return await apiFetch(API_BASE_URL, `/alerts/list/?email=${encodeURIComponent(email)}`);
  },

  async deleteAlert(alertId, email) {
    return await apiFetch(API_BASE_URL, `/alerts/${alertId}/?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
  },

  async getAlertStatus() {
    try {
      return await apiFetch(API_BASE_URL, "/alerts/status/");
    } catch {
      return { brevo_configured: false };
    }
  },

  async getCertifications() {
    const response = await fetch(`${ANCPS_API_URL}/certifications?published=true`);

    if (!response.ok) {
      throw new Error(`Impossible de charger les certifications (erreur ${response.status}).`);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("L’API ANCPS a renvoyé une réponse invalide.");
    }

    if (!Array.isArray(result.data)) {
      throw new Error("La réponse de l’API ANCPS ne contient pas la liste attendue.");
    }

    return result.data;
  },
};
