import React from 'react';
import { OpportunityCard } from './OpportunityCard';
import { Inbox } from 'lucide-react';

export const OpportunityList = ({ opportunities, lastUpdated, onSelectOpportunity }) => {
  return (
    <div className="flex-1 flex flex-col gap-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {opportunities.length} Opportunité{opportunities.length > 1 ? 's' : ''} trouvée{opportunities.length > 1 ? 's' : ''}
        </h1>
        <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-2xs w-fit">
          Dernière mise à jour: <span className="font-semibold text-gray-700">{lastUpdated}</span>
        </div>
      </div>

      {/* Grid of opportunities */}
      {opportunities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Aucune opportunité trouvée</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Essayez de modifier vos filtres de recherche ou de réinitialiser pour voir toutes les offres disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <OpportunityCard 
              key={opp.id} 
              opportunity={opp} 
              onSelect={onSelectOpportunity} 
            />
          ))}
        </div>
      )}

    </div>
  );
};
