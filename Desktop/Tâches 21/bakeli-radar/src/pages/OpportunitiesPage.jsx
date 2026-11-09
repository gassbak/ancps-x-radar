import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SidebarFilters } from '../components/SidebarFilters';
import { OpportunityList } from '../components/OpportunityList';
import { apiService } from '../services/api';

export const OpportunitiesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const companyParam = searchParams.get('company') || '';

  const { openAi } = useOutletContext();
  const [filters, setFilters] = useState({
    search: searchParam,
    company: companyParam,
    type: 'Tout voir',
    location: 'Toute les régions'
  });

  useEffect(() => {
    const s = searchParams.get('search') || '';
    const c = searchParams.get('company') || '';
    if (s !== filters.search || c !== filters.company) {
      setFilters(prev => ({ ...prev, search: s, company: c }));
    }
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => apiService.getOpportunities(filters),
    keepPreviousData: true,
  });

  const handleResetFilters = () => {
    setFilters({
      search: '',
      company: '',
      type: 'Tout voir',
      location: 'Toute les régions'
    });
    setSearchParams({});
  };

  const opportunities = data?.data || [];
  const lastUpdated = data?.lastUpdated || "Aujourd'hui";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start py-2 animate-fadeIn">
      <SidebarFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
        onOpenAi={openAi}
      />
      <OpportunityList
        opportunities={opportunities}
        lastUpdated={lastUpdated}
        loading={isLoading}
        error={error?.message}
        onSelectOpportunity={(opp) => {
          navigate(`/opportunities/${opp.id}`);
        }}
      />
    </div>
  );
};
