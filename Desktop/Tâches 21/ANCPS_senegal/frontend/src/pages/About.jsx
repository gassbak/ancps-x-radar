import { Link } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[900px] px-6 pt-24 pb-[58px]">
          
          <section>
            <h1 className="text-[32px] font-bold leading-[1.2] tracking-[-0.5px] text-[#0F172A] mt-4">
              À propos du projet
            </h1>

            <p className="mt-6 text-[18px] leading-[1.55] text-[#1E3A5F]">
              L'Annuaire National des Certifications Professionnelles du
              Sénégal (ANCPS) est une initiative privée opérée par{" "}
              <strong className="font-bold text-[#1E293B]">
                Bakeli
              </strong>
              , visant à centraliser et valoriser l'offre de formation
              professionnelle au Sénégal.
            </p>

            <p className="mt-5 text-[18px] leading-[1.55] text-[#1E3A5F]">
              Inspiré du modèle RNCP, cette plateforme permet aux étudiants,
              professionnels et recruteurs de :
            </p>

            <ul className="mt-4 list-disc space-y-3 pl-5 text-[17px] leading-[1.45] text-[#1E3A5F]">
              <li>Vérifier la validité d'une certification.</li>
              <li>
                Comprendre les compétences visées par une formation.
              </li>
              <li>
                Identifier les organismes de formation accrédités.
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-[26px] font-bold leading-[1.25] text-[#0F172A]">
              Comment enregistrer une certification ?
            </h2>

            <p className="mt-5 text-[17px] leading-[1.5] text-[#1E3A5F]">
              Les organismes de formation souhaitant référencer leurs titres
              doivent faire une demande via notre{" "}
              <Link
                to="/login"
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                Espace Pro
              </Link>
              .
              <br />
              Chaque dossier est audité pour garantir la qualité du
              référentiel.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}