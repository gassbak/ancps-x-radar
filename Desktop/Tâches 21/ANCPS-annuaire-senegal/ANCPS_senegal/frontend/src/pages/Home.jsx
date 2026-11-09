import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import Badge from "../components/ui/Badge";
import useCertifications from "../hooks/useCertifications";


function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="7"
        width="16"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 7V5.5C8 4.67 8.67 4 9.5 4H14.5C15.33 4 16 4.67 16 5.5V7"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 12H20"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M10 12V14H14V12"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      <path
        d="M5 21V4C5 3.45 5.45 3 6 3H18C18.55 3 19 3.45 19 4V21"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M8 7H10M14 7H16M8 11H10M14 11H16M8 15H10M14 15H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M3 21H21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");

  const { certifications, loading } =
    useCertifications(search);
    const sectors = [
    ...new Set(
        certifications
            .map(
                (certification) =>
                    certification.sector
            )
            .filter(Boolean)
    ),
];

  const latestCertifications =
    certifications.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">

      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="bg-[#064E3B] pt-[74px]">
        <div className="mx-auto flex min-h-[460px] max-w-[1220px] flex-col items-center justify-center px-6 pb-10 pt-8 text-center">

          <h1 className="max-w-[950px] text-[44px] font-extrabold leading-[1.08] tracking-[-1.2px] text-white md:text-[50px]">
            Annuaire National des Certifications
            <br />
            Professionnelles du Sénégal
          </h1>

          <p className="mt-6 max-w-[800px] text-[21px] leading-[1.45] text-emerald-50">
            Trouvez la certification reconnue qui boostera
            votre carrière. Une initiative portée par Bakeli.
          </p>

          {/* SEARCH */}
          <div className="mt-9 flex w-full max-w-[673px] rounded-[8px] bg-white p-2">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Ex: Développeur, Marketing, Gestion..."
              className="min-w-0 flex-1 rounded-md border-0 bg-white px-4 text-[16px] text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="button"
              className="flex h-[48px] items-center justify-center gap-2 rounded-[7px] bg-[#FBBF00] px-7 text-[15px] font-bold text-[#073B2D] transition hover:bg-[#F5B900]"
            >
              <SearchIcon />
              Rechercher
            </button>

          </div>
        </div>
      </section>

      {/* =====================================================
          SECTEURS PORTEURS
      ====================================================== */}
      <section className="bg-[#F8FAFC] px-6 py-[54px]">
        <div className="mx-auto max-w-[1220px]">

          <h2 className="text-center text-[25px] font-bold tracking-[-0.4px] text-[#0F172A]">
            Secteurs Porteurs
          </h2>

<div className="mt-[35px] grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

    {sectors.map((sector) => (
        <Link
            key={sector}
            to={`/annuaire?domaine=${encodeURIComponent(sector)}`}
            className="flex h-[135px] items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-md"
        >

            <div className="text-center">

                <div className="mx-auto mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#D1FAE5] text-[#059669]">
                    <BriefcaseIcon />
                </div>

                <p className="text-[15px] font-medium leading-[22px] text-[#0F172A]">
                    {sector}
                </p>

            </div>

        </Link>
    ))}

</div>
        </div>
      </section>

      {/* =====================================================
          DERNIÈRES CERTIFICATIONS
      ====================================================== */}
      <section className="bg-white px-6 py-[56px]">
        <div className="mx-auto max-w-[1260px]">

          <div className="mb-[34px] flex items-center justify-between">

            <div>
              <h2 className="text-[31px] font-bold tracking-[-0.7px] text-[#0F172A]">
                Dernières Certifications
              </h2>

              <p className="mt-2 text-[16px] text-slate-500">
                Les formations récemment ajoutées au répertoire.
              </p>
            </div>

            <Link
              to="/annuaire"
              className="hidden items-center gap-1 text-[15px] font-semibold text-emerald-700 md:flex"
            >
              Voir tout l'annuaire
              <ArrowRight />
            </Link>

          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">
              Chargement...
            </div>
          ) : (
            <div className="grid gap-[30px] md:grid-cols-2 lg:grid-cols-3">

              {latestCertifications.map(
                (certification) => (
                  <CertificationCard
                    key={certification.id}
                    certification={certification}
                  />
                )
              )}

            </div>
          )}

        </div>
      </section>

      <Footer />

    </div>
  );
}

function CertificationCard({ certification }) {
  return (
    <div className="flex min-h-[262px] flex-col overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07)]">

      <div className="flex-1 px-5 pt-5">

        <div className="flex items-center justify-between">

          <Badge
            variant={
              certification.type === "Licence"
                ? "green"
                : "blue"
            }
          >
            {certification.type}
          </Badge>

          <span className="text-[13px] text-slate-500">
            {certification.mode}
          </span>

        </div>

        <h3 className="mt-3 text-[19px] font-bold leading-[24px] text-[#0F172A]">
          {certification.title}
        </h3>

        <p className="mt-2 flex items-center gap-1 text-[14px] text-slate-600">
          <BuildingIcon />
          {certification.organization}
        </p>

        <p className="mt-4 text-[15px] leading-[22px] text-slate-500">
          {certification.description}
        </p>

      </div>

      <div className="flex h-[51px] items-center justify-between border-t border-slate-100 bg-[#F8FAFC] px-5">

        <span className="rounded-[4px] bg-slate-200 px-2.5 py-1 text-[12px] text-slate-600">
          {certification.sector}
        </span>

      <Link
                          to={
                              `/certification/${certification.id}`
                          }
                          className="
                              flex
                              items-center
                              gap-1
                              text-[14px]
                              font-semibold
                              text-emerald-700
                          "
                      >
                          Détails
                          <ArrowRight />
                      </Link>

      </div>
    </div>
  );
}