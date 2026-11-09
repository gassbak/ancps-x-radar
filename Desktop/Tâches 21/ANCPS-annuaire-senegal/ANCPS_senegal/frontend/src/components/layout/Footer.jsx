export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white">

      <div className="mx-auto grid max-w-[1220px] gap-10 px-8 py-[43px] md:grid-cols-3">

        {/* ANCPS */}
        <div>
          <h3 className="text-[18px] font-bold">
            ANCPS
          </h3>

          <p className="mt-5 max-w-[365px] text-[15px] leading-[21px] text-slate-400">
            Le répertoire de référence des certifications
            professionnelles au Sénégal. Une initiative pour
            valoriser les compétences et faciliter
            l'employabilité.
          </p>
        </div>

        {/* LIENS */}
        <div>
          <h3 className="text-[18px] font-bold">
            Liens Utiles
          </h3>

          <div className="mt-5 space-y-3 text-[14px] text-slate-300">

            <p className="cursor-pointer hover:text-white">
              Rechercher une formation
            </p>

            <p className="cursor-pointer hover:text-white">
              Comment ça marche ?
            </p>

            <p className="cursor-pointer hover:text-white">
              Espace Certificateurs
            </p>

          </div>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="text-[18px] font-bold">
            Contact
          </h3>

          <div className="mt-5 space-y-1 text-[14px] text-slate-400">
            <p>Dakar, Sénégal</p>
            <p>contact@ancps.sn</p>
          </div>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-slate-700/70">
        <div className="py-[32px] text-center text-[14px] text-slate-500">
          © 2026 ANCPS Sénégal. Opéré par Bakeli.
        </div>
      </div>

    </footer>
  );
}