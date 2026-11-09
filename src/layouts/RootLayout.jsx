import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AlertsModal } from '../components/AlertsModal';
import { RadarAiModal } from '../components/RadarAiModal';
import { CvScoringModal } from '../components/CvScoringModal';

export const RootLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTabFromPath = (path) => {
    if (path.startsWith('/trends')) return 'trends';
    if (path.startsWith('/partners')) return 'partners';
    if (path.startsWith('/formations')) return 'formations';
    if (path.startsWith('/opportunities')) return 'opportunities';
    return 'home';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleTabChange = (tab) => {
    if (tab === 'opportunities') navigate('/opportunities');
    else if (tab === 'trends') navigate('/trends');
    else if (tab === 'partners') navigate('/partners');
    else if (tab === 'formations') navigate('/formations');
    else navigate('/');
  };

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCvScoringOpen, setIsCvScoringOpen] = useState(false);
  const [scoringJob, setScoringJob] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet 
          context={{ 
            openCvScoring: (job) => { setScoringJob(job); setIsCvScoringOpen(true); },
            openAi: () => setIsAiOpen(true)
          }} 
        />
      </main>

      <Footer />

      <AlertsModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
      <RadarAiModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      <CvScoringModal
        isOpen={isCvScoringOpen}
        onClose={() => { setIsCvScoringOpen(false); setScoringJob(null); }}
        selectedJob={scoringJob}
      />
    </div>
  );
};
