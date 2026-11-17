import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Heart } from 'lucide-react';
import { apiService, isAnnuaireBackendEnabled, trackAnnuaireEvent } from '../services/api';
import { useCompareList } from '../services/compareStore';

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

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

export const FormationDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const loggedIn = apiService.isLoggedIn();
  const compare = useCompareList();

  const { data: certification, isLoading, error } = useQuery({
    queryKey: ['certification', id, isAnnuaireBackendEnabled],
    queryFn: () =>
      isAnnuaireBackendEnabled
        ? apiService.getAnnuaireFormation(id)
        : apiService.getCertification(id),
    enabled: Boolean(id),
  });

  // Favoris : uniquement avec le backend Radar et un compte connecté.
  const favoritesEnabled = isAnnuaireBackendEnabled && loggedIn;
  const { data: favorites } = useQuery({
    queryKey: ['annuaire-favorites'],
    queryFn: () => apiService.getAnnuaireFavorites(),
    enabled: favoritesEnabled,
    retry: false,
  });
  const isSaved = Boolean(favorites?.favorites?.some((fav) => fav.formation_id === String(id)));

  const toggleFavorite = useMutation({
    mutationFn: (saved) =>
      saved ? apiService.removeAnnuaireFavorite(id) : apiService.addAnnuaireFavorite(id),
    onSuccess: (_result, wasSaved) => {
      if (!wasSaved) trackAnnuaireEvent('formation_saved', { formationId: id });
      queryClient.invalidateQueries({ queryKey: ['annuaire-favorites'] });
    },
  });

  const loaded = Boolean(certification);
  useEffect(() => {
    if (loaded) trackAnnuaireEvent('formation_viewed', { formationId: id });
  }, [id, loaded]);

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
  const safeWebsite = isHttpUrl(certification.organisme?.siteWeb) ? certification.organisme.siteWeb : '';
  const safeSourceUrl = isHttpUrl(certification.sourceUrl) ? certification.sourceUrl : '';
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

  const trackOutbound = (target) =>
    trackAnnuaireEvent('outbound_registration_clicked', { formationId: id, detail: target });

  return (
    <article className="mx-auto max-w-4xl space-y-6 py-2 animate-fadeIn">
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link
          to="/formations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour au catalogue
        </Link>
        <Link to="/" className="text-sm font-semibold text-gray-600 hover:text-emerald-700">
          Retour au tableau de bord
        </Link>
      </nav>

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
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
          {safeWebsite && (
            <a
              href={safeWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOutbound('website')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Visiter le site officiel
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
          {safeSourceUrl && (
            <a
              href={safeSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOutbound('source')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Voir la source
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => compare.toggle(id)}
            aria-pressed={compare.has(id)}
            disabled={!compare.has(id) && compare.isFull}
            title={!compare.has(id) && compare.isFull ? 'Vous pouvez comparer 3 formations au maximum' : undefined}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {compare.has(id) ? 'Retirer de la comparaison' : 'Comparer'}
          </button>
          {compare.ids.length >= 2 && (
            <Link to="/formations/comparer" className="text-sm font-semibold text-emerald-700 hover:underline">
              Voir la comparaison ({compare.ids.length})
            </Link>
          )}
          {!safeWebsite && !safeSourceUrl && (
            <p className="text-sm text-gray-500">Aucun lien officiel n’est renseigné pour cette fiche.</p>
          )}
          {isAnnuaireBackendEnabled && (
            loggedIn ? (
              <button
                type="button"
                onClick={() => toggleFavorite.mutate(isSaved)}
                disabled={toggleFavorite.isPending || !favorites}
                aria-pressed={isSaved}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                <Heart aria-hidden="true" className={`h-4 w-4 ${isSaved ? 'fill-emerald-600' : ''}`} />
                {isSaved ? 'Enregistrée' : 'Enregistrer'}
              </button>
            ) : (
              <Link
                to={`/connexion?next=${encodeURIComponent(`/formations/${id}`)}`}
                className="text-sm font-semibold text-emerald-700 hover:underline"
              >
                Connectez-vous à Radar pour enregistrer cette formation
              </Link>
            )
          )}
        </div>
        {toggleFavorite.isError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {toggleFavorite.error?.message || 'Action impossible pour le moment.'}
          </p>
        )}
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-gray-900">Informations sur la formation</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <DetailField key={label} label={label} value={value} />
          ))}
        </dl>
        <p className="mt-5 text-xs text-gray-500">
          Les informations « Non renseigné » ne sont pas disponibles dans la source. La présence
          d’un organisme dans l’annuaire ne constitue pas une reconnaissance ou une accréditation
          officielle.
        </p>
      </section>
    </article>
  );
};
