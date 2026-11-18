import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { OpportunityCard } from '../components/OpportunityCard';
import { apiService, trackAnnuaireEvent } from '../services/api';
import { useCompareList } from '../services/compareStore';

// Catalogue Formations & Certifications alimenté par le backend Wagan (/api/annuaire/).
// La recherche, les filtres et la pagination sont faits côté serveur.
// Activé uniquement si VITE_ANNUAIRE_API_URL est défini (voir App.jsx).

const PAGE_SIZE = 12;

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

const getCostValues = (certification) =>
  ['cout', 'coût', 'prix', 'cost', 'price', 'frais', 'fraisInscription']
    .map((field) => certification[field])
    .map(getLabel)
    .filter(Boolean);

const formatLabel = (value) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('fr'));

const FILTER_CONFIG = [
  { key: 'type', label: 'Type' },
  { key: 'domain', label: 'Domaine' },
  { key: 'level', label: 'Niveau' },
  { key: 'region', label: 'Région / lieu' },
  { key: 'modality', label: 'Modalité' },
  { key: 'duration', label: 'Durée' },
  { key: 'organization', label: 'Organisme' },
  { key: 'status', label: 'Statut de vérification' },
];

const INITIAL_FILTERS = {
  search: '',
  category: '',
  type: '',
  domain: '',
  level: '',
  region: '',
  modality: '',
  duration: '',
  cost: '',
  organization: '',
  status: '',
};

const EMPTY_FACETS = {};

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const chipClass = (active) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'border-emerald-600 bg-emerald-600 text-white'
      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
  }`;

export const FormationsAnnuairePage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const compare = useCompareList();
  const debouncedSearch = useDebouncedValue(filters.search);

  const serverFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'search')),
    [filters]
  );

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['annuaire-formations', debouncedSearch, serverFilters],
    queryFn: ({ pageParam }) =>
      apiService.getAnnuaireFormations({
        page: pageParam,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        filters: serverFilters,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const facets = data?.pages?.[0]?.facets || EMPTY_FACETS;
  const total = data?.pages?.[0]?.count ?? 0;
  const stale = Boolean(data?.pages?.[0]?.stale);
  const certifications = useMemo(
    () => (data ? data.pages.flatMap((page) => page.results) : []),
    [data]
  );

  // Suivi d'usage anonyme (cahier des charges, section 11)
  useEffect(() => {
    trackAnnuaireEvent('directory_opened');
  }, []);

  const lastTrackedSearch = useRef('');
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (!term) {
      lastTrackedSearch.current = '';
      return;
    }
    if (!data || isPlaceholderData || lastTrackedSearch.current === term) return;
    lastTrackedSearch.current = term;
    trackAnnuaireEvent('formation_search_performed', { resultCount: total });
  }, [debouncedSearch, data, isPlaceholderData, total]);

  const previousFilters = useRef(INITIAL_FILTERS);
  useEffect(() => {
    const previous = previousFilters.current;
    Object.entries(serverFilters).forEach(([key, value]) => {
      if (value && value !== previous[key]) trackAnnuaireEvent('filter_applied', { detail: key });
    });
    previousFilters.current = serverFilters;
  }, [serverFilters]);

  const handleResetFilters = () => setFilters(INITIAL_FILTERS);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const options = (key) => facets[key] || [];

  return (
    <section className="space-y-6 py-2 animate-fadeIn">
      <header>
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
        <Link
          to="/formations/favoris"
          className="mb-3 ml-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          Mes formations enregistrées
        </Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Annuaire ANCPS
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Explorez les formations et certifications
        </h1>
        <p className="mt-2 text-gray-600">
          Recherchez et filtrez les formations et certifications publiées dans l’annuaire national.
          La présence d’un organisme dans l’annuaire ne constitue pas une accréditation officielle.
        </p>
      </header>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Rechercher une formation</span>
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Rechercher un intitulé, une compétence, un organisme…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Réinitialiser
            </button>
          </div>

          {options('category').length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Catégories
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!filters.category}
                  onClick={() => setFilters((current) => ({ ...current, category: '' }))}
                  className={chipClass(!filters.category)}
                >
                  Toutes
                </button>
                {options('category').map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={filters.category === category}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        category: current.category === category ? '' : category,
                      }))
                    }
                    className={chipClass(filters.category === category)}
                  >
                    {category}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={filters.category === '__missing__'}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      category: current.category === '__missing__' ? '' : '__missing__',
                    }))
                  }
                  className={chipClass(filters.category === '__missing__')}
                >
                  Non catégorisées
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            Filtres
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FILTER_CONFIG.map(({ key, label }) => (
              <label key={key} className="relative">
                <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
                <select
                  value={filters[key]}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, [key]: event.target.value }))
                  }
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Tous</option>
                  <option value="__missing__">Non renseigné</option>
                  {options(key).map((option) => (
                    <option key={option} value={option}>
                      {['modality', 'status'].includes(key) ? formatLabel(option) : option}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-gray-400"
                />
              </label>
            ))}
            <label className="relative">
              <span className="mb-1.5 block text-xs font-medium text-gray-600">Coût</span>
              <select
                value={filters.cost}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, cost: event.target.value }))
                }
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Tous</option>
                <option value="free">Gratuit</option>
                <option value="paid">Payant</option>
                <option value="unknown">Non renseigné</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-gray-400"
              />
            </label>
          </div>
        </div>
      </div>

      {isLoading && (
        <p role="status" className="py-12 text-center text-gray-500">
          Chargement des formations et certifications… Le premier chargement peut prendre
          quelques secondes.
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
          <p>{error.message}</p>
          <p className="mt-1 text-sm">
            Le reste de Bakeli Radar fonctionne normalement. Vous pouvez réessayer dans un instant.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Réessayer
          </button>
        </div>
      )}

      {stale && !error && (
        <div role="status" className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          L’annuaire ANCPS est momentanément injoignable : les informations affichées proviennent
          d’une copie enregistrée récemment et peuvent ne pas être à jour.
        </div>
      )}

      {!isLoading && !error && data && (
        <div aria-busy={isFetching && !isFetchingNextPage}>
          <p aria-live="polite" className="mb-4 text-sm text-gray-600">
            {total} résultat{total > 1 ? 's' : ''}
            {hasActiveFilters ? ' correspondant à votre recherche' : ''}
            {isPlaceholderData ? ' — mise à jour…' : ''}
          </p>

          {total === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm">
              <p className="font-semibold text-gray-800">Aucune formation trouvée</p>
              <p className="mt-1 text-sm">
                Essayez de modifier vos critères ou de réinitialiser les filtres.
              </p>
              {options('domain').length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="text-sm text-gray-500">Suggestions :</span>
                  {options('domain').slice(0, 4).map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setFilters({ ...INITIAL_FILTERS, domain })}
                      className={chipClass(false)}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {certifications.map((certification, index) => {
                  const sigle = getLabel(certification.sigle);
                  const title = getLabel(certification.title) || sigle || 'Formation';
                  const details = [
                    { label: 'Domaine', value: getLabel(certification.domaine) },
                    {
                      label: 'Niveau',
                      value: getLabel(certification.niveauSortie || certification.niveauEntree),
                    },
                    { label: 'Durée', value: getLabel(certification.duree || certification.volumeHoraire) },
                    { label: 'Modalité', value: formatLabel(getLabel(certification.modalite)) },
                    { label: 'Lieu', value: getLabel(certification.lieu) },
                    { label: 'Coût', value: getCostValues(certification)[0] },
                    { label: 'Vérification', value: getLabel(certification.statutVerification) },
                  ].filter((detail) => detail.value);

                  return (
                    <OpportunityCard
                      key={certification._id || certification.id || `${title}-${index}`}
                      opportunity={{
                        title,
                        company: getLabel(certification.organisme) || 'Organisme non précisé',
                        type: getLabel(certification.type) || 'Formation',
                        description: getLabel(certification.description),
                        tags: [
                          sigle,
                          getLabel(certification.domaine),
                          getLabel(certification.niveauSortie || certification.niveauEntree),
                        ].filter(Boolean),
                      }}
                      footerContent={
                        <div className="border-t border-gray-100 pt-4">
                          {details.length > 0 && (
                            <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                              {details.map(({ label, value }) => (
                                <div key={label} className="min-w-0">
                                  <dt className="font-medium text-gray-500">{label}</dt>
                                  <dd className="truncate text-gray-700" title={value}>
                                    {value}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/formations/${encodeURIComponent(certification._id || certification.id)}`)
                              }
                              className="flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            >
                              Consulter la fiche
                            </button>
                            <button
                              type="button"
                              onClick={() => compare.toggle(certification._id || certification.id)}
                              aria-pressed={compare.has(certification._id || certification.id)}
                              disabled={!compare.has(certification._id || certification.id) && compare.isFull}
                              title={
                                !compare.has(certification._id || certification.id) && compare.isFull
                                  ? 'Vous pouvez comparer 3 formations au maximum'
                                  : undefined
                              }
                              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                                compare.has(certification._id || certification.id)
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {compare.has(certification._id || certification.id) ? 'Sélectionnée' : 'Comparer'}
                            </button>
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </div>

              {hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
                  >
                    {isFetchingNextPage
                      ? 'Chargement…'
                      : `Afficher plus (${total - certifications.length} restante${
                          total - certifications.length > 1 ? 's' : ''
                        })`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {compare.ids.length > 0 && (
        <div
          role="region"
          aria-label="Formations à comparer"
          className="sticky bottom-4 z-10 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-white p-3 shadow-lg"
        >
          <p className="text-sm text-gray-700">
            {compare.ids.length} formation{compare.ids.length > 1 ? 's' : ''} sélectionnée
            {compare.ids.length > 1 ? 's' : ''} (3 maximum)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={compare.clear}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Vider
            </button>
            {compare.ids.length >= 2 ? (
              <Link
                to="/formations/comparer"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Comparer
              </Link>
            ) : (
              <span className="text-xs text-gray-500">Choisissez-en au moins 2</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
