import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SidebarFilters } from '../components/SidebarFilters';
import { OpportunityList } from '../components/OpportunityList';
import { apiService } from '../services/api';

const getCertificationLabel = (value) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const label = value.nom || value.name || value.title;
    return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
  }
  return '';
};

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

  const showingCertifications = filters.type === 'Certifications';
  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => apiService.getOpportunities(filters),
    enabled: !showingCertifications,
    keepPreviousData: true,
  });
  const certificationsQuery = useQuery({
    queryKey: ['certifications'],
    queryFn: () => apiService.getCertifications(),
    enabled: showingCertifications,
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

  const certifications = certificationsQuery.data || [];
  const certificationOpportunities = certifications.map((certification, index) => {
    const sigle = getCertificationLabel(certification.sigle);
    const title = getCertificationLabel(certification.title) || sigle || 'Certification';
    const tags = [
      sigle,
      getCertificationLabel(certification.domaine),
      getCertificationLabel(certification.niveauSortie || certification.niveauEntree),
      getCertificationLabel(certification.modalite),
      getCertificationLabel(certification.duree),
    ].filter(Boolean);

    return {
      id: String(certification._id || certification.id || `${title}-${index}`),
      title,
      company: getCertificationLabel(certification.organisme) || 'Organisme non précisé',
      type: 'Certification',
      description: getCertificationLabel(certification.description),
      tags,
      location: 'Non précisé',
      date: 'Certification',
      highlighted: false,
    };
  });
  const matchingCertifications = filters.search
    ? certificationOpportunities.filter((certification) =>
        [
          certification.title,
          certification.company,
          certification.description,
          ...certification.tags,
        ].some((value) => value.toLowerCase().includes(filters.search.toLowerCase()))
      )
    : certificationOpportunities;
  const opportunities = showingCertifications
    ? matchingCertifications
    : opportunitiesQuery.data?.data || [];
  const isLoading = showingCertifications
    ? certificationsQuery.isLoading
    : opportunitiesQuery.isLoading;
  const error = showingCertifications
    ? certificationsQuery.error
    : opportunitiesQuery.error;
  const lastUpdated = showingCertifications
    ? 'Annuaire ANCPS'
    : opportunitiesQuery.data?.lastUpdated || "Aujourd'hui";

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
