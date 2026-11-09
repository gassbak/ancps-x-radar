
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    const result = await login(
      email.trim(),
      password
    );

    setLoading(false);

    if (!result.success) {
      setError(
        result.message ||
          "Email ou mot de passe incorrect."
      );
      return;
    }

    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">

    

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Se connecter
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Accédez à votre espace ANCPS.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email */}
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

          {/* Mot de passe */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700"
              >
                Mot de passe
              </label>

              <Link
                to="/mot-de-passe-oublie"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Connexion..."
              : "Se connecter"}
          </button>

          {/* Inscription */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Vous n'avez pas encore de compte ?
          </p>

          <Link
            to="/register"
            className="mt-2 block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Créer un compte
          </Link>

          {/* Retour annuaire */}
         
        </form>

       
      </div>
    </div>
  );
}
