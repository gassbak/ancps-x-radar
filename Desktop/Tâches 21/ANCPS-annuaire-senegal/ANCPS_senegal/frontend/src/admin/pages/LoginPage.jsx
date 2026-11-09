import { useState } from "react";
import { login } from "../services/adminAuth";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await login(email, password);
      onLogin(session);
    } catch (err) {
      setError(err.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-900 text-xl font-extrabold text-yellow-400">
          A
        </div>

        <h1 className="text-center text-2xl font-extrabold text-emerald-950">Espace Administration</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Annuaire National des Certifications Professionnelles du Sénégal
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border px-3 py-2.5"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold">Mot de passe</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border px-3 py-2.5"
              required
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-700 py-3 font-bold text-white hover:bg-emerald-800"
            disabled={loading}
          >
            {loading ? "Connexion ..." : "Se connecter"}
          </button>
        </form>

        {/* <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-900">
          <p className="font-bold">Comptes de démonstration</p>
          <p className="mt-1">admin@ancps.sn / admin · editor@ancps.sn / editor · verif@ancps.sn / verif</p>
        </div> */}
      </div>
    </div>
  );
}
