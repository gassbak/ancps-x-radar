import React, { useState, useEffect } from 'react';
import { FileUp, X, Sparkles, CheckCircle2, AlertCircle, Award, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export const CvScoringModal = ({ isOpen, onClose, selectedJob }) => {
  // job scrapé pré-sélectionné depuis OpportunityCard
  // offer_url préféré (stable après re-scraping), fallback id numérique
  const scrapedJobId = selectedJob ? String(selectedJob.offer_url ?? selectedJob.id ?? "") : null;
  const scrapedJobLabel = selectedJob ? `${selectedJob.title || "Offre"} — ${selectedJob.company || ""}` : null;
  const scrapedJobIsUrl = scrapedJobId ? scrapedJobId.startsWith("http") : false;

  // Scoring state (sans compte : upload CV + offre, anonyme)
  const [cvFile, setCvFile] = useState(null);
  const [jobFile, setJobFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // reset résultat quand on ouvre / change d'offre
      setResult(null);
      setError(null);
    }
  }, [isOpen, selectedJob]);

  const handleDirectMatch = async (e) => {
    e.preventDefault();
    // Mode scrapé : offre déjà sélectionnée -> un seul fichier CV + job_id (offer_url)
    if (scrapedJobId) {
      if (!cvFile) {
        setError("Veuillez sélectionner votre CV.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Tentative 1: offer_url (stable), Tentative 2: id si échec
        let res;
        try {
          res = await apiService.analyzeScrapedPublic(scrapedJobId, cvFile);
        } catch (err) {
          if (scrapedJobIsUrl && selectedJob?.id != null && String(err.message).includes("non trouvée")) {
            res = await apiService.analyzeScrapedPublic(String(selectedJob.id), cvFile);
          } else {
            throw err;
          }
        }
        setResult(res.result || res);
      } catch (err) {
        setError(err.message || "Erreur lors de l'analyse scrapée.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!cvFile || !jobFile) {
      setError("Veuillez sélectionner un CV et une offre.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.matchCvFile(cvFile, jobFile);
      setResult(res.result || res);
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-[95vw] sm:max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-6 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Analyse & Scoring CV (IA)</h3>
              <p className="text-xs text-emerald-200 font-medium">Matching intelligent CV / offre</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-emerald-700/60 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bandeau offre scrapée sélectionnée */}
        {selectedJob && (
          <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Offre sélectionnée</span>
              <p className="text-sm font-bold text-emerald-900 line-clamp-2">{scrapedJobLabel}</p>
              <p className="text-xs text-emerald-700/70 break-all">{scrapedJobIsUrl ? `URL: ${scrapedJobId.slice(0,60)}…` : `ID: ${scrapedJobId}`} • {selectedJob.location || ""} • {selectedJob.type || ""}</p>
              {selectedJob.offer_url && <a href={selectedJob.offer_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline">Voir l'offre originale</a>}
            </div>
            <span className="px-2.5 py-1 bg-white border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 whitespace-nowrap">Scrapée</span>
          </div>
        )}

        {/* Body : scoring uniquement, sans compte */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 bg-gray-50/50 flex-1">

          {result ? (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Score de Correspondance</span>
                    <h4 className="text-3xl font-extrabold text-emerald-900">{result.score}%</h4>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                    <Award className="w-8 h-8" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-2">
                  <h5 className="font-bold text-gray-900 text-sm">Évaluation générale</h5>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.description}</p>
                </div>

                {result.matching_analysis && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-3">
                    <h5 className="font-bold text-gray-900 text-sm">Compétences correspondantes</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.matching_analysis.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendation && (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col gap-2">
                    <h5 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Recommandations</span>
                    </h5>
                    <p className="text-sm text-amber-800 leading-relaxed">{result.recommendation}</p>
                  </div>
                )}

                <button
                  onClick={() => setResult(null)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Nouvelle analyse
                </button>
              </div>
            ) : (
              <form onSubmit={handleDirectMatch} className="flex flex-col gap-5">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Votre CV (PDF / DOCX — max 5 Mo)</label>
                  <label className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer transition-colors">
                    <FileUp className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{cvFile ? cvFile.name : "Importer votre CV"}</span>
                    <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={(e) => setCvFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>

                {scrapedJobId ? (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-xs font-bold text-emerald-700">Offre utilisée</span>
                    <span className="text-sm text-gray-700">{scrapedJobLabel}</span>
                    <span className="text-xs text-gray-500">Vous n'avez plus qu'à déposer votre CV — l'offre est déjà chargée.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Offre d'emploi (Fichier)</label>
                    <label className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer transition-colors">
                      <FileUp className="w-8 h-8 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{jobFile ? jobFile.name : "Importer l'offre"}</span>
                      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setJobFile(e.target.files[0])} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-400">Astuce : cliquez sur <b>Scorer mon CV sur cette offre</b> depuis une carte pour pré-remplir l'offre scrapée.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span>Analyser mon CV</span>
                </button>
              </form>
            )
          }

        </div>

      </div>
    </div>
  );
};
