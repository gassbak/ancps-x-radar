import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PartnersView } from '../components/PartnersView';
import { apiService } from '../services/api';

export const PartnersPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => apiService.getPartners(),
  });

  const partners = data?.data || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Chargement des partenaires...</div>;
  }

  return (
    <div className="py-6 animate-fadeIn">
      <PartnersView partners={partners} />
    </div>
  );
};
