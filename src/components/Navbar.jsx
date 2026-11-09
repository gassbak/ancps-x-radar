import React, { useState } from 'react';
import { Bell, Sparkles, Menu, X } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenAlerts, onOpenAi }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('opportunities')}>
          <img src="/logo_bakeli.png" alt="Bakeli Radar" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Bakeli<span className="text-emerald-600">Radar</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick('opportunities')}
            className={`font-medium transition-colors cursor-pointer ${
              activeTab === 'opportunities' 
                ? 'text-emerald-600 font-semibold' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Opportunités
          </button>
          <button
            onClick={() => handleNavClick('trends')}
            className={`font-medium transition-colors cursor-pointer ${
              activeTab === 'trends' 
                ? 'text-emerald-600 font-semibold' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tendances Marché
          </button>
          <button
            onClick={() => handleNavClick('partners')}
            className={`font-medium transition-colors cursor-pointer ${
              activeTab === 'partners' 
                ? 'text-emerald-600 font-semibold' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Partenaires
          </button>
          <button
            onClick={() => handleNavClick('formations')}
            className={`font-medium transition-colors cursor-pointer ${
              activeTab === 'formations'
                ? 'text-emerald-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Formations & Certifications
          </button>
        </nav>

        {/* Actions (Alerts, CV Score, Radar AI) & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenAlerts}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-emerald-100 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/60 font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
            title="Alertes"
          >
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Alertes</span>
          </button>

          <button
            onClick={onOpenAi}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition-all shadow-md hover:shadow-lg transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Radar AI</span>
          </button>

          {/* Mobile menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer ml-1"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 flex flex-col gap-3 animate-fadeIn shadow-lg">
          <button
            onClick={() => handleNavClick('opportunities')}
            className={`text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'opportunities' 
                ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Opportunités
          </button>
          <button
            onClick={() => handleNavClick('trends')}
            className={`text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'trends' 
                ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tendances Marché
          </button>
          <button
            onClick={() => handleNavClick('partners')}
            className={`text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'partners' 
                ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Partenaires
          </button>
          <button
            onClick={() => handleNavClick('formations')}
            className={`text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'formations'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Formations & Certifications
          </button>
        </div>
      )}
    </header>
  );
};
