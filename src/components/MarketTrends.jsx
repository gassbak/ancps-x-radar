import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MapPin, AlertCircle, Briefcase, Sparkles, GraduationCap, Trophy } from 'lucide-react';

export const MarketTrends = ({ marketStats, kpis = {} }) => {
  const typesDistribution = marketStats?.typesDistribution || [];
  const topRegions = marketStats?.topRegions || [];
  const topSkills = marketStats?.topSkills || [];
  const contracts = marketStats?.contracts || [];
  const topCompanies = marketStats?.topCompanies || [];
  const sectorsDist = marketStats?.sectorsDist || [];

  // KPIs orientés candidat, dérivés des données déjà chargées
  const stagesCount = typesDistribution.find((t) => t.name?.toLowerCase() === 'stage')?.count ?? 0;
  const isPlaceholder = (name) => !name || ['non spécifié', 'non spécifiée', 'nan', 'none', 'n/a', ''].includes(String(name).trim().toLowerCase());
  const topSector = [...sectorsDist].filter((s) => !isPlaceholder(s.name)).sort((a, b) => b.value - a.value)[0];
  const dakarCount = topRegions.find((r) => r.name?.toLowerCase() === 'dakar')?.value ?? 0;
  const dakarShare = kpis.totalJobs ? Math.round((dakarCount / kpis.totalJobs) * 100) : null;

  const kpiCards = [
    { icon: Briefcase, label: "Offres actives", value: kpis.totalJobs ?? 0, suffix: "" },
    { icon: Sparkles, label: "Nouvelles offres", value: kpis.newJobs ?? "—", suffix: "" },
    { icon: GraduationCap, label: "Stages disponibles", value: stagesCount, suffix: "" },
    { icon: Trophy, label: "Secteur qui recrute", value: topSector ? topSector.name : "—", suffix: topSector ? ` (${topSector.value})` : "", small: true },
    { icon: MapPin, label: "Offres à Dakar", value: dakarShare ?? "—", suffix: dakarShare != null ? "%" : "" },
  ];

  return (
    <div className="flex-1 flex flex-col gap-8 animate-fadeIn">

      {/* Title section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          <span>Tendances & Statistiques</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Insight du Marché
        </h1>
        <p className="text-gray-500 text-base">
          Analyse en temps réel des opportunités disponibles au Sénégal.
          {kpis.lastUpdate && <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-lg">MAJ : {kpis.lastUpdate}</span>}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <kpi.icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`${kpi.small ? 'text-base' : 'text-xl'} font-extrabold text-gray-900 truncate`}>{kpi.value}{kpi.suffix}</span>
              <span className="text-xs text-gray-500 font-medium truncate">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart: Répartition par Type */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              Répartition par Type
            </h3>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {typesDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-sm">
                <AlertCircle className="w-8 h-8 text-gray-300 animate-pulse" />
                <span>Chargement des données ou aucune donnée disponible...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typesDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 500 }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                  >
                    {typesDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Doughnut Chart: Top Régions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Top Régions
            </h3>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            {topRegions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400 text-sm">
                <AlertCircle className="w-8 h-8 text-gray-300 animate-pulse" />
                <span>Chargement des données ou aucune donnée disponible...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topRegions}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {topRegions.map((entry, index) => (
                      <Cell key={`region-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom Legend */}
          {topRegions.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2">
              {topRegions.map((reg, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: reg.color }}></span>
                  <span>{reg.name} ({reg.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Second row: Top compétences + Contrats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top compétences */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            Compétences les plus demandées
          </h3>
          <div className="h-72 w-full">
            {topSkills.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 text-sm">
                <AlertCircle className="w-8 h-8 text-gray-300" />
                <span>Aucune donnée de compétences.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkills} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                    {topSkills.map((entry, index) => (
                      <Cell key={`skill-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Contrats + Top entreprises */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-500 inline-block"></span>
              Types de contrat
            </h3>
            {contracts.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée de contrat.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {contracts.map((c, idx) => {
                  const max = Math.max(...contracts.map((x) => x.value), 1);
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-700 w-36 truncate">{c.name}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(c.value / max) * 100}%`, backgroundColor: c.color }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 w-8 text-right">{c.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Top recruteurs
            </h3>
            {topCompanies.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée entreprise.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {topCompanies.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">{c.value} offres</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
