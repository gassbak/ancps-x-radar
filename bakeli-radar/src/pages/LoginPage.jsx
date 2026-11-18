import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';

// N'accepte qu'un chemin interne (évite une redirection vers un autre site).
const safeNext = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/formations';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(apiService.isLoggedIn());

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiService.loginWithEmail(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      const message = String(err?.message || '');
      if (/status: (400|401)\b/.test(message)) {
        setError('Email ou mot de passe incorrect.');
      } else if (/failed to fetch|networkerror|network/i.test(message)) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setError('Connexion impossible pour le moment. Réessayez dans un instant.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setLoggedIn(false);
  };

  return (
    <section className="mx-auto max-w-md space-y-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Retour au tableau de bord
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Connexion à Bakeli Radar</h1>

      {loggedIn ? (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-gray-700">Vous êtes connecté.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={next}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Continuer
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Adresse email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Mot de passe</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      )}
    </section>
  );
};
