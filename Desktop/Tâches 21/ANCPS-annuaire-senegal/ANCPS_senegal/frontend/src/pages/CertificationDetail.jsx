import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Link,
    useParams
} from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Badge from "../components/ui/Badge";

import { api } from "../services/api";
import { trackAnalytics } from "../services/analytics";

import {
    downloadCertificationPDF
} from "../utils/generateCertificationPDF";

export default function CertificationDetail() {
    const { id } = useParams();

    const [certification, setCertification] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
     * Évite de compter deux fois la même
     * consultation en développement avec
     * React StrictMode.
     */
    const viewTracked = useRef(false);

    useEffect(() => {
        async function loadCertification() {
            try {
                const data =
                    await api.getCertification(id);

                setCertification(data);

                /*
                 * ==============================
                 * ANALYTICS
                 * ==============================
                 */

                if (!viewTracked.current) {
                    viewTracked.current = true;

                    try {
                        await trackAnalytics(
                            "view",
                            {
                                certification: id
                            }
                        );
                    } catch (analyticsError) {
                        /*
                         * Une erreur Analytics ne doit
                         * jamais empêcher l'utilisateur
                         * de consulter la certification.
                         */
                        console.error(
                            "Erreur Analytics consultation :",
                            analyticsError
                        );
                    }
                }

            } catch (error) {
                console.error(error);

                setError(
                    "Impossible de charger cette certification."
                );
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadCertification();
        }
    }, [id]);

    /*
     * ==============================
     * CHARGEMENT
     * ==============================
     */

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="min-h-screen bg-[#F8FAFC] px-6 pt-32">
                    <div className="mx-auto max-w-[1180px]">
                        <p className="text-slate-500">
                            Chargement de la certification...
                        </p>
                    </div>
                </main>
            </>
        );
    }

    /*
     * ==============================
     * ERREUR
     * ==============================
     */

    if (error || !certification) {
        return (
            <>
                <Navbar />

                <main className="min-h-screen bg-[#F8FAFC] px-6 pt-32">
                    <div className="mx-auto max-w-[1180px]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-8">

                            <h1 className="text-2xl font-bold text-slate-900">
                                Certification introuvable
                            </h1>

                            <p className="mt-3 text-slate-500">
                                {error}
                            </p>

                            <Link
                                to="/annuaire"
                                className="mt-6 inline-block font-semibold text-emerald-700"
                            >
                                ← Retour à l'annuaire
                            </Link>

                        </div>
                    </div>
                </main>
            </>
        );
    }

    /*
     * ==============================
     * INFORMATIONS
     * ==============================
     */

    const organisme =
        certification.organisme?.nom ||
        "Organisme non renseigné";

    const niveau =
        certification.niveau ||
        certification.niveauSortie?.nom ||
        "Non renseigné";

    const type =
        certification.type?.nom ||
        certification.nature?.nom ||
        "Certification";

    const domaine =
        certification.domaine?.nom ||
        certification.domaine ||
        certification.sector ||
        "Non renseigné";

    const metiers =
        getNames(
            certification.metiers
        );

    const etablissements =
        getNames(
            certification.etablissements
        );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">

            <Navbar />

            {/* =========================
                HERO
            ========================== */}

            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-[1180px] px-6 pb-14 pt-32">

                    <Link
                        to="/annuaire"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
                    >
                        ← Retour à l'annuaire
                    </Link>

                    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

                        {/* INFORMATIONS */}

                        <div className="max-w-[850px]">

                            <div className="flex flex-wrap gap-3">

                                <Badge variant="green">
                                    {type}
                                </Badge>

                                <Badge variant="blue">
                                    {niveau}
                                </Badge>

                                {certification.statutVerification?.nom && (
                                    <Badge variant="gray">
                                        {
                                            certification
                                                .statutVerification
                                                .nom
                                        }
                                    </Badge>
                                )}

                            </div>

                            <h1 className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight text-slate-950 md:text-5xl">
                                {certification.title}
                            </h1>

                            <p className="mt-5 text-lg text-slate-600">
                                {organisme}

                                <span>
                                    {" "}Sénégal
                                </span>
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-slate-500">

                                {certification.sigle && (
                                    <span>
                                        Sigle :{" "}

                                        <strong className="text-slate-700">
                                            {
                                                certification.sigle
                                            }
                                        </strong>
                                    </span>
                                )}

                            </div>
                        </div>

                        {/* BOUTON PDF */}

                        <div className="shrink-0 lg:pt-1">

                            <button
                                onClick={() =>
                                    downloadCertificationPDF(
                                        certification
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#053C2E]"
                            >
                                <span>
                                    ↓
                                </span>

                                Télécharger le PDF
                            </button>

                        </div>

                    </div>
                </div>
            </section>

            {/* =========================
                CONTENU
            ========================== */}

            <main className="mx-auto max-w-[1180px] px-6 py-12">

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">

                    {/* =====================
                        COLONNE PRINCIPALE
                    ====================== */}

                    <div className="space-y-6">

                        <InfoSection title="Présentation">
                            <p>
                                {
                                    certification.description ||
                                    "Aucune description disponible pour cette certification."
                                }
                            </p>
                        </InfoSection>

                        <InfoSection title="Objectifs de la formation">
                            <p>
                                {
                                    certification.objectifs ||
                                    "Les objectifs de cette certification ne sont pas encore renseignés."
                                }
                            </p>
                        </InfoSection>

                        {/* COMPETENCES */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-7 md:p-8">

                            <h2 className="text-2xl font-bold text-slate-950">
                                Blocs de compétences
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Compétences associées à cette certification.
                            </p>

                            {certification.competencesLibres?.length ? (

                                <div className="mt-6 space-y-3">

                                    {certification.competencesLibres.map(
                                        (
                                            competence,
                                            index
                                        ) => (
                                            <div
                                                key={index}
                                                className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                                            >

                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                                    {index + 1}
                                                </span>

                                                <p className="pt-1 text-sm leading-6 text-slate-700">
                                                    {competence}
                                                </p>

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                                    Aucun bloc de compétences renseigné.
                                </p>

                            )}

                        </section>

                        {/* INFORMATIONS COMPLEMENTAIRES */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-7 md:p-8">

                            <h2 className="text-2xl font-bold text-slate-950">
                                Informations complémentaires
                            </h2>

                            <div className="mt-6 divide-y divide-slate-200">

                                <InfoRow
                                    label="Sigle"
                                    value={
                                        certification.sigle
                                    }
                                />

                                <InfoRow
                                    label="Domaine"
                                    value={domaine}
                                />

                                <InfoRow
                                    label="Métiers associés"
                                    value={metiers}
                                />

                                <InfoRow
                                    label="Établissements"
                                    value={
                                        etablissements
                                    }
                                />

                            </div>

                        </section>

                    </div>

                    {/* =====================
                        SIDEBAR
                    ====================== */}

                    <aside className="lg:relative">

                        <div className="lg:sticky lg:top-24">

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                                <div className="border-b border-slate-200 px-6 py-5">

                                    <h2 className="text-lg font-bold text-slate-950">
                                        Informations clés
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Les principales informations de la certification.
                                    </p>

                                </div>

                                <div className="px-6">

                                    <SideInfo
                                        label="Niveau"
                                        value={niveau}
                                    />

                                    <SideInfo
                                        label="Type"
                                        value={type}
                                    />

                                    <SideInfo
                                        label="Durée"
                                        value={
                                            certification.duree ||
                                            "Non renseignée"
                                        }
                                    />

                                    <SideInfo
                                        label="Modalité"
                                        value={
                                            certification.modalite ||
                                            "Non renseignée"
                                        }
                                    />

                                    <SideInfo
                                        label="Organisme certificateur"
                                        value={organisme}
                                    />

                                    <SideInfo
                                        label="Domaine"
                                        value={domaine}
                                    />

                                    <SideInfo
                                        label="Pays"
                                        value="Sénégal"
                                    />

                                </div>

                            </div>

                            {/* PDF CARD */}

                            <div className="mt-5 rounded-2xl bg-[#064E3B] p-6 text-white">

                                <p className="text-sm font-semibold">
                                    Besoin de conserver cette fiche ?
                                </p>

                                <p className="mt-2 text-sm leading-6 text-emerald-50">
                                    Téléchargez les informations de cette certification au format PDF.
                                </p>

                                <button
                                    onClick={() =>
                                        downloadCertificationPDF(
                                            certification
                                        )
                                    }
                                    className="mt-5 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#064E3B] transition hover:bg-emerald-50"
                                >
                                    Télécharger le PDF
                                </button>

                            </div>

                        </div>

                    </aside>

                </div>

            </main>

            <Footer />

        </div>
    );
}

/* =========================
   SECTION
========================= */

function InfoSection({
    title,
    children
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-7 md:p-8">

            <h2 className="text-2xl font-bold text-slate-950">
                {title}
            </h2>

            <div className="mt-5 text-[15px] leading-7 text-slate-600">
                {children}
            </div>

        </section>
    );
}

/* =========================
   LIGNE INFORMATIONS
========================= */

function InfoRow({
    label,
    value
}) {
    return (
        <div className="py-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
                {value || "Non renseigné"}
            </p>

        </div>
    );
}

/* =========================
   SIDEBAR
========================= */

function SideInfo({
    label,
    value
}) {
    return (
        <div className="border-b border-slate-200 py-5 last:border-0">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1.5 text-sm font-medium leading-6 text-slate-800">
                {value || "Non renseigné"}
            </p>

        </div>
    );
}

/* =========================
   LISTES
========================= */

function getNames(items) {
    if (!items?.length) {
        return "Non renseigné";
    }

    return items
        .map(
            (item) =>
                item.nom || item
        )
        .join(", ");
}