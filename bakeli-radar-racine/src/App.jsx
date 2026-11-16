import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { MarketInsightsPage } from './pages/MarketInsightsPage';
import { PartnersPage } from './pages/PartnersPage';
import { FormationsPage } from './pages/FormationsPage';
import { FormationDetailPage } from './pages/FormationDetailPage';

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<OpportunitiesPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/:id" element={<JobDetailPage />} />
        <Route path="/trends" element={<MarketInsightsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/formations" element={<FormationsPage />} />
        <Route path="/formations/:id" element={<FormationDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
