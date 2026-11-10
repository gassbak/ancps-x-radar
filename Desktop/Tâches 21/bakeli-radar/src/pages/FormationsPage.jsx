import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { OpportunityCard } from '../components/OpportunityCard';
import { apiService } from '../services/api';

const getLabel = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const label = value.nom || value.name || value.title;
    return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
  }
  return '';
};

export const FormationsPage = () => {
  const { data: certifications = [], isLoading, error } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => apiService.getCertifications(),
  });

  const certificationCards = certifications.map((certification, index) => {
    const sigle = getLabel(certification.sigle);
    const title = getLabel(certification.title) || sigle || 'Certification';
    const details = [
      { label: 'Domaine', value: getLabel(certification.domaine) },
      {
        label: 'Niveau',
        value: getLabel(certification.niveauSortie || certification.niveauEntree),
      },
      { label: 'Durée', value: getLabel(certification.duree) },
      { label: 'Modalité', value: getLabel(certification.modalite) },
    ].filter((detail) => detail.value);

    return {
      id: String(certification._id || certification.id || `${title}-${index}`),
      opportunity: {
        title,
        company: getLabel(certification.organisme) || 'Organisme non précisé',
        type: 'Certification',
        description: getLabel(certification.description),
        tags: sigle ? [sigle] : [],
      },
      details,
    };
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {certificationCards.map(({ id, opportunity, details }) => (
              <OpportunityCard
                key={id}
                opportunity={opportunity}
                footerContent={details.length > 0 ? (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-100 pt-4 text-xs">
                    {details.map(({ label, value }) => (
                      <div key={label} className="min-w-0">
                        <dt className="font-medium text-gray-500">{label}</dt>
                        <dd className="truncate text-gray-700" title={value}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
