import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

const getLabel = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    return value.nom || value.name || value.title || 'Non précisé';
  }
  return 'Non précisé';
};

export const FormationsPage = () => {
  const { data: certifications = [], isLoading, error } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => apiService.getCertifications(),
  });

  return (
    <section className="space-y-6 py-2 animate-fadeIn">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Annuaire ANCPS
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Formations & Certifications
        </h1>
        <p className="mt-2 text-gray-600">
          Découvrez les certifications publiées dans l’annuaire national.
        </p>
      </header>

      {isLoading && (
        <p role="status" className="py-12 text-center text-gray-500">
          Chargement des certifications…
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
          {error.message}
          <p className="mt-1 text-sm">
            Vérifiez que l’API ANCPS est disponible et que son serveur autorise les requêtes depuis Radar.
          </p>
        </div>
      )}

      {!isLoading && !error && certifications.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
          Aucune certification publiée n’est disponible pour le moment.
        </p>
      )}

      {!isLoading && !error && certifications.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            {certifications.length} certification{certifications.length > 1 ? 's' : ''}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((certification) => (
              <article
                key={certification._id || certification.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {getLabel(certification.title || certification.sigle)}
                </h2>

                {certification.description && (
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">
                    {certification.description}
                  </p>
                )}

                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="inline font-medium text-gray-700">Organisme : </dt>
                    <dd className="inline text-gray-600">{getLabel(certification.organisme)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-700">Domaine : </dt>
                    <dd className="inline text-gray-600">{getLabel(certification.domaine)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-700">Niveau : </dt>
                    <dd className="inline text-gray-600">
                      {getLabel(certification.niveauSortie || certification.niveauEntree)}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-700">Durée : </dt>
                    <dd className="inline text-gray-600">{getLabel(certification.duree)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-700">Modalité : </dt>
                    <dd className="inline text-gray-600">{getLabel(certification.modalite)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
