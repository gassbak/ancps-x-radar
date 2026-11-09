import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Link,
    useSearchParams
} from "react-router-dom";

import {
    Search,
    SlidersHorizontal,
    X
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Badge from "../components/ui/Badge";

import useCertifications from "../hooks/useCertifications";

import { trackAnalytics } from "../services/analytics";

export default function Annuaire() {
    const [search, setSearch] = useState("");

    const [lastSearch, setLastSearch] =
        useState("");

    const [selectedDomains, setSelectedDomains] =
        useState([]);

    const [selectedLevels, setSelectedLevels] =
        useState([]);

    const [mobileFiltersOpen, setMobileFiltersOpen] =
        useState(false);

    const [searchParams] =
        useSearchParams();

    const domaineFromUrl =
        searchParams.get("domaine");

    const {
        certifications,
        loading
    } = useCertifications(search);

    /*
     * ==============================
     * ANALYTICS - VISITE
     * ==============================
     */

    const visitTracked =
        useRef(false);

    useEffect(() => {
        if (visitTracked.current) {
            return;
        }

        visitTracked.current = true;

        trackAnalytics("visit").catch(
            (error) => {
                console.error(
                    "Erreur Analytics visite :",
                    error
                );
            }
        );
    }, []);

    /*
     * ==============================
     * DOMAINES
     * ==============================
     */

    const domains = [
        ...new Set(
            certifications
                .map(
                    (certification) =>
                        certification.sector
                )
                .filter(Boolean)
        )
    ];

    /*
     * ==============================
     * NIVEAUX
     * ==============================
     */

    const levels = [
        ...new Set(
            certifications
                .map(
                    (certification) =>
                        certification.niveau
                )
                .filter(Boolean)
        )
    ];

    /*
     * ==============================
     * FILTRAGE
     * ==============================
     */

    const filteredCertifications =
        certifications.filter(
            (certification) => {
                const domainOk =
                    domaineFromUrl
                        ? certification.sector ===
                          domaineFromUrl
                        : selectedDomains.length === 0 ||
                          selectedDomains.includes(
                              certification.sector
                          );

                const levelOk =
                    selectedLevels.length === 0 ||
                    selectedLevels.includes(
                        certification.niveau
                    );

                return (
                    domainOk &&
                    levelOk
                );
            }
        );

    /*
     * ==============================
     * RECHERCHE
     * ==============================
     */

    const handleSearch = async (
        event
    ) => {
        event.preventDefault();

        const query =
            search.trim();

        if (!query) {
            return;
        }

        /*
         * On mémorise la recherche
         * réellement validée par
         * l'utilisateur.
         */
        setLastSearch(query);

        /*
         * Analytics recherche
         */
        try {
            await trackAnalytics(
                "search",
                {
                    query
                }
            );
        } catch (error) {
            console.error(
                "Erreur Analytics recherche :",
                error
            );
        }
    };

    /*
     * ==============================
     * RECHERCHE SANS RÉSULTAT
     * ==============================
     *
     * On attend que le chargement
     * soit terminé avant de vérifier.
     */

    useEffect(() => {
        if (!lastSearch) {
            return;
        }

        if (loading) {
            return;
        }

        if (
            filteredCertifications.length !== 0
        ) {
            return;
        }

        const timer =
            setTimeout(async () => {
                try {
                    await trackAnalytics(
                        "no_result",
                        {
                            query: lastSearch
                        }
                    );
                } catch (error) {
                    console.error(
                        "Erreur Analytics aucun résultat :",
                        error
                    );
                }
            }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [
        lastSearch,
        loading,
        filteredCertifications.length
    ]);

    /*
     * ==============================
     * FILTRE DOMAINE
     * ==============================
     */

    const toggleDomain = (
        domain
    ) => {
        setSelectedDomains(
            (current) =>
                current.includes(domain)
                    ? current.filter(
                          (item) =>
                              item !== domain
                      )
                    : [
                          ...current,
                          domain
                      ]
        );
    };

    /*
     * ==============================
     * FILTRE NIVEAU
     * ==============================
     */

    const toggleLevel = (
        level
    ) => {
        setSelectedLevels(
            (current) =>
                current.includes(level)
                    ? current.filter(
                          (item) =>
                              item !== level
                      )
                    : [
                          ...current,
                          level
                      ]
        );
    };

    /*
     * ==============================
     * RESET FILTRES
     * ==============================
     */

    const resetFilters = () => {
        setSelectedDomains([]);
        setSelectedLevels([]);
    };

    /*
     * ==============================
     * COMPTEUR FILTRES
     * ==============================
     */

    const filtersCount =
        selectedDomains.length +
        selectedLevels.length;

    return (
        <div className="min-h-screen bg-slate-50">

            <Navbar />

            <main className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">

                {/* =========================
                    EN-TÊTE
                ========================== */}

                <div className="mt-8">
                    <div className="max-w-3xl">

                        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                            ANCPS
                        </p>

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mt-3">
                            Annuaire des certifications
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                            Recherchez et consultez les
                            certifications professionnelles
                            disponibles au Sénégal.
                        </p>

                    </div>
                </div>

                {/* =========================
                    BARRE DE RECHERCHE
                ========================== */}

                <form
                    onSubmit={handleSearch}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >

                    <div className="flex flex-col gap-3 sm:flex-row">

                        <div className="relative flex-1">

                            <Search
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Rechercher une certification, un métier, une compétence..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                            />

                        </div>

                        <button
                            type="submit"
                            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Rechercher
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setMobileFiltersOpen(
                                    !mobileFiltersOpen
                                )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:hidden"
                        >

                            <SlidersHorizontal
                                size={18}
                            />

                            Filtres

                            {filtersCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs text-white">
                                    {filtersCount}
                                </span>
                            )}

                        </button>

                    </div>
                </form>

                {/* =========================
                    CONTENU
                ========================== */}

                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

                    {/* =========================
                        SIDEBAR DESKTOP
                    ========================== */}

                    <aside className="hidden lg:block">

                        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-2">

                                    <SlidersHorizontal
                                        size={18}
                                        className="text-emerald-600"
                                    />

                                    <h2 className="font-bold text-slate-900">
                                        Filtres
                                    </h2>

                                </div>

                                {filtersCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={
                                            resetFilters
                                        }
                                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Réinitialiser
                                    </button>
                                )}

                            </div>

                            {/* DOMAINES */}

                            <div className="mt-6">

                                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                    Domaine
                                </h3>

                                <div className="space-y-2">

                                    {domains.map(
                                        (domain) => (
                                            <label
                                                key={
                                                    domain
                                                }
                                                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-slate-600 transition hover:bg-slate-50"
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={selectedDomains.includes(
                                                        domain
                                                    )}
                                                    onChange={() =>
                                                        toggleDomain(
                                                            domain
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />

                                                <span>
                                                    {
                                                        domain
                                                    }
                                                </span>

                                            </label>
                                        )
                                    )}

                                </div>

                            </div>

                            {/* NIVEAUX */}

                            <div className="mt-7 border-t border-slate-100 pt-6">

                                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                    Niveau
                                </h3>

                                <div className="space-y-2">

                                    {levels.map(
                                        (level) => (
                                            <label
                                                key={
                                                    level
                                                }
                                                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-slate-600 transition hover:bg-slate-50"
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={selectedLevels.includes(
                                                        level
                                                    )}
                                                    onChange={() =>
                                                        toggleLevel(
                                                            level
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />

                                                <span>
                                                    {
                                                        level
                                                    }
                                                </span>

                                            </label>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </aside>

                    {/* =========================
                        FILTRES MOBILE
                    ========================== */}

                    {mobileFiltersOpen && (
                        <div className="lg:hidden">

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <h2 className="font-bold text-slate-900">
                                        Filtres
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMobileFiltersOpen(
                                                false
                                            )
                                        }
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                    >
                                        <X size={20} />
                                    </button>

                                </div>

                                {/* DOMAINES */}

                                <div className="mt-5">

                                    <h3 className="mb-3 text-sm font-semibold">
                                        Domaine
                                    </h3>

                                    <div className="space-y-2">

                                        {domains.map(
                                            (domain) => (
                                                <label
                                                    key={
                                                        domain
                                                    }
                                                    className="flex items-center gap-3 rounded-lg p-2 text-sm"
                                                >

                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDomains.includes(
                                                            domain
                                                        )}
                                                        onChange={() =>
                                                            toggleDomain(
                                                                domain
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                    />

                                                    {
                                                        domain
                                                    }

                                                </label>
                                            )
                                        )}

                                    </div>

                                </div>

                                {/* NIVEAUX */}

                                <div className="mt-6 border-t border-slate-100 pt-5">

                                    <h3 className="mb-3 text-sm font-semibold">
                                        Niveau
                                    </h3>

                                    <div className="space-y-2">

                                        {levels.map(
                                            (level) => (
                                                <label
                                                    key={
                                                        level
                                                    }
                                                    className="flex items-center gap-3 rounded-lg p-2 text-sm"
                                                >

                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLevels.includes(
                                                            level
                                                        )}
                                                        onChange={() =>
                                                            toggleLevel(
                                                                level
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                    />

                                                    {
                                                        level
                                                    }

                                                </label>
                                            )
                                        )}

                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        resetFilters
                                    }
                                    className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                                >
                                    Réinitialiser les filtres
                                </button>

                            </div>

                        </div>
                    )}

                    {/* =========================
                        RÉSULTATS
                    ========================== */}

                    <section>

                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                            <div>

                                <p className="text-sm text-slate-500">

                                    {loading
                                        ? "Chargement..."
                                        : `${filteredCertifications.length} certification${
                                              filteredCertifications.length >
                                              1
                                                  ? "s"
                                                  : ""
                                          } trouvée${
                                              filteredCertifications.length >
                                              1
                                                  ? "s"
                                                  : ""
                                          }`}

                                </p>

                                {domaineFromUrl && (
                                    <p className="mt-1 text-xs text-emerald-700">

                                        Domaine :{" "}

                                        <strong>
                                            {
                                                domaineFromUrl
                                            }
                                        </strong>

                                    </p>
                                )}

                            </div>

                            {filtersCount > 0 && (
                                <button
                                    type="button"
                                    onClick={
                                        resetFilters
                                    }
                                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700"
                                >
                                    Effacer les filtres

                                    <X size={14} />
                                </button>
                            )}

                        </div>

                        {/* CHARGEMENT */}

                        {loading && (
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                                {[1, 2, 3, 4, 5, 6].map(
                                    (item) => (
                                        <div
                                            key={
                                                item
                                            }
                                            className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                                        />
                                    )
                                )}

                            </div>
                        )}

                        {/* AUCUN RÉSULTAT */}

                        {!loading &&
                            filteredCertifications.length ===
                                0 && (

                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

                                    <Search
                                        size={36}
                                        className="mx-auto text-slate-300"
                                    />

                                    <h2 className="mt-4 text-lg font-bold text-slate-900">
                                        Aucune certification trouvée
                                    </h2>

                                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                        Essayez avec un autre mot-clé
                                        ou modifiez vos filtres.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setLastSearch("");
                                            resetFilters();
                                        }}
                                        className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Réinitialiser
                                    </button>

                                </div>
                            )}

                        {/* CARTES */}

                        {!loading &&
                            filteredCertifications.length >
                                0 && (

                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                                    {filteredCertifications.map(
                                        (
                                            certification
                                        ) => (

                                            <Link
                                                key={
                                                    certification.id
                                                }
                                                to={`/certification/${certification.id}`}
                                                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                                            >

                                                {/* BADGES */}

                                                <div className="flex flex-wrap gap-2">

                                                    {certification.niveau && (
                                                        <Badge>
                                                            {
                                                                certification.niveau
                                                            }
                                                        </Badge>
                                                    )}

                                                    {certification.type && (
                                                        <Badge>
                                                            {
                                                                certification.type
                                                            }
                                                        </Badge>
                                                    )}

                                                </div>

                                                {/* TITRE */}

                                                <h2 className="mt-4 line-clamp-2 text-lg font-bold text-slate-900 transition group-hover:text-emerald-700">
                                                    {
                                                        certification.title
                                                    }
                                                </h2>

                                                {/* SIGLE */}

                                                {certification.sigle && (
                                                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                                        {
                                                            certification.sigle
                                                        }
                                                    </p>
                                                )}

                                                {/* DESCRIPTION */}

                                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                                                    {
                                                        certification.description ||
                                                        "Aucune description disponible."
                                                    }
                                                </p>

                                                {/* INFORMATIONS */}

                                                <div className="mt-auto pt-5">

                                                    {certification.sector && (
                                                        <div className="border-t border-slate-100 pt-4">

                                                            <p className="text-xs text-slate-400">
                                                                Domaine
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                                {
                                                                    certification.sector
                                                                }
                                                            </p>

                                                        </div>
                                                    )}

                                                    {certification.modalite && (
                                                        <div className="mt-3">

                                                            <p className="text-xs text-slate-400">
                                                                Modalité
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                                {
                                                                    certification.modalite
                                                                }
                                                            </p>

                                                        </div>
                                                    )}

                                                    <div className="mt-4 text-sm font-semibold text-emerald-700">
                                                        Voir la certification →
                                                    </div>

                                                </div>

                                            </Link>

                                        )
                                    )}

                                </div>
                            )}

                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}