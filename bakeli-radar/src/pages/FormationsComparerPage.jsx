import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, X } from 'lucide-react';
import { apiService, isAnnuaireBackendEnabled, trackAnnuaireEvent } from '../services/api';
import { useCompareList } from '../services/compareStore';

const getLabel = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (value && typeof value === 'object') {
    const label = value.nom || value.name || value.title;
    return typeof label === 'string' || typeof label === 'number' ? String(label).trim() : '';
  }
  return '';
};

const getDisplayValue = (value) =>
  Array.isArray(value) ? value.map(getLabel).filter(Boolean).join(', ') : getLabel(value);

const getCost = (certification) =>
  ['cout', 'coût', 'prix', 'cost', 'price', 'frais', 'fraisInscription']
    .map((field) => certification[field])
    .map(getLabel)
    .find(Boolean);

const ROWS = [
  { label: 'Organisme', get: (c) => c.organisme },
  { label: 'Objectif', get: (c) => c.objectifs },
  { label: 'Durée', get: (c) => c.duree || c.volumeHoraire },
  { label: 'Coût', get: getCost },
  { label: 'Conditions d’accès', get: (c) => c.conditionsAcces },
  { label: 'Modalité', get: (c) => c.modalite },
  { label: 'Certification / diplôme délivré', get: (c) => c.type },
  { label: 'Localisation', get: (c) => c.lieu },
  { label: 'Niveau de sortie', get: (c) => c.niveauSortie },
  { label: 'Statut de vérification', get: (c) => c.statutVerification },
  { label: 'Dernière vérification', get: (c) => c.sourceLastVerifiedAt },
];

export const FormationsComparerPage = () => {
  const compare = useCompareList();
  const { ids } = compare;
  const idsKey = ids.join(',');

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['certification', id, isAnnuaireBackendEnabled],
      queryFn: () =>
        isAnnuaireBackendEnabled
          ? apiService.getAnnuaireFormation(id)
          : apiService.getCertification(id),
    })),
  });

  useEffect(() => {
    if (idsKey.split(',').filter(Boolean).length >= 2) {
      trackAnnuaireEvent('comparison_started', { detail: String(idsKey.split(',').length) });
    }
  }, [idsKey]);

  return (
    <section className="space-y-6 py-2 animate-fadeIn">
      <Link
        to="/formations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Retour au catalogue
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">Comparer des formations</h1>

      {ids.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600">
          <p className="font-semibold text-gray-800">Aucune formation sélectionnée</p>
          <p className="mt-1 text-sm">
            Choisissez « Comparer » sur les cartes du catalogue (jusqu’à 3 formations).
          </p>
        </div>
      )}

      {ids.length === 1 && (
        <p role="status" className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Sélectionnez au moins une autre formation pour lancer la comparaison.
        </p>
      )}

      {ids.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <caption className="sr-only">Comparaison des formations sélectionnées</caption>
            <thead>
              <tr className="border-b border-gray-100 align-top">
                <th scope="col" className="w-44 bg-gray-50 p-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Critère
                </th>
                {ids.map((id, index) => {
                  const query = results[index];
                  const certification = query?.data;
                  const title = certification
                    ? getLabel(certification.title) || getLabel(certification.sigle) || 'Formation'
                    : query?.isError
                      ? 'Fiche indisponible'
                      : 'Chargement…';
                  return (
                    <th key={id} scope="col" className="p-4 align-top">
                      <div className="flex items-start justify-between gap-2">
                        {certification ? (
                          <Link
                            to={`/formations/${encodeURIComponent(id)}`}
                            className="font-bold text-emerald-700 hover:underline"
                          >
                            {title}
                          </Link>
                        ) : (
                          <span className="font-bold text-gray-700">{title}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => compare.remove(id)}
                          aria-label={`Retirer ${title} de la comparaison`}
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <X aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ label, get }) => (
                <tr key={label} className="border-b border-gray-50 align-top">
                  <th scope="row" className="bg-gray-50 p-4 text-xs font-semibold text-gray-600">
                    {label}
                  </th>
                  {ids.map((id, index) => {
                    const query = results[index];
                    const certification = query?.data;
                    let content = '';
                    if (certification) content = getDisplayValue(get(certification));
                    return (
                      <td key={id} className="whitespace-pre-line p-4 text-gray-800">
                        {certification ? (
                          content || <span className="italic text-gray-400">Non renseigné</span>
                        ) : query?.isError ? (
                          <span className="italic text-gray-400">Indisponible</span>
                        ) : (
                          <span className="text-gray-400">…</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ids.length > 0 && (
        <button
          type="button"
          onClick={compare.clear}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Vider la comparaison
        </button>
      )}
    </section>
  );
};
