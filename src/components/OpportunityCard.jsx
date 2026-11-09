import React from 'react';
import { Building2, MapPin, Calendar, ChevronRight } from 'lucide-react';

export const OpportunityCard = ({ opportunity, onSelect }) => {
  const { title, company, type, description, tags, location, date, highlighted } = opportunity;

  // Badge styling based on type
  const getBadgeStyle = (t) => {
    switch (t?.toLowerCase()) {
      case 'emploi':
        return 'bg-blue-50 text-blue-600 border border-blue-200/60';
      case 'stage':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200/60';
      case 'bourse':
        return 'bg-purple-50 text-purple-600 border border-purple-200/60';
      case 'concours':
        return 'bg-rose-50 text-rose-600 border border-rose-200/60';
      case 'prestation':
        return 'bg-slate-100 text-slate-700 border border-slate-200/60';
      case 'formation':
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200/60';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div 
      onClick={() => onSelect && onSelect(opportunity)}
      className={`bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg flex flex-col justify-between cursor-pointer group relative ${
        highlighted 
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
          : 'border-gray-100 hover:border-emerald-200'
      }`}
    >
      <div>
        {/* Top row: Company Icon/Name & Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-500 font-medium">{company}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${getBadgeStyle(type)}`}>
            {type}
          </span>
        </div>

        {/* Description compacte (max 2 lignes) */}
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
          {description || "Aucune description détaillée fournie pour cette offre."}
        </p>

        {/* Tags compacts (max 3 affichés pour garder la carte courte) */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 max-h-[3.5rem] overflow-hidden">
            {tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[10px]">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Location, Date & View */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{date}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
          <span>Voir</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
};
