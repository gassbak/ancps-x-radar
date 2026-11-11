import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MarketTrends } from '../components/MarketTrends';
import { apiService } from '../services/api';

export const MarketInsightsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['marketInsights'],
    queryFn: () => apiService.getMarketInsights(),
  });

  const marketStats = data?.data || { typesDistribution: [], topRegions: [] };
  const kpis = {
    totalJobs: data?.totalJobs || 0,
    newJobs: data?.newJobs ?? null,
    sectorsCount: data?.sectorsCount || 0,
    topSectorShare: data?.topSectorShare ?? null,
    shareRealDescriptions: data?.shareRealDescriptions ?? null,
    sourcesCount: data?.sourcesCount ?? null,
    lastUpdate: data?.lastUpdate,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Chargement des tendances du marché...</div>;
  }

  return (
    <div className="py-6 animate-fadeIn">
      <MarketTrends marketStats={marketStats} kpis={kpis} />
    </div>
  );
};
