import {
  api,
  setToken,
  clearToken,
  getToken
} from "../../services/api";

import {
  loadStore,
  saveStore
} from "./adminStore";


const ROLE_LABELS = {
  superadmin: "Super administrateur",
  admin: "Administrateur",
  editor: "Administrateur éditorial",
  verifier: "Vérificateur",
  etablissement: "Établissement / institution",
  visiteur: "Visiteur"
};


export async function login(email, password) {

  const data = await api.login({
    email: email.trim().toLowerCase(),
    password
  });

  const session = {
    email: data.user.email,
    name: data.user.name,

    // Nom affiché dans le back-office
    role:
      ROLE_LABELS[data.user.role] ||
      "Utilisateur",

    // Vrai rôle venant du backend
    backendRole: data.user.role,

    // Permissions venant du backend
    permissions: data.user.permissions || [],

    loginAt: new Date().toISOString()
  };

  setToken(data.token);

  saveStore({
    ...loadStore(),
    session
  });

  return session;
}


export function getSession() {

  return getToken()
    ? loadStore().session || null
    : null;
}


export function logout() {

  clearToken();

  saveStore({
    ...loadStore(),
    session: null
  });
}