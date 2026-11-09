
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";

import { api } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  // Récupère le token présent dans l'URL
  const token =
    searchParams.get("token");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Vérifier le token
    if (!token) {
      setError(
        "Le lien de réinitialisation est invalide ou incomplet."
      );
      return;
    }

    // Vérifier le mot de passe
    if (password.length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    // Vérifier la confirmation
    if (password !== confirmPassword) {
      setError(
        "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setLoading(true);

    try {
      // Appel du backend
      const data =
        await api.resetPassword(
          token,
          password
        );

      setMessage(
        data.message ||
          "Mot de passe réinitialisé avec succès."
      );

      // Vider les champs
      setPassword("");
      setConfirmPassword("");

      // Retour à la connexion après 2 secondes
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setError(
        error.message ||
          "Impossible de réinitialiser le mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">

      <div className="w-full max-w-md">

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* TITRE */}
          <div className="mb-6">

            <h1 className="text-2xl font-bold text-slate-900">
              Nouveau mot de passe
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choisissez un nouveau mot de passe
              pour votre compte ANCPS.
            </p>

          </div>

          {/* MESSAGE DE SUCCÈS */}
          {message && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}

              <p className="mt-1">
                Redirection vers la connexion...
              </p>
            </div>
          )}

          {/* MESSAGE D'ERREUR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* NOUVEAU MOT DE PASSE */}
          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nouveau mot de passe
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 8 caractères"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

          {/* CONFIRMATION */}
          <div className="mt-5">

            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirmer le mot de passe
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

          {/* BOUTON */}
          <button
            type="submit"
            disabled={loading || !token}
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Réinitialisation..."
              : "Réinitialiser le mot de passe"}
          </button>

          {/* RETOUR */}
          <div className="mt-6 text-center">

            <Link
              to="/login"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← Retour à la connexion
            </Link>

          </div>

        </form>

      </div>

    </div>
  );
}
