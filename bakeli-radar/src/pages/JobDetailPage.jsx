import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, MapPin, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openCvScoring } = useOutletContext();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => apiService.getOpportunities({}),
  });

  const opportunities = data?.data || [];
  const opportunity = opportunities.find((o) => String(o.id) === String(id)) || opportunities[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Chargement des détails de l'offre...
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Offre introuvable</h2>
        <button
          onClick={() => navigate('/opportunities')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Retour aux offres
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6 animate-fadeIn">
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 w-fit cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux opportunités</span>
      </button>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{opportunity.title}</h1>
              <p className="text-base text-gray-600 font-medium">{opportunity.company}</p>
            </div>
          </div>
          <button
            onClick={() => openCvScoring(opportunity)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer w-fit"
          >
            <Sparkles className="w-5 h-5" />
            <span>Scorer mon CV avec l'IA</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-100">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-100">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{opportunity.date}</span>
          </div>
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold text-xs flex items-center">
            {opportunity.type}
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <h3 className="font-bold text-gray-900 text-base">Description de l'offre</h3>
          <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">{opportunity.description}</p>
        </div>

        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <h3 className="font-bold text-gray-900 text-base">Compétences clés / Tags</h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold border border-gray-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {opportunity.offer_url && (
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <a
              href={opportunity.offer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <span>Voir l'offre originale</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
