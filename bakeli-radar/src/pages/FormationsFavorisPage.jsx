import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { apiService, isAnnuaireBackendEnabled } from '../services/api';
import { useCompareList } from '../services/compareStore';

const getLabel = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (value && typeof value === 'object') {
    const label = value.nom || value.name || value.title;
    return typeof label === 'string' || typeof label === 'number' ? String(label).trim() : '';
  }
  return '';
};

export const FormationsFavorisPage = () => {
  const queryClient = useQueryClient();
  const compare = useCompareList();
  const loggedIn = apiService.isLoggedIn();
  const enabled = isAnnuaireBackendEnabled && loggedIn;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['annuaire-favorites'],
    queryFn: () => apiService.getAnnuaireFavorites(),
    enabled,
    retry: false,
  });

  const removeFavorite = useMutation({
    mutationFn: (formationId) => apiService.removeAnnuaireFavorite(formationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annuaire-favorites'] }),
  });

  const favorites = data?.favorites || [];

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-2 animate-fadeIn">
      <Link
        to="/formations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Retour au catalogue
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">Mes formations enregistrées</h1>

      {!isAnnuaireBackendEnabled && (
        <p className="rounded-xl border border-gray-100 bg-white p-6 text-gray-600">
          Cette fonctionnalité n’est pas encore activée sur cet environnement.
        </p>
      )}

      {isAnnuaireBackendEnabled && !loggedIn && (
        <p className="rounded-xl border border-gray-100 bg-white p-6 text-gray-600">
          <Link to="/connexion?next=/formations/favoris" className="font-semibold text-emerald-700 hover:underline">
            Connectez-vous à Radar
          </Link>{' '}
          pour retrouver vos formations enregistrées.
        </p>
      )}

      {enabled && isLoading && (
        <p role="status" className="py-8 text-center text-gray-500">Chargement…</p>
      )}

      {enabled && error && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
          <p>Impossible de charger vos formations enregistrées pour le moment.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Réessayer
          </button>
        </div>
      )}

      {enabled && !isLoading && !error && favorites.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600">
          <p className="font-semibold text-gray-800">Aucune formation enregistrée</p>
          <p className="mt-1 text-sm">
            Ouvrez une fiche et choisissez « Enregistrer » pour la retrouver ici.
          </p>
        </div>
      )}

      {enabled && compare.ids.length >= 2 && (
        <Link to="/formations/comparer" className="inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Voir la comparaison ({compare.ids.length})
        </Link>
      )}

      {enabled && favorites.length > 0 && (
        <ul className="space-y-3">
          {favorites.map((fav) => {
            const formation = fav.formation;
            const title = formation
              ? getLabel(formation.title) || getLabel(formation.sigle) || 'Formation'
              : 'Fiche momentanément indisponible';
            return (
              <li
                key={fav.formation_id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600">
                    {formation ? getLabel(formation.organisme) || 'Organisme non renseigné' : `Référence ${fav.formation_id}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => compare.toggle(fav.formation_id)}
                    aria-pressed={compare.has(fav.formation_id)}
                    disabled={!compare.has(fav.formation_id) && compare.isFull}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {compare.has(fav.formation_id) ? 'Sélectionnée' : 'Comparer'}
                  </button>
                  <Link
                    to={`/formations/${encodeURIComponent(fav.formation_id)}`}
                    className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Consulter la fiche
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFavorite.mutate(fav.formation_id)}
                    disabled={removeFavorite.isPending}
                    aria-label={`Retirer ${title} des formations enregistrées`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    Retirer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
