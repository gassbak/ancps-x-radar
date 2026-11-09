const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://ancps-senegal.onrender.com/api";

const TOKEN_KEY = "ancps_token";

// ===============================
// TOKEN
// ===============================

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

// ===============================
// REQUEST PRINCIPALE
// ===============================

export async function request(endpoint, options = {}) {
    const token = getToken();

    const isFormData =
        options.body instanceof FormData;

    const url = `${API_URL}${endpoint}`;

    console.log("API Request :", {
        url,
        method: options.method || "GET",
    });

    try {
        const response = await fetch(url, {
            ...options,

            headers: {
                ...(isFormData
                    ? {}
                    : {
                        "Content-Type":
                            "application/json",
                    }),

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`,
                    }
                    : {}),

                ...options.headers,
            },
        });

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const message =
                data?.message ||
                data?.error ||
                `Erreur HTTP ${response.status}`;

            console.error(
                "Erreur API :",
                response.status,
                message
            );

            throw new Error(message);
        }

        return data;
    } catch (error) {
        console.error(
            "Erreur requête API :",
            endpoint,
            error
        );

        throw error;
    }
}

// ===============================
// CRUD GÉNÉRIQUE
// ===============================

const crud = (resource) => ({
    list: () => request(`/${resource}`),

    get: (id) =>
        request(`/${resource}/${id}`),

    create: (data) =>
        request(`/${resource}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id, data) =>
        request(`/${resource}/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    remove: (id) =>
        request(`/${resource}/${id}`, {
            method: "DELETE",
        }),
});

// ===============================
// API
// ===============================

export const api = {

    // ===========================
    // AUTHENTIFICATION
    // ===========================

    login: (data) =>
        request("/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    register: (data) =>
        request("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getProfile: () =>
        request("/auth/profile"),

    forgotPassword: (email) =>
        request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({
                email,
            }),
        }),

    resetPassword: (token, password) =>
        request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                token,
                password,
            }),
        }),

    // ===========================
    // CERTIFICATIONS
    // ===========================

    getCertifications: async () => {
        const response =
            await request(
                "/certifications?published=true"
            );

        return response?.data || [];
    },

    getCertification: (id) =>
        request(`/certifications/${id}`),

    createCertification: (data) =>
        request("/certifications", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    updateCertification: (id, data) =>
        request(`/certifications/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    deleteCertification: (id) =>
        request(`/certifications/${id}`, {
            method: "DELETE",
        }),

    searchCertifications: (params = {}) => {
        const query =
            new URLSearchParams(params)
                .toString();

        return request(
            `/search/certifications?${query}`
        );
    },

    // ===========================
    // ORGANISMES
    // ===========================

    getOrganizations: () =>
        request("/organismes"),

    // ===========================
    // RÉFÉRENTIELS
    // ===========================

    domaines: crud("domaines"),

    metiers: crud("metiers"),

    competences: crud("competences"),

    organismes: crud("organismes"),

    etablissements: crud("etablissements"),

    sources: crud("sources"),

    documents: crud("documents"),

    niveaux: crud("niveaux"),
};