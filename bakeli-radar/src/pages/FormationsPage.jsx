import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { OpportunityCard } from '../components/OpportunityCard';
import { apiService } from '../services/api';

const PAGE_SIZE = 12;

const FILTER_FIELDS = {
  category: ['nature'],
  type: ['type'],
  domain: ['domaine'],
  level: ['niveauSortie', 'niveauEntree'],
  region: ['lieu'],
  modality: ['modalite'],
  duration: ['duree', 'volumeHoraire'],
  organization: ['organisme'],
  status: ['statutVerification'],
};

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

const getFieldValues = (certification, fields) =>
  fields.flatMap((field) => {
    const value = certification[field];
    if (Array.isArray(value)) return value.map(getLabel).filter(Boolean);
    const label = getLabel(value);
    return label ? [label] : [];
  });

const getCostValues = (certification) =>
  ['cout', 'coût', 'prix', 'cost', 'price', 'frais', 'fraisInscription']
    .map((field) => certification[field])
    .map(getLabel)
    .filter(Boolean);

const getCostCategory = (certification) => {
  const costs = getCostValues(certification);
  if (!costs.length) return 'unknown';
  if (costs.some((cost) => {
    const normalized = cost.toLocaleLowerCase('fr');
    const numericText = normalized.replace(/[^\d,.-]/g, '').replace(',', '.');
    return /\b(gratuit|free)\b/.test(normalized) ||
      (numericText !== '' && Number(numericText) === 0);
  })) {
    return 'free';
  }
  return 'paid';
};

const formatLabel = (value) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('fr'));

const getOptions = (certifications, fields) =>
  [...new Set(certifications.flatMap((item) => getFieldValues(item, fields)))]
    .sort((a, b) => a.localeCompare(b, 'fr'));

const FILTER_CONFIG = [
  { key: 'type', label: 'Type', fields: FILTER_FIELDS.type },
  { key: 'domain', label: 'Domaine', fields: FILTER_FIELDS.domain },
  { key: 'level', label: 'Niveau', fields: FILTER_FIELDS.level },
  { key: 'region', label: 'Région / lieu', fields: FILTER_FIELDS.region },
  { key: 'modality', label: 'Modalité', fields: FILTER_FIELDS.modality },
  { key: 'duration', label: 'Durée', fields: FILTER_FIELDS.duration },
  { key: 'organization', label: 'Organisme', fields: FILTER_FIELDS.organization },
  { key: 'status', label: 'Statut de vérification', fields: FILTER_FIELDS.status },
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

export const FormationsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: certifications = [], isLoading, error } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => apiService.getCertifications(),
  });

  const options = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(FILTER_FIELDS).map(([key, fields]) => [
          key,
          getOptions(certifications, fields),
        ])
      ),
    [certifications]
  );

  const filteredCertifications = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase('fr');

    return certifications.filter((certification) => {
      const matchesSearch =
        !search ||
        [
          ...getFieldValues(certification, [
            'title',
            'sigle',
            'description',
            'lieu',
            'duree',
            'volumeHoraire',
            'conditionsAcces',
            'objectifs',
            'publicCible',
          ]),
          ...Object.values(FILTER_FIELDS).flatMap((fields) =>
            getFieldValues(certification, fields)
          ),
        ].some((value) => value.toLocaleLowerCase('fr').includes(search));

      const matchesFields = FILTER_CONFIG.every(({ key, fields }) =>
        !filters[key] ||
        (filters[key] === '__missing__'
          ? getFieldValues(certification, fields).length === 0
          : getFieldValues(certification, fields).includes(filters[key]))
      );
      const matchesCategory =
        !filters.category ||
        (filters.category === '__missing__'
          ? getFieldValues(certification, FILTER_FIELDS.category).length === 0
          : getFieldValues(certification, FILTER_FIELDS.category).includes(filters.category));
      const matchesCost =
        !filters.cost || getCostCategory(certification) === filters.cost;

      return matchesSearch && matchesFields && matchesCategory && matchesCost;
    });
  }, [certifications, filters]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const handleResetFilters = () => setFilters(INITIAL_FILTERS);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const visibleCertifications = filteredCertifications.slice(0, visibleCount);

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
          Recherchez et filtrez les formations et certifications publiées dans l’annuaire national.
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

          {options.category.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Catégories
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!filters.category}
                  onClick={() => setFilters((current) => ({ ...current, category: '' }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    !filters.category
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  Toutes
                </button>
                {options.category.map((category) => (
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
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filters.category === category
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                    }`}
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
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filters.category === '__missing__'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                  }`}
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
                  {options[key].map((option) => (
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
          Chargement des formations et certifications…
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

      {!isLoading && !error && (
        <>
          <p aria-live="polite" className="text-sm text-gray-600">
            {filteredCertifications.length} résultat{filteredCertifications.length > 1 ? 's' : ''}
            {hasActiveFilters ? ' correspondant à votre recherche' : ''}
          </p>

          {filteredCertifications.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm">
              <p className="font-semibold text-gray-800">Aucune formation trouvée</p>
              <p className="mt-1 text-sm">
                Essayez de modifier vos critères ou de réinitialiser les filtres.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleCertifications.map((certification, index) => {
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
                    {
                      label: 'Vérification',
                      value: getLabel(certification.statutVerification),
                    },
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
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/formations/${encodeURIComponent(certification._id || certification.id)}`)
                            }
                            className="w-full rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          >
                            Consulter la fiche
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </div>

              {visibleCount < filteredCertifications.length && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    Afficher plus ({filteredCertifications.length - visibleCount} restante
                    {filteredCertifications.length - visibleCount > 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};
