
import { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError(
        "Veuillez saisir votre adresse email."
      );
      return;
    }

    setLoading(true);

    try {
      const data =
        await api.forgotPassword(
          email.trim()
        );

      setMessage(
        data.message ||
          "Si cette adresse correspond à un compte, un lien de réinitialisation a été envoyé."
      );

      setEmail("");

    } catch (error) {
      setError(
        error.message ||
          "Impossible d'envoyer la demande."
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
              Mot de passe oublié ?
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Entrez votre adresse email.
              Nous vous enverrons un lien pour
              réinitialiser votre mot de passe.
            </p>

          </div>

          {/* MESSAGE DE SUCCÈS */}
          {message && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {/* MESSAGE D'ERREUR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Adresse email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="exemple@email.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

          {/* BOUTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Envoi en cours..."
              : "Envoyer le lien"}
          </button>

          {/* RETOUR LOGIN */}
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
