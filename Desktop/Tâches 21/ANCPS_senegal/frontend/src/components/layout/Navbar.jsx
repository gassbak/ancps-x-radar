
import { useState } from "react";
import { Link } from "react-router-dom";

function LogoIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4.5C4 3.67 4.67 3 5.5 3H18.5C19.33 3 20 3.67 20 4.5V19.5C20 20.33 19.33 21 18.5 21H5.5C4.67 21 4 20.33 4 19.5V4.5Z"
          stroke="white"
          strokeWidth="1.7"
        />

        <path
          d="M8 7H16M8 11H16M8 15H13"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-[#064E3B] text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">

      {/* BARRE PRINCIPALE */}
      <div className="mx-auto flex h-[74px] max-w-[1220px] items-center px-6 md:px-8">

        {/* LOGO */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2.5"
        >
          <LogoIcon />

          <span className="text-[20px] font-bold tracking-[-0.3px]">
            ANCPS
          </span>
        </Link>

        {/* NAVIGATION DESKTOP */}
        <nav className="ml-[68px] hidden items-center gap-[38px] md:flex">

          {/* ACCUEIL */}
          <Link
            to="/Home"
            className="text-[15px] font-semibold transition hover:text-yellow-300"
          >
            Accueil
          </Link>

          {/* ANNUAIRE */}
          <Link
            to="/annuaire"
            className="text-[15px] font-semibold transition hover:text-yellow-300"
          >
            L'Annuaire
          </Link>

          {/* À PROPOS */}
          <Link
            to="/about"
            className="text-[15px] font-semibold transition hover:text-yellow-300"
          >
            À propos
          </Link>

        </nav>

        {/* ESPACE PRO DESKTOP */}
        <Link
          to="/admin"
          className="ml-auto hidden rounded-[7px] bg-[#FBBF00] px-[18px] py-[9px] text-[14px] font-bold text-[#073B2D] transition hover:bg-[#F5B900] md:block"
        >
          Espace Pro
        </Link>

        {/* BOUTON HAMBURGER MOBILE */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 md:hidden"
          aria-label="Ouvrir le menu"
        >
          {menuOpen ? (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 6L18 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M18 6L6 18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 7H20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M4 12H20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M4 17H20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* MENU MOBILE */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#064E3B] px-6 pb-5 pt-3 md:hidden">

          <nav className="flex flex-col">

            <Link
              to="/Home"
              onClick={closeMenu}
              className="border-b border-white/10 py-4 text-[15px] font-semibold transition hover:text-yellow-300"
            >
              Accueil
            </Link>

            <Link
              to="/annuaire"
              onClick={closeMenu}
              className="border-b border-white/10 py-4 text-[15px] font-semibold transition hover:text-yellow-300"
            >
              L'Annuaire
            </Link>

            <Link
              to="/about"
              onClick={closeMenu}
              className="border-b border-white/10 py-4 text-[15px] font-semibold transition hover:text-yellow-300"
            >
              À propos
            </Link>

            <Link
              to="/admin"
              onClick={closeMenu}
              className="mt-4 rounded-[7px] bg-[#FBBF00] px-4 py-3 text-center text-[14px] font-bold text-[#073B2D] transition hover:bg-[#F5B900]"
            >
              Espace Pro
            </Link>

          </nav>
        </div>
      )}
    </header>
  );
}

