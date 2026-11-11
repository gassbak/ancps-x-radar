import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';

const getLabel = (value) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (value && typeof value === 'object') {
    const label = value.nom || value.name || value.title;
    return typeof label === 'string' || typeof label === 'number'
      ? String(label).trim()
      : '';
  }
  return '';
};

const getDisplayValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(getLabel).filter(Boolean).join(', ');
  }
  return getLabel(value);
};

const DetailField = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 p-4">
    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-800">
      {getDisplayValue(value) || 'Non renseigné'}
    </dd>
  </div>
);

export const FormationDetailPage = () => {
  const { id } = useParams();
  const { data: certification, isLoading, error } = useQuery({
    queryKey: ['certification', id],
    queryFn: () => apiService.getCertification(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <p role="status" className="py-16 text-center text-gray-500">
        Chargement de la fiche…
      </p>
    );
  }

  if (error || !certification) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-8">
        <Link
          to="/formations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour au catalogue
        </Link>
        <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          {error?.message || 'Cette fiche est introuvable.'}
        </div>
      </div>
    );
  }

  const title = getLabel(certification.title) || getLabel(certification.sigle) || 'Formation';
  const organization = getLabel(certification.organisme);
  const website = certification.organisme?.siteWeb;
  const sourceUrl = certification.sourceUrl;
  const safeWebsite = typeof website === 'string' && /^https?:\/\//i.test(website)
    ? website
    : '';
  const safeSourceUrl = typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl)
    ? sourceUrl
    : '';
  const cost = ['cout', 'coût', 'prix', 'cost', 'price', 'frais', 'fraisInscription']
    .map((field) => certification[field])
    .map(getLabel)
    .find(Boolean);

  const fields = [
    { label: 'Type', value: certification.type },
    { label: 'Catégorie', value: certification.nature },
    { label: 'Domaine', value: certification.domaine },
    { label: 'Sous-domaine', value: certification.sousDomaine },
    { label: 'Niveau d’entrée', value: certification.niveauEntree },
    { label: 'Niveau de sortie', value: certification.niveauSortie },
    { label: 'Durée', value: certification.duree || certification.volumeHoraire },
    { label: 'Modalité', value: certification.modalite },
    { label: 'Région / lieu', value: certification.lieu },
    { label: 'Coût', value: cost },
    { label: 'Public cible', value: certification.publicCible },
    { label: 'Conditions d’accès', value: certification.conditionsAcces },
    { label: 'Objectifs', value: certification.objectifs },
    { label: 'Compétences visées', value: [
      ...(Array.isArray(certification.competences) ? certification.competences : []),
      ...(Array.isArray(certification.competencesLibres) ? certification.competencesLibres : []),
    ] },
    { label: 'Métiers associés', value: certification.metiers },
    { label: 'Établissements', value: certification.etablissements },
    { label: 'Statut de vérification', value: certification.statutVerification },
    { label: 'Dernière vérification', value: certification.sourceLastVerifiedAt },
  ];

  return (
    <article className="mx-auto max-w-4xl space-y-6 py-2 animate-fadeIn">
      <Link
        to="/formations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Retour au catalogue
      </Link>

      <header className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {getLabel(certification.type) || 'Formation / certification'}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          {organization || 'Organisme non renseigné'}
        </p>
        {certification.description && (
          <section className="mt-6 border-t border-gray-100 pt-5">
            <h2 className="font-bold text-gray-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-600">
              {certification.description}
            </p>
          </section>
        )}
        {(safeWebsite || safeSourceUrl) && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            {safeWebsite && (
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Site de l’organisme
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            )}
            {safeSourceUrl && (
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Voir la source
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-gray-900">Informations sur la formation</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <DetailField key={label} label={label} value={value} />
          ))}
        </dl>
      </section>
    </article>
  );
};
