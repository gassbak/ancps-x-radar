import React from 'react';
import { Search, RotateCcw, MapPin, Sparkles, HelpCircle, Filter } from 'lucide-react';

const OFFER_TYPES = [
  "Tout voir",
  "Emploi",
  "Stage",
  "Bourse",
  "Concours",
  "Prestation",
  "Formation"
];

const REGIONS = [
  "Toute les régions",
  "Dakar",
  "Saint-Louis",
  "Thiès",
  "Ziguinchor",
  "Remote"
];

export const SidebarFilters = ({ filters, onFilterChange, onReset, onOpenAi }) => {
  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col gap-4 shrink-0 sticky top-28">
      
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtres</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Réinitialiser
        </button>
      </div>

      {/* Search Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Recherche</label>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Mots-clés, entreprise..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Type d'offre */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Type d'offre</label>
        <div className="flex flex-col gap-1.5">
          {OFFER_TYPES.map((type) => {
            const isChecked = filters.type === type;
            return (
              <label 
                key={type} 
                className="flex items-center gap-2.5 cursor-pointer group text-xs sm:text-sm text-gray-700 hover:text-gray-900 py-0.5"
              >
                <input
                  type="radio"
                  name="offerType"
                  checked={isChecked}
                  onChange={() => onFilterChange({ ...filters, type })}
                  className="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span className={isChecked ? "font-semibold text-emerald-700" : "font-normal"}>
                  {type}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Localisation */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Localisation</label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
            className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer text-gray-700"
          >
            {REGIONS.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
        </div>
      </div>

      {/* AI Help Box (Besoin d'aide ?) */}
      <div className="p-4 bg-emerald-800 rounded-2xl text-white flex flex-col gap-2.5 shadow-md relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-700 rounded-full opacity-50 pointer-events-none"></div>
        <div className="flex items-center gap-2 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-emerald-200" />
          <span>Besoin d'aide ?</span>
        </div>
        <p className="text-[11px] text-emerald-100 leading-relaxed">
          Laisse notre IA t'aider à trouver le match parfait.
        </p>
        <button
          onClick={onOpenAi}
          className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-900 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lancer Radar AI</span>
        </button>
      </div>

    </aside>
  );
};
