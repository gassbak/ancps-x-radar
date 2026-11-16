import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6 lg:px-8 mt-12 flex flex-col items-center justify-center text-center gap-3">
      <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
        <img src="/logo_bakeli.png" alt="Bakeli Radar" className="w-6 h-6 rounded-md object-contain shadow-xs" />
        <span>Bakeli Radar</span>
      </div>

      <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium">
        <p>La plateforme de référence pour l'employabilité des jeunes au Sénégal.</p>
        <p>Une initiative propulsée par Bakeli School of Technology.</p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 text-xs text-gray-400">
        <span>© 2024 Bakeli Sénégal. Tous droits réservés.</span>
      </div>
    </footer>
  );
};
